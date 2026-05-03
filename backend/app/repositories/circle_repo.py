import secrets

from beanie import PydanticObjectId

from app.models.circle import Circle, CircleMember


async def create(name: str, description: str, creator_id: PydanticObjectId) -> Circle:
    invite_code = secrets.token_urlsafe(6)  # 8-char URL-safe string
    creator_member = CircleMember(user_id=creator_id, role="admin")
    circle = Circle(
        name=name,
        description=description,
        invite_code=invite_code,
        created_by=creator_id,
        members=[creator_member],
    )
    await circle.insert()
    return circle


async def get_by_id(circle_id: str) -> Circle | None:
    try:
        return await Circle.get(circle_id)
    except Exception:
        return None


async def get_by_invite_code(invite_code: str) -> Circle | None:
    return await Circle.find_one(Circle.invite_code == invite_code)


async def get_user_circles(user_id: PydanticObjectId) -> list[Circle]:
    return await Circle.find(
        Circle.members.user_id == user_id
    ).to_list()


async def add_member(circle: Circle, user_id: PydanticObjectId) -> Circle:
    new_member = CircleMember(user_id=user_id, role="member")
    circle.members.append(new_member)
    await circle.save()
    return circle
