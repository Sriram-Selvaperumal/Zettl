from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProofInput(BaseModel):
    type: Literal["image", "upi"]
    url: str | None = None
    upi_ref: str | None = None


class CreateChargeRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    description: str = Field(default="", max_length=500)
    total_amount: float = Field(..., gt=0)
    split_type: Literal["equal", "custom"]
    proof: ProofInput
    involved_user_ids: list[str] | None = None
    custom_splits: dict[str, float] | None = None


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
    proof: ProofInput
    splits: list[SplitEntryResponse]
    created_at: datetime
