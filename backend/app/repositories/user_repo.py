from beanie import PydanticObjectId

from app.core.security import hash_password
from app.models.user import User


async def get_by_email(email: str) -> User | None:
    return await User.find_one(User.email == email)


async def get_by_id(user_id: str) -> User | None:
    try:
        oid = PydanticObjectId(user_id)
    except Exception:
        return None
    return await User.get(oid)


async def create(name: str, email: str, password_hash: str) -> User:
    user = User(name=name, email=email, password_hash=password_hash)
    await user.insert()
    return user
