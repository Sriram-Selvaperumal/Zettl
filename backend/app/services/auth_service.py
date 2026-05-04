from fastapi import HTTPException, status

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.models.verification import EmailVerification, SendOtpRequest
from app.repositories import user_repo
from app.schemas.auth import LoginRequest, RegisterRequest, UpdateProfileRequest, UserResponse
from app.services.email_service import send_otp_email
import random
from datetime import datetime, timedelta, timezone


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        mobile=user.mobile,
        upi_id=user.upi_id,
        created_at=user.created_at,
    )


async def update_profile(req: UpdateProfileRequest, current_user: User) -> UserResponse:
    updates = req.model_dump(exclude_none=True)
    user = await user_repo.update_profile(current_user, updates)
    return _to_user_response(user)


async def update_avatar(avatar_url: str, current_user: User) -> UserResponse:
    current_user.avatar_url = avatar_url
    await current_user.save()
    return _to_user_response(current_user)


async def request_otp(req: SendOtpRequest):
    existing = await user_repo.get_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    
    # Generate 6-digit OTP
    otp = f"{random.randint(0, 999999):06d}"
    
    # Optional: hash the OTP if you don't want plaintext OTPs in DB.
    # For simplicity here, we'll store hashed, though plain is fine since it's short-lived.
    hashed_otp = hash_password(otp)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Upsert the OTP document
    verification = await EmailVerification.find_one({"email": req.email})
    if verification:
        verification.otp_hash = hashed_otp
        verification.expires_at = expires_at
        await verification.save()
    else:
        verification = EmailVerification(
            email=req.email,
            otp_hash=hashed_otp,
            expires_at=expires_at
        )
        await verification.insert()
        
    # Send email
    await send_otp_email(req.email, otp)


async def register(req: RegisterRequest) -> User:
    existing = await user_repo.get_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
        
    # Verify OTP
    verification = await EmailVerification.find_one({"email": req.email})
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP requested or OTP has expired",
        )
        
    if not verify_password(req.otp, verification.otp_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP",
        )
        
    hashed = hash_password(req.password)
    user = await user_repo.create(
        name=req.name,
        email=req.email,
        password_hash=hashed,
    )
    
    # Delete the verification doc now that it's used
    await verification.delete()
    
    return user


async def login(req: LoginRequest) -> tuple[str, str]:
    user = await user_repo.get_by_email(req.email)
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token_data = {"sub": str(user.id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return access_token, refresh_token


async def refresh_tokens(refresh_token: str) -> tuple[str, str]:
    try:
        payload = decode_token(refresh_token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise ValueError("Missing subject")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    token_data = {"sub": str(user.id)}
    return create_access_token(token_data), create_refresh_token(token_data)


async def get_me(user: User) -> UserResponse:
    return _to_user_response(user)
