from beanie import PydanticObjectId
from app.models.charge import Charge, Proof, SplitEntry

async def create(
    circle_id: PydanticObjectId,
    title: str,
    description: str,
    payer_id: PydanticObjectId,
    total_amount: float,
    split_type: str,
    proof: Proof,
    splits: list[SplitEntry]
) -> Charge:
    charge = Charge(
        circle_id=circle_id,
        title=title,
        description=description,
        payer_id=payer_id,
        total_amount=total_amount,
        split_type=split_type,
        proof=proof,
        splits=splits
    )
    await charge.insert()
    return charge


async def get_by_id(charge_id: str) -> Charge | None:
    try:
        return await Charge.get(charge_id)
    except Exception:
        return None


async def get_by_circle(circle_id: PydanticObjectId) -> list[Charge]:
    # Sort descending by created_at
    return await Charge.find(Charge.circle_id == circle_id).sort("-created_at").to_list()


async def update_split_status(charge_id: str, user_id: str, status: str) -> Charge | None:
    charge = await get_by_id(charge_id)
    if not charge:
        return None
        
    for split in charge.splits:
        if str(split.user_id) == user_id:
            split.status = status
            break
            
    await charge.save()
    return charge
