from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()


# ─── Password Hashing ────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ─── JWT Token Creation ───────────────────────────────────────────────────────

def _create_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(data: dict[str, Any]) -> str:
    return _create_token(
        data,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(data: dict[str, Any]) -> str:
    return _create_token(
        data,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


# ─── JWT Token Decoding ───────────────────────────────────────────────────────

def decode_token(token: str) -> dict[str, Any]:
    """
    Decodes a JWT token. Raises ValueError on invalid/expired tokens.
    Callers (dependencies.py) convert this to HTTPException 401.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e
