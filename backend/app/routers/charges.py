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


import os
import uuid
import aiofiles
from fastapi import UploadFile, File
from app.core.config import get_settings
from fastapi import HTTPException

settings = get_settings()

@router.post("/circles/{circle_id}/upload-proof")
async def upload_proof(
    circle_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> dict:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")

    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"charge_{uuid.uuid4()}.{ext}"
    save_path = os.path.join(settings.UPLOAD_DIR, filename)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    async with aiofiles.open(save_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return {"url": f"/uploads/{filename}"}
