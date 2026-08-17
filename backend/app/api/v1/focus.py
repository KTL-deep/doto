from typing import Any, List, Dict
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.task import Task
from backend.app.models.focus import FocusSession
from backend.app.schemas.focus import FocusSessionCreate, FocusSessionOut, FocusStatsOut

router = APIRouter()


@router.get("/sessions", response_model=List[FocusSessionOut])
async def get_focus_sessions(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = (
        select(FocusSession)
        .options(selectinload(FocusSession.task))
        .where(FocusSession.user_id == current_user.id)
        .order_by(FocusSession.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()

    output = []
    for s in sessions:
        output.append({
            "id": s.id,
            "user_id": s.user_id,
            "task_id": s.task_id,
            "duration_minutes": s.duration_minutes,
            "session_type": s.session_type,
            "note": s.note,
            "started_at": s.started_at,
            "ended_at": s.ended_at,
            "created_at": s.created_at,
            "task_title": s.task.title if s.task else None
        })
    return output


@router.post("/sessions", response_model=FocusSessionOut)
async def create_focus_session(
    session_in: FocusSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    focus_sess = FocusSession(
        user_id=current_user.id,
        task_id=session_in.task_id,
        duration_minutes=session_in.duration_minutes,
        session_type=session_in.session_type or "pomodoro",
        note=session_in.note,
        started_at=session_in.started_at,
        ended_at=session_in.ended_at
    )
    db.add(focus_sess)

    # If linked to a task, increment actual_pomo
    if session_in.task_id:
        t_res = await db.execute(
            select(Task).where(and_(Task.id == session_in.task_id, Task.user_id == current_user.id))
        )
        task = t_res.scalar_one_or_none()
        if task:
            task.actual_pomo = (task.actual_pomo or 0) + 1
            db.add(task)

    await db.commit()
    await db.refresh(focus_sess)

    task_title = None
    if focus_sess.task_id:
        t_res = await db.execute(select(Task).where(Task.id == focus_sess.task_id))
        t = t_res.scalar_one_or_none()
        if t:
            task_title = t.title

    return {
        "id": focus_sess.id,
        "user_id": focus_sess.user_id,
        "task_id": focus_sess.task_id,
        "duration_minutes": focus_sess.duration_minutes,
        "session_type": focus_sess.session_type,
        "note": focus_sess.note,
        "started_at": focus_sess.started_at,
        "ended_at": focus_sess.ended_at,
        "created_at": focus_sess.created_at,
        "task_title": task_title
    }


@router.get("/stats", response_model=FocusStatsOut)
async def get_focus_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # All-time stats
    stmt_all = select(
        func.coalesce(func.sum(FocusSession.duration_minutes), 0),
        func.count(FocusSession.id)
    ).where(FocusSession.user_id == current_user.id)
    res_all = await db.execute(stmt_all)
    total_mins, total_count = res_all.one()

    # Today's stats
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    stmt_today = select(
        func.coalesce(func.sum(FocusSession.duration_minutes), 0),
        func.count(FocusSession.id)
    ).where(and_(FocusSession.user_id == current_user.id, FocusSession.created_at >= today_start))
    res_today = await db.execute(stmt_today)
    today_mins, today_count = res_today.one()

    # 7-day stats & distribution
    week_start = today_start - timedelta(days=6)
    stmt_week = (
        select(
            FocusSession.created_at,
            FocusSession.duration_minutes
        )
        .where(and_(FocusSession.user_id == current_user.id, FocusSession.created_at >= week_start))
    )
    res_week = await db.execute(stmt_week)
    sessions_week = res_week.all()

    daily_map: Dict[str, int] = {}
    for i in range(7):
        d_str = (week_start + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_map[d_str] = 0

    weekly_mins = 0
    for s_date, dur in sessions_week:
        weekly_mins += dur
        d_str = s_date.strftime("%Y-%m-%d")
        if d_str in daily_map:
            daily_map[d_str] += dur

    return {
        "total_focus_minutes": total_mins,
        "total_sessions_count": total_count,
        "today_focus_minutes": today_mins,
        "today_sessions_count": today_count,
        "weekly_focus_minutes": weekly_mins,
        "daily_distribution": daily_map
    }
