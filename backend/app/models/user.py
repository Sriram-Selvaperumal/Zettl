from datetime import datetime, timezone

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class User(Document):
    name: str
    username: str
    email: str
    password_hash: str
    avatar_url: str | None = None
    mobile: str | None = None
    upi_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = [
            IndexModel("email", unique=True),
            IndexModel("username", unique=True),
        ]

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Arjun Sharma",
                "email": "arjun@example.com",
            }
        }
