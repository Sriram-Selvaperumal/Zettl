from datetime import datetime, timezone
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel


class Proof(BaseModel):
    type: Literal["image", "upi"]
    url: str | None = None       # Local path or Cloudinary URL (image)
    upi_ref: str | None = None   # UPI transaction reference (upi)


class SplitEntry(BaseModel):
    user_id: PydanticObjectId
    amount_due: float
    status: Literal["pending", "cleared"] = "pending"


class Charge(Document):
    circle_id: PydanticObjectId
    title: str
    description: str = ""
    payer_id: PydanticObjectId
    total_amount: float
    split_type: Literal["equal", "custom"]
    proof: Proof
    splits: list[SplitEntry] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "charges"
        indexes = [
            IndexModel("circle_id"),
            IndexModel("payer_id"),
        ]
