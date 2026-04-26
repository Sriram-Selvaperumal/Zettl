from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_token
from app.models.circle import Circle
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


# ─── Current User ─────────────────────────────────────────────────────────────

async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
) -> User:
    """
    Extracts and validates the Bearer token from the Authorization header.
    Returns the authenticated User document or raises 401.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except ValueError:
        raise credentials_exception

    user = await User.get(user_id)
    if user is None:
        raise credentials_exception

    return user


# ─── Circle Member Check ──────────────────────────────────────────────────────

async def get_circle_member(
    circle_id: str,
    current_user: User = Depends(get_current_user),
) -> Circle:
    """
    Validates that the authenticated user is a member of the specified Circle.
    Returns the Circle document or raises 403/404.
    """
    circle = await Circle.get(circle_id)
    if circle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Circle not found")

    member_ids = [str(m.user_id) for m in circle.members]
    if str(current_user.id) not in member_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this Circle",
        )

    return circle


# ─── Circle Admin Check ───────────────────────────────────────────────────────

async def get_circle_admin(
    circle_id: str,
    current_user: User = Depends(get_current_user),
) -> Circle:
    """
    Validates that the authenticated user is an admin of the specified Circle.
    Returns the Circle document or raises 403/404.
    """
    circle = await Circle.get(circle_id)
    if circle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Circle not found")

    admin_ids = [str(m.user_id) for m in circle.members if m.role == "admin"]
    if str(current_user.id) not in admin_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Circle admins can perform this action",
        )

    return circle


# ─── Refresh Token (from httpOnly Cookie) ────────────────────────────────────

async def get_refresh_token(
    refresh_token: str | None = Cookie(default=None),
) -> str:
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided",
        )
    return refresh_token
