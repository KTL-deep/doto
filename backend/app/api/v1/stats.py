from typing import Any, Dict, List
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.task import Task
from backend.app.models.habit import HabitLog
from backend.app.models.focus import FocusSession
from backend.app.schemas.stats import ProductivityStatsOut, DailyTaskStat

router = APIRouter()


@router.get("/summary", response_model=ProductivityStatsOut)
async def get_productivity_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    today = date.today()

    # Total and completed tasks
    stmt_tasks = select(
        func.count(Task.id).label("total"),
        func.sum(case((Task.status == "completed", 1), else_=0)).label("completed"),
        func.sum(case((Task.status == "todo", 1), else_=0)).label("pending"),
        func.sum(case((and_(Task.status == "todo", Task.due_date < today), 1), else_=0)).label("overdue")
    ).where(and_(Task.user_id == current_user.id, Task.status != "trash"))
    res_tasks = await db.execute(stmt_tasks)
    row = res_tasks.one()
    total_tasks = row.total or 0
    completed_tasks = row.completed or 0
    pending_tasks = row.pending or 0
    overdue_tasks = row.overdue or 0

    completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0, 1)

    # Focus hours
    stmt_focus = select(func.coalesce(func.sum(FocusSession.duration_minutes), 0)).where(FocusSession.user_id == current_user.id)
    res_focus = await db.execute(stmt_focus)
    total_focus_mins = res_focus.scalar_one() or 0
    total_focus_hours = round(total_focus_mins / 60.0, 1)

    # Habits completions
    stmt_habits = select(func.count(HabitLog.id)).where(HabitLog.user_id == current_user.id)
    res_habits = await db.execute(stmt_habits)
    total_habits_completed = res_habits.scalar_one() or 0

    # Daily breakdown for last 7 days
    daily_stats: List[DailyTaskStat] = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        d_start = datetime.combine(d, datetime.min.time(), tzinfo=timezone.utc)
        d_end = datetime.combine(d, datetime.max.time(), tzinfo=timezone.utc)

        stmt_day_comp = select(func.count(Task.id)).where(
            and_(Task.user_id == current_user.id, Task.status == "completed", Task.completed_at >= d_start, Task.completed_at <= d_end)
        )
        res_comp = await db.execute(stmt_day_comp)
        comp_cnt = res_comp.scalar_one() or 0

        stmt_day_created = select(func.count(Task.id)).where(
            and_(Task.user_id == current_user.id, Task.created_at >= d_start, Task.created_at <= d_end)
        )
        res_created = await db.execute(stmt_day_created)
        created_cnt = res_created.scalar_one() or 0

        daily_stats.append(DailyTaskStat(
            date=d.strftime("%Y-%m-%d"),
            completed_count=comp_cnt,
            created_count=created_cnt
        ))

    # Karma Score calculation (gamification like TickTick)
    # Karma = (completed_tasks * 10) + (total_focus_mins * 2) + (total_habits_completed * 5)
    karma_score = (completed_tasks * 10) + (int(total_focus_mins) * 2) + (total_habits_completed * 5) + 100

    # Simple streak calculation (consecutive days with at least 1 task completed)
    streak = 0
    check_day = today
    while True:
        d_start = datetime.combine(check_day, datetime.min.time(), tzinfo=timezone.utc)
        d_end = datetime.combine(check_day, datetime.max.time(), tzinfo=timezone.utc)
        stmt_st = select(func.count(Task.id)).where(
            and_(Task.user_id == current_user.id, Task.status == "completed", Task.completed_at >= d_start, Task.completed_at <= d_end)
        )
        res_st = await db.execute(stmt_st)
        c = res_st.scalar_one() or 0
        if c > 0:
            streak += 1
            check_day -= timedelta(days=1)
        elif check_day == today:
            # Check yesterday
            check_day -= timedelta(days=1)
            continue
        else:
            break

    return ProductivityStatsOut(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        overdue_tasks=overdue_tasks,
        completion_rate=completion_rate,
        current_task_streak=streak,
        total_focus_hours=total_focus_hours,
        total_habits_completed=total_habits_completed,
        karma_score=karma_score,
        daily_stats_last_7_days=daily_stats
    )
