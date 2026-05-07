import json
import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status

from app.core.config import get_settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.charge import ChargeResponse, SplitEntryResponse
from app.services import charge_service

settings = get_settings()

router = APIRouter(tags=["Charges"])


@router.post("/circles/{circle_id}/charges", response_model=ChargeResponse, status_code=status.HTTP_201_CREATED)
async def create_charge(
    circle_id: str,
    title: str = Form(...),
    description: str = Form(""),
    total_amount: float = Form(...),
    split_type: str = Form(...),
    member_ids: str = Form(...),  # JSON array string
    custom_shares: str | None = Form(None),  # JSON object string
    proof_type: str = Form(...),
    proof_upi_ref: str | None = Form(None),
    proof_file: UploadFile | None = File(None),
    current_user: User = Depends(get_current_user)
) -> ChargeResponse:
    try:
        parsed_member_ids = json.loads(member_ids)
        if not isinstance(parsed_member_ids, list):
            raise ValueError()
    except Exception:
        raise HTTPException(status_code=400, detail="member_ids must be a valid JSON array of strings.")

    parsed_custom_shares = None
    if custom_shares:
        try:
            parsed_custom_shares = json.loads(custom_shares)
            if not isinstance(parsed_custom_shares, dict):
                raise ValueError()
        except Exception:
            raise HTTPException(status_code=400, detail="custom_shares must be a valid JSON object.")

    proof_url = None
    if proof_type == "image":
        if not proof_file:
            raise HTTPException(status_code=400, detail="proof_file is required when proof_type is 'image'.")
        
        if not proof_file.content_type or not proof_file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed for proof_file.")

        ext = proof_file.filename.split(".")[-1] if proof_file.filename else "jpg"
        filename = f"{uuid.uuid4()}.{ext}"
        save_path = os.path.join(settings.UPLOAD_DIR, filename)

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        async with aiofiles.open(save_path, "wb") as f:
            content = await proof_file.read()
            await f.write(content)

        proof_url = f"/uploads/{filename}"
    elif proof_type == "upi":
        if not proof_upi_ref:
            raise HTTPException(status_code=400, detail="proof_upi_ref is required when proof_type is 'upi'.")
    else:
        raise HTTPException(status_code=400, detail="Invalid proof_type. Must be 'image' or 'upi'.")

    return await charge_service.create_charge(
        circle_id=circle_id,
        title=title,
        description=description,
        total_amount=total_amount,
        split_type=split_type,
        member_ids=parsed_member_ids,
        custom_shares=parsed_custom_shares,
        proof_type=proof_type,
        proof_url=proof_url,
        proof_upi_ref=proof_upi_ref,
        current_user=current_user
    )


@router.get("/circles/{circle_id}/charges", response_model=list[ChargeResponse])
async def get_charges(
    circle_id: str,
    current_user: User = Depends(get_current_user)
) -> list[ChargeResponse]:
    return await charge_service.get_charges(circle_id, current_user)


@router.get("/charges/{charge_id}", response_model=ChargeResponse)
async def get_charge_detail(
    charge_id: str,
    current_user: User = Depends(get_current_user)
) -> ChargeResponse:
    return await charge_service.get_charge_detail(charge_id, current_user)


@router.get("/charges/{charge_id}/my-split", response_model=SplitEntryResponse)
async def get_my_split(
    charge_id: str,
    current_user: User = Depends(get_current_user)
) -> SplitEntryResponse:
    return await charge_service.get_my_split(charge_id, current_user)
