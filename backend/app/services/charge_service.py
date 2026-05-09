from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models.user import User
from app.repositories import charge_repo, circle_repo, user_repo
from app.schemas.charge import (
    ChargeResponse,
    CreateChargeRequest,
    SplitEntryResponse,
    ProofInput,
)


async def _hydrate_charge(charge) -> ChargeResponse:
    payer = await user_repo.get_by_id(str(charge.payer_id))
    payer_name = payer.name if payer else "Unknown User"

    split_responses = []
    for s in charge.splits:
        user = await user_repo.get_by_id(str(s.user_id))
        split_responses.append(
            SplitEntryResponse(
                user_id=str(s.user_id),
                user_name=user.name if user else "Unknown User",
                amount_due=s.amount_due,
                status=s.status,
            )
        )

    return ChargeResponse(
        id=str(charge.id),
        circle_id=str(charge.circle_id),
        title=charge.title,
        description=charge.description,
        payer_id=str(charge.payer_id),
        payer_name=payer_name,
        total_amount=charge.total_amount,
        split_type=charge.split_type,
        proof=ProofInput(
            type=charge.proof.type,
            url=charge.proof.url,
            upi_ref=charge.proof.upi_ref,
        ),
        splits=split_responses,
        created_at=charge.created_at,
    )


async def create_charge(circle_id: str, req: CreateChargeRequest, current_user: User) -> ChargeResponse:
    circle = await circle_repo.get_by_id(circle_id)
    if not circle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Circle not found.")

    member_ids = [str(m.user_id) for m in circle.members]
    if str(current_user.id) not in member_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this circle.")

    splits_data = []

    if req.split_type == "equal":
        involved = req.involved_user_ids if req.involved_user_ids else member_ids
        for uid in involved:
            if uid not in member_ids:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {uid} is not in the circle.")
        
        count = len(involved)
        if count == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No users selected for split.")
            
        split_amount = round(req.total_amount / count, 2)
        
        for uid in involved:
            splits_data.append({
                "user_id": PydanticObjectId(uid),
                "amount_due": split_amount,
                "status": "cleared" if uid == str(current_user.id) else "pending",
            })
            
    elif req.split_type == "custom":
        if not req.custom_splits:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Custom splits must be provided.")
        
        total_custom = sum(req.custom_splits.values())
        if abs(total_custom - req.total_amount) > 0.05:  # Tolerance for floating point
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Sum of splits ({total_custom}) does not match total amount ({req.total_amount})."
            )
            
        for uid, amount in req.custom_splits.items():
            if uid not in member_ids:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {uid} is not in the circle.")
            
            splits_data.append({
                "user_id": PydanticObjectId(uid),
                "amount_due": round(amount, 2),
                "status": "cleared" if uid == str(current_user.id) else "pending",
            })

    charge = await charge_repo.create(
        circle_id=PydanticObjectId(circle_id),
        title=req.title,
        description=req.description,
        payer_id=current_user.id,
        total_amount=req.total_amount,
        split_type=req.split_type,
        proof_data=req.proof.model_dump(),
        splits_data=splits_data,
    )

    return await _hydrate_charge(charge)


async def get_circle_charges(circle_id: str, current_user: User) -> list[ChargeResponse]:
    circle = await circle_repo.get_by_id(circle_id)
    if not circle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Circle not found.")

    member_ids = [str(m.user_id) for m in circle.members]
    if str(current_user.id) not in member_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member.")

    charges = await charge_repo.get_circle_charges(circle_id)
    return [await _hydrate_charge(c) for c in charges]


async def get_charge_detail(charge_id: str, current_user: User) -> ChargeResponse:
    charge = await charge_repo.get_by_id(charge_id)
    if not charge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Charge not found.")

    circle = await circle_repo.get_by_id(str(charge.circle_id))
    if not circle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Circle not found.")

    member_ids = [str(m.user_id) for m in circle.members]
    if str(current_user.id) not in member_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member.")

    return await _hydrate_charge(charge)
