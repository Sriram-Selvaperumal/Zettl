from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Request Schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    otp: str = Field(..., min_length=6, max_length=6)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be blank")
        return v.strip()

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        import re
        v = v.strip().lower()
        if not re.match(r'^[a-z0-9_]+$', v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        if v.startswith('_') or v.endswith('_'):
            raise ValueError("Username cannot start or end with an underscore")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    mobile: str | None = Field(default=None, max_length=15)
    upi_id: str | None = Field(default=None, max_length=50)


class RefreshRequest(BaseModel):
    """Used when refresh token is passed in body (fallback — cookie is preferred)."""
    refresh_token: str


# ─── Response Schemas ─────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    name: str
    username: str
    email: str
    avatar_url: str | None
    mobile: str | None
    upi_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
