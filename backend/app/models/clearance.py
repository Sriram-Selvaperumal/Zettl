from datetime import datetime, timezone
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class Clearance(Document):
    charge_id: PydanticObjectId
    from_user_id: PydanticObjectId   # Who paid back
    to_user_id: PydanticObjectId     # The original payer (Charge.payer_id)
    amount: float
    method: Literal["upi", "manual"]
    upi_ref: str | None = None
    proof_url: str | None = None     # Optional screenshot
    status: Literal["pending_confirmation", "confirmed"] = "pending_confirmation"
    confirmed_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "clearances"
        indexes = [
            IndexModel("charge_id"),
            IndexModel("from_user_id"),
            IndexModel([("charge_id", 1), ("from_user_id", 1)]),
        ]
