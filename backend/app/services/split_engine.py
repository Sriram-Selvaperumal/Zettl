import math
from typing import Literal

def calculate_splits(
    total_amount: float,
    member_ids: list[str],
    split_type: Literal["equal", "custom"],
    custom_shares: dict[str, float] | None = None
) -> list[dict]:
    """
    Returns: [{"user_id": str, "amount_due": float}, ...]
    - equal: divides evenly, handles penny rounding (first member absorbs remainder)
    - custom: validates sum within ±0.01 tolerance, raises ValueError if not
    """
    if not member_ids:
        raise ValueError("Must provide at least one member to split with.")

    splits = []

    if split_type == "equal":
        # Rounding down to 2 decimal places for everyone
        base_amount = math.floor((total_amount / len(member_ids)) * 100) / 100.0
        
        for user_id in member_ids:
            splits.append({
                "user_id": user_id,
                "amount_due": base_amount
            })
            
        # Distribute the remaining pennies to the first person
        allocated = base_amount * len(member_ids)
        remainder = round(total_amount - allocated, 2)
        if remainder > 0:
            splits[0]["amount_due"] = round(splits[0]["amount_due"] + remainder, 2)

    elif split_type == "custom":
        if not custom_shares:
            raise ValueError("custom_shares must be provided for custom split type.")
        
        sum_custom = sum(custom_shares.get(uid, 0.0) for uid in member_ids)
        
        if abs(sum_custom - total_amount) > 0.01:
            raise ValueError(f"Custom shares sum ({sum_custom}) does not match total amount ({total_amount}).")
            
        for user_id in member_ids:
            amount = custom_shares.get(user_id, 0.0)
            if amount > 0:
                splits.append({
                    "user_id": user_id,
                    "amount_due": round(amount, 2)
                })

    else:
        raise ValueError(f"Invalid split_type: {split_type}")

    return splits
