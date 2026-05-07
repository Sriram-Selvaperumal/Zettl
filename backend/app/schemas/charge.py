from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ─── Response Schemas ─────────────────────────────────────────────────────────

class ProofResponse(BaseModel):
    type: Literal["image", "upi"]
    url: str | None = None
    upi_ref: str | None = None


class SplitEntryResponse(BaseModel):
    user_id: str
    user_name: str
    amount_due: float
    status: Literal["pending", "cleared"]


class ChargeResponse(BaseModel):
    id: str
    circle_id: str
    title: str
    description: str
    payer_id: str
    payer_name: str
    total_amount: float
    split_type: Literal["equal", "custom"]
    proof: ProofResponse
    splits: list[SplitEntryResponse]
    created_at: datetime
