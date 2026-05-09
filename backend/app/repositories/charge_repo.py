from beanie import PydanticObjectId
from app.models.charge import Charge, Proof, SplitEntry


async def create(
    circle_id: PydanticObjectId,
    title: str,
    description: str,
    payer_id: PydanticObjectId,
    total_amount: float,
    split_type: str,
    proof_data: dict,
    splits_data: list[dict],
) -> Charge:
    proof = Proof(**proof_data)
    splits = [SplitEntry(**s) for s in splits_data]
    
    charge = Charge(
        circle_id=circle_id,
        title=title,
        description=description,
        payer_id=payer_id,
        total_amount=total_amount,
        split_type=split_type,  # type: ignore
        proof=proof,
        splits=splits,
    )
    await charge.insert()
    return charge


async def get_circle_charges(circle_id: str) -> list[Charge]:
    return await Charge.find(
        Charge.circle_id == PydanticObjectId(circle_id)
    ).sort("-created_at").to_list()


async def get_by_id(charge_id: str) -> Charge | None:
    try:
        return await Charge.get(charge_id)
    except Exception:
        return None
