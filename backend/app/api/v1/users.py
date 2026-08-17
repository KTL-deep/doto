from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.schemas.user import UserUpdate, UserOut

router = APIRouter()


@router.get("/profile", response_model=UserOut)
async def get_profile(current_user: User = Depends(get_current_user)) -> Any:
    return current_user


@router.put("/profile", response_model=UserOut)
async def update_profile(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.avatar_url is not None:
        current_user.avatar_url = user_in.avatar_url
    if user_in.theme is not None:
        current_user.theme = user_in.theme
    if user_in.pomo_work_duration is not None:
        current_user.pomo_work_duration = user_in.pomo_work_duration
    if user_in.pomo_short_break is not None:
        current_user.pomo_short_break = user_in.pomo_short_break
    if user_in.pomo_long_break is not None:
        current_user.pomo_long_break = user_in.pomo_long_break
    if user_in.pomo_long_break_interval is not None:
        current_user.pomo_long_break_interval = user_in.pomo_long_break_interval
    if user_in.sound_enabled is not None:
        current_user.sound_enabled = user_in.sound_enabled
    if user_in.password is not None and len(user_in.password) >= 6:
        current_user.hashed_password = get_password_hash(user_in.password)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
