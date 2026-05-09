from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.charge import ChargeResponse, CreateChargeRequest
from app.services import charge_service

router = APIRouter(tags=["Charges"])


@router.post("/circles/{circle_id}/charges", response_model=ChargeResponse, status_code=status.HTTP_201_CREATED)
async def create_charge(
    circle_id: str,
    req: CreateChargeRequest,
    current_user: User = Depends(get_current_user),
) -> ChargeResponse:
    return await charge_service.create_charge(circle_id, req, current_user)


@router.get("/circles/{circle_id}/charges", response_model=list[ChargeResponse])
async def get_circle_charges(
    circle_id: str,
    current_user: User = Depends(get_current_user),
) -> list[ChargeResponse]:
    return await charge_service.get_circle_charges(circle_id, current_user)


@router.get("/charges/{charge_id}", response_model=ChargeResponse)
async def get_charge_detail(
    charge_id: str,
    current_user: User = Depends(get_current_user),
) -> ChargeResponse:
    return await charge_service.get_charge_detail(charge_id, current_user)
