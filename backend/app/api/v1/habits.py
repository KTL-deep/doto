from typing import Any, List, Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from sqlalchemy.orm import selectinload
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.habit import Habit, HabitLog
from backend.app.schemas.habit import HabitCreate, HabitUpdate, HabitOut, HabitLogCreate, HabitLogOut
from backend.app.services.habit_service import calculate_habit_streaks

router = APIRouter()


@router.get("", response_model=List[HabitOut])
async def get_habits(
    include_archived: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = (
        select(Habit)
        .options(selectinload(Habit.logs))
        .where(Habit.user_id == current_user.id)
    )
    if not include_archived:
        stmt = stmt.where(Habit.is_archived.is_(False))
    stmt = stmt.order_by(Habit.sort_order.asc(), Habit.created_at.asc())

    result = await db.execute(stmt)
    habits = result.scalars().all()

    today = date.today()
    output = []
    for h in habits:
        cur_streak, best_streak, today_done, today_val = calculate_habit_streaks(h, h.logs, today)
        
        # Sort logs descending, limit 30
        logs_sorted = sorted(h.logs, key=lambda x: x.date, reverse=True)[:30]
        
        h_dict = {
            "id": h.id,
            "user_id": h.user_id,
            "name": h.name,
            "icon": h.icon,
            "color": h.color,
            "goal_days": h.goal_days,
            "target_frequency": h.target_frequency,
            "frequency_unit": h.frequency_unit,
            "frequency_unit_label": h.frequency_unit_label,
            "reminder_time": h.reminder_time,
            "is_archived": h.is_archived,
            "sort_order": h.sort_order,
            "created_at": h.created_at,
            "updated_at": h.updated_at,
            "current_streak": cur_streak,
            "best_streak": best_streak,
            "total_completions": len(h.logs),
            "today_completed": today_done,
            "today_value": today_val,
            "recent_logs": logs_sorted
        }
        output.append(h_dict)

    return output


@router.post("", response_model=HabitOut)
async def create_habit(
    habit_in: HabitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    habit = Habit(
        user_id=current_user.id,
        name=habit_in.name,
        icon=habit_in.icon or "star",
        color=habit_in.color or "#ec4899",
        goal_days=habit_in.goal_days or "1,2,3,4,5,6,7",
        target_frequency=habit_in.target_frequency or 1,
        frequency_unit=habit_in.frequency_unit or "day",
        frequency_unit_label=habit_in.frequency_unit_label or "times",
        reminder_time=habit_in.reminder_time,
        is_archived=habit_in.is_archived or False,
        sort_order=habit_in.sort_order or 0
    )
    db.add(habit)
    await db.commit()
    await db.refresh(habit)

    res = HabitOut.model_validate(habit)
    res.current_streak = 0
    res.best_streak = 0
    res.total_completions = 0
    res.today_completed = False
    res.today_value = 0
    res.recent_logs = []
    return res


@router.put("/{habit_id}", response_model=HabitOut)
async def update_habit(
    habit_id: int,
    habit_in: HabitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = (
        select(Habit)
        .options(selectinload(Habit.logs))
        .where(and_(Habit.id == habit_id, Habit.user_id == current_user.id))
    )
    res = await db.execute(stmt)
    habit = res.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Привычка не найдена.")

    update_data = habit_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(habit, field, val)

    db.add(habit)
    await db.commit()
    await db.refresh(habit)

    today = date.today()
    cur_streak, best_streak, today_done, today_val = calculate_habit_streaks(habit, habit.logs, today)
    logs_sorted = sorted(habit.logs, key=lambda x: x.date, reverse=True)[:30]
    
    return {
        "id": habit.id,
        "user_id": habit.user_id,
        "name": habit.name,
        "icon": habit.icon,
        "color": habit.color,
        "goal_days": habit.goal_days,
        "target_frequency": habit.target_frequency,
        "frequency_unit": habit.frequency_unit,
        "frequency_unit_label": habit.frequency_unit_label,
        "reminder_time": habit.reminder_time,
        "is_archived": habit.is_archived,
        "sort_order": habit.sort_order,
        "created_at": habit.created_at,
        "updated_at": habit.updated_at,
        "current_streak": cur_streak,
        "best_streak": best_streak,
        "total_completions": len(habit.logs),
        "today_completed": today_done,
        "today_value": today_val,
        "recent_logs": logs_sorted
    }


@router.delete("/{habit_id}")
async def delete_habit(
    habit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == current_user.id))
    res = await db.execute(stmt)
    habit = res.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Привычка не найдена.")

    await db.delete(habit)
    await db.commit()
    return {"status": "success", "message": "Привычка удалена."}


@router.post("/{habit_id}/checkin", response_model=HabitOut)
async def checkin_habit(
    habit_id: int,
    check_date: Optional[date] = None,
    value: int = Query(1),
    note: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    target_date = check_date or date.today()
    
    stmt = (
        select(Habit)
        .options(selectinload(Habit.logs))
        .where(and_(Habit.id == habit_id, Habit.user_id == current_user.id))
    )
    res = await db.execute(stmt)
    habit = res.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Привычка не найдена.")

    # Find existing log for target_date
    log_stmt = select(HabitLog).where(
        and_(HabitLog.habit_id == habit.id, HabitLog.user_id == current_user.id, HabitLog.date == target_date)
    )
    log_res = await db.execute(log_stmt)
    existing_log = log_res.scalar_one_or_none()

    if existing_log:
        existing_log.value += value
        if note:
            existing_log.note = note
        db.add(existing_log)
    else:
        new_log = HabitLog(
            habit_id=habit.id,
            user_id=current_user.id,
            date=target_date,
            value=value,
            note=note
        )
        db.add(new_log)

    await db.commit()

    # Refetch habit with fresh logs
    res = await db.execute(stmt)
    habit = res.scalar_one()

    today = date.today()
    cur_streak, best_streak, today_done, today_val = calculate_habit_streaks(habit, habit.logs, today)
    logs_sorted = sorted(habit.logs, key=lambda x: x.date, reverse=True)[:30]

    return {
        "id": habit.id,
        "user_id": habit.user_id,
        "name": habit.name,
        "icon": habit.icon,
        "color": habit.color,
        "goal_days": habit.goal_days,
        "target_frequency": habit.target_frequency,
        "frequency_unit": habit.frequency_unit,
        "frequency_unit_label": habit.frequency_unit_label,
        "reminder_time": habit.reminder_time,
        "is_archived": habit.is_archived,
        "sort_order": habit.sort_order,
        "created_at": habit.created_at,
        "updated_at": habit.updated_at,
        "current_streak": cur_streak,
        "best_streak": best_streak,
        "total_completions": len(habit.logs),
        "today_completed": today_done,
        "today_value": today_val,
        "recent_logs": logs_sorted
    }


@router.post("/{habit_id}/uncheck", response_model=HabitOut)
async def uncheck_habit(
    habit_id: int,
    check_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    target_date = check_date or date.today()
    
    stmt = (
        select(Habit)
        .options(selectinload(Habit.logs))
        .where(and_(Habit.id == habit_id, Habit.user_id == current_user.id))
    )
    res = await db.execute(stmt)
    habit = res.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Привычка не найдена.")

    del_stmt = delete(HabitLog).where(
        and_(HabitLog.habit_id == habit.id, HabitLog.user_id == current_user.id, HabitLog.date == target_date)
    )
    await db.execute(del_stmt)
    await db.commit()

    # Refetch habit
    res = await db.execute(stmt)
    habit = res.scalar_one()

    today = date.today()
    cur_streak, best_streak, today_done, today_val = calculate_habit_streaks(habit, habit.logs, today)
    logs_sorted = sorted(habit.logs, key=lambda x: x.date, reverse=True)[:30]

    return {
        "id": habit.id,
        "user_id": habit.user_id,
        "name": habit.name,
        "icon": habit.icon,
        "color": habit.color,
        "goal_days": habit.goal_days,
        "target_frequency": habit.target_frequency,
        "frequency_unit": habit.frequency_unit,
        "frequency_unit_label": habit.frequency_unit_label,
        "reminder_time": habit.reminder_time,
        "is_archived": habit.is_archived,
        "sort_order": habit.sort_order,
        "created_at": habit.created_at,
        "updated_at": habit.updated_at,
        "current_streak": cur_streak,
        "best_streak": best_streak,
        "total_completions": len(habit.logs),
        "today_completed": today_done,
        "today_value": today_val,
        "recent_logs": logs_sorted
    }
