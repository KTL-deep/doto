from typing import Any, List, Optional
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.task import Task
from backend.app.schemas.task import TaskOut

router = APIRouter()


@router.get("/events", response_model=List[TaskOut])
async def get_calendar_events(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    include_completed: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    today = date.today()
    if not start_date:
        start_date = today.replace(day=1) - timedelta(days=7)
    if not end_date:
        end_date = today.replace(day=28) + timedelta(days=14)

    stmt = (
        select(Task)
        .options(selectinload(Task.tags), selectinload(Task.subtasks))
        .where(
            and_(
                Task.user_id == current_user.id,
                Task.due_date >= start_date,
                Task.due_date <= end_date
            )
        )
    )

    if not include_completed:
        stmt = stmt.where(Task.status == "todo")
    else:
        stmt = stmt.where(Task.status != "trash")

    stmt = stmt.order_by(Task.due_date.asc(), Task.due_time.asc().nulls_last(), Task.priority.desc())
    result = await db.execute(stmt)
    tasks = result.scalars().unique().all()
    return tasks
