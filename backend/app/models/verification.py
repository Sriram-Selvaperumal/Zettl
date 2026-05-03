from datetime import datetime
from typing import Annotated

from beanie import Document
from pydantic import BaseModel, EmailStr, Field


from pymongo import IndexModel, ASCENDING

class EmailVerification(Document):
    email: EmailStr
    otp_hash: str
    expires_at: datetime

    class Settings:
        name = "email_verifications"
        indexes = [
            IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0)
        ]


class SendOtpRequest(BaseModel):
    email: EmailStr
