from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.circle import (
    CircleDetailResponse,
    CircleResponse,
    CreateCircleRequest,
    JoinCircleRequest,
)
from app.services import circle_service

router = APIRouter(prefix="/circles", tags=["Circles"])


@router.post("/", response_model=CircleResponse, status_code=status.HTTP_201_CREATED)
async def create_circle(
    req: CreateCircleRequest,
    current_user: User = Depends(get_current_user),
) -> CircleResponse:
    return await circle_service.create_circle(req, current_user)


@router.get("/", response_model=list[CircleResponse])
async def get_my_circles(
    current_user: User = Depends(get_current_user),
) -> list[CircleResponse]:
    return await circle_service.get_my_circles(current_user)


@router.post("/join", response_model=CircleResponse)
async def join_circle(
    req: JoinCircleRequest,
    current_user: User = Depends(get_current_user),
) -> CircleResponse:
    return await circle_service.join_circle(req, current_user)


@router.get("/{circle_id}", response_model=CircleDetailResponse)
async def get_circle_detail(
    circle_id: str,
    current_user: User = Depends(get_current_user),
) -> CircleDetailResponse:
    return await circle_service.get_circle_detail(circle_id, current_user)
