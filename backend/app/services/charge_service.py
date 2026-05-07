from fastapi import HTTPException, status
from beanie import PydanticObjectId

from app.models.user import User
from app.models.charge import Proof, SplitEntry
from app.repositories import charge_repo, circle_repo, user_repo
from app.services import split_engine
from app.schemas.charge import ChargeResponse, ProofResponse, SplitEntryResponse


async def _hydrate_charge_response(charge) -> ChargeResponse:
    # Get user cache for payer
    payer = await user_repo.get_by_id(str(charge.payer_id))
    payer_name = payer.name if payer else "Unknown"

    splits_resp = []
    for split in charge.splits:
        user = await user_repo.get_by_id(str(split.user_id))
        splits_resp.append(
            SplitEntryResponse(
                user_id=str(split.user_id),
                user_name=user.name if user else "Unknown",
                amount_due=split.amount_due,
                status=split.status
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
        proof=ProofResponse(
            type=charge.proof.type,
            url=charge.proof.url,
            upi_ref=charge.proof.upi_ref
        ),
        splits=splits_resp,
        created_at=charge.created_at
    )


async def create_charge(
    circle_id: str,
    title: str,
    description: str,
    total_amount: float,
    split_type: str,
    member_ids: list[str],
    custom_shares: dict[str, float] | None,
    proof_type: str,
    proof_url: str | None,
    proof_upi_ref: str | None,
    current_user: User
) -> ChargeResponse:
    circle = await circle_repo.get_by_id(circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found.")

    circle_member_ids = [str(m.user_id) for m in circle.members]
    if str(current_user.id) not in circle_member_ids:
        raise HTTPException(status_code=403, detail="You are not a member of this circle.")

    # Validate member_ids are in the circle
    for mid in member_ids:
        if mid not in circle_member_ids:
            raise HTTPException(status_code=400, detail=f"User {mid} is not in the circle.")

    try:
        calculated_splits = split_engine.calculate_splits(
            total_amount=total_amount,
            member_ids=member_ids,
            split_type=split_type,
            custom_shares=custom_shares
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    splits = [
        SplitEntry(user_id=PydanticObjectId(s["user_id"]), amount_due=s["amount_due"])
        for s in calculated_splits
    ]

    proof = Proof(type=proof_type, url=proof_url, upi_ref=proof_upi_ref)

    charge = await charge_repo.create(
        circle_id=PydanticObjectId(circle_id),
        title=title,
        description=description,
        payer_id=current_user.id,
        total_amount=total_amount,
        split_type=split_type,
        proof=proof,
        splits=splits
    )

    return await _hydrate_charge_response(charge)


async def get_charges(circle_id: str, current_user: User) -> list[ChargeResponse]:
    circle = await circle_repo.get_by_id(circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found.")

    circle_member_ids = [str(m.user_id) for m in circle.members]
    if str(current_user.id) not in circle_member_ids:
        raise HTTPException(status_code=403, detail="You are not a member of this circle.")

    charges = await charge_repo.get_by_circle(PydanticObjectId(circle_id))
    return [await _hydrate_charge_response(c) for c in charges]


async def get_charge_detail(charge_id: str, current_user: User) -> ChargeResponse:
    charge = await charge_repo.get_by_id(charge_id)
    if not charge:
        raise HTTPException(status_code=404, detail="Charge not found.")

    circle = await circle_repo.get_by_id(str(charge.circle_id))
    circle_member_ids = [str(m.user_id) for m in circle.members] if circle else []
    
    if str(current_user.id) not in circle_member_ids:
        raise HTTPException(status_code=403, detail="You are not a member of the circle this charge belongs to.")

    return await _hydrate_charge_response(charge)


async def get_my_split(charge_id: str, current_user: User) -> SplitEntryResponse:
    charge = await charge_repo.get_by_id(charge_id)
    if not charge:
        raise HTTPException(status_code=404, detail="Charge not found.")

    for split in charge.splits:
        if str(split.user_id) == str(current_user.id):
            return SplitEntryResponse(
                user_id=str(split.user_id),
                user_name=current_user.name,
                amount_due=split.amount_due,
                status=split.status
            )
            
    raise HTTPException(status_code=404, detail="You do not have a split in this charge.")
