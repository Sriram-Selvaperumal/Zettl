from fastapi import HTTPException, status

from app.models.user import User
from app.repositories import circle_repo, user_repo
from app.schemas.circle import (
    CircleDetailResponse,
    CircleMemberResponse,
    CircleResponse,
    CreateCircleRequest,
    JoinCircleRequest,
)


def _get_role(circle, user_id) -> str:
    for m in circle.members:
        if str(m.user_id) == str(user_id):
            return m.role
    return "member"


def _circle_to_response(circle, user_id) -> CircleResponse:
    return CircleResponse(
        id=str(circle.id),
        name=circle.name,
        description=circle.description,
        invite_code=circle.invite_code,
        member_count=len(circle.members),
        your_role=_get_role(circle, user_id),
        created_at=circle.created_at,
    )


async def create_circle(req: CreateCircleRequest, current_user: User) -> CircleResponse:
    circle = await circle_repo.create(req.name, req.description, current_user.id)
    return _circle_to_response(circle, current_user.id)


async def join_circle(req: JoinCircleRequest, current_user: User) -> CircleResponse:
    circle = await circle_repo.get_by_invite_code(req.invite_code)
    if not circle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite code. No circle found.",
        )

    # Check if already a member
    member_ids = [str(m.user_id) for m in circle.members]
    if str(current_user.id) in member_ids:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already a member of this circle.",
        )

    circle = await circle_repo.add_member(circle, current_user.id)
    return _circle_to_response(circle, current_user.id)


async def get_my_circles(current_user: User) -> list[CircleResponse]:
    circles = await circle_repo.get_user_circles(current_user.id)
    return [_circle_to_response(c, current_user.id) for c in circles]


async def get_circle_detail(circle_id: str, current_user: User) -> CircleDetailResponse:
    circle = await circle_repo.get_by_id(circle_id)
    if not circle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Circle not found.")

    # Check membership
    member_ids = [str(m.user_id) for m in circle.members]
    if str(current_user.id) not in member_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this circle.",
        )

    # Hydrate member names from users collection
    member_responses = []
    for m in circle.members:
        user = await user_repo.get_by_id(str(m.user_id))
        if user:
            member_responses.append(
                CircleMemberResponse(
                    user_id=str(m.user_id),
                    name=user.name,
                    email=user.email,
                    avatar_url=user.avatar_url,
                    role=m.role,
                    joined_at=m.joined_at,
                )
            )

    return CircleDetailResponse(
        id=str(circle.id),
        name=circle.name,
        description=circle.description,
        invite_code=circle.invite_code,
        created_at=circle.created_at,
        members=member_responses,
    )
