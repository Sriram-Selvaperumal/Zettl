from fastapi import HTTPException, status

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories import user_repo
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )


async def register(req: RegisterRequest) -> User:
    existing = await user_repo.get_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    hashed = hash_password(req.password)
    user = await user_repo.create(
        name=req.name,
        email=req.email,
        password_hash=hashed,
    )
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
