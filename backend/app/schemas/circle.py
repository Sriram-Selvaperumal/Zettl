from datetime import datetime

from pydantic import BaseModel, Field


# ─── Request Schemas ──────────────────────────────────────────────────────────

class CreateCircleRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    description: str = Field(default="", max_length=300)


class JoinCircleRequest(BaseModel):
    invite_code: str = Field(..., min_length=6)


# ─── Response Schemas ─────────────────────────────────────────────────────────

class CircleMemberResponse(BaseModel):
    user_id: str
    name: str
    email: str
    avatar_url: str | None
    role: str
    joined_at: datetime


class CircleResponse(BaseModel):
    id: str
    name: str
    description: str
    invite_code: str
    member_count: int
    your_role: str
    created_at: datetime


class CircleDetailResponse(BaseModel):
    id: str
    name: str
    description: str
    invite_code: str
    created_at: datetime
    members: list[CircleMemberResponse]
