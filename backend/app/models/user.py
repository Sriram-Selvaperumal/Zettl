from datetime import datetime, timezone

from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel


class User(Document):
    name: str
    email: Indexed(str, unique=True)  # type: ignore[valid-type]
    password_hash: str
    avatar_url: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = [
            IndexModel("email", unique=True),
        ]

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Arjun Sharma",
                "email": "arjun@example.com",
            }
        }
