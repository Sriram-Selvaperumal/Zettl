from fastapi import APIRouter, Depends, File, Response, UploadFile, status
import aiofiles, os, uuid

from app.core.dependencies import get_current_user, get_refresh_token
from app.core.config import get_settings
from app.models.user import User
from app.models.verification import SendOtpRequest
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UpdateProfileRequest, UserResponse
from app.services import auth_service

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["Auth"])

REFRESH_COOKIE_KEY = "refresh_token"
COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60  # 7 days


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_KEY,
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=COOKIE_MAX_AGE_SECONDS,
        # secure=True,  # Uncomment in production (HTTPS)
    )


@router.post("/request-otp", status_code=status.HTTP_200_OK)
async def request_otp(req: SendOtpRequest):
    await auth_service.request_otp(req)
    return {"message": "OTP sent successfully"}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest) -> UserResponse:
    user = await auth_service.register(req)
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        mobile=user.mobile,
        upi_id=user.upi_id,
        created_at=user.created_at,
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, response: Response) -> TokenResponse:
    access_token, refresh_token = await auth_service.login(req)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: str = Depends(get_refresh_token),
) -> TokenResponse:
    access_token, new_refresh_token = await auth_service.refresh_tokens(refresh_token)
    _set_refresh_cookie(response, new_refresh_token)
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return await auth_service.get_me(current_user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE_KEY)


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return await auth_service.update_profile(req, current_user)


@router.post("/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Only image files are allowed.")

    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    save_path = os.path.join(settings.UPLOAD_DIR, filename)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    async with aiofiles.open(save_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    avatar_url = f"/uploads/{filename}"
    return await auth_service.update_avatar(avatar_url, current_user)
