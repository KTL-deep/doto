from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.task import Task
from backend.app.schemas.task import TaskOut

router = APIRouter()


@router.get("", response_model=Dict[str, List[TaskOut]])
async def get_eisenhower_matrix(
    include_completed: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = (
        select(Task)
        .options(selectinload(Task.tags), selectinload(Task.subtasks))
        .where(Task.user_id == current_user.id)
    )
    if not include_completed:
        stmt = stmt.where(Task.status == "todo")
    else:
        stmt = stmt.where(Task.status != "trash")

    stmt = stmt.order_by(Task.is_pinned.desc(), Task.priority.desc(), Task.due_date.asc().nulls_last())
    result = await db.execute(stmt)
    tasks = result.scalars().unique().all()

    quadrants = {
        "q1_urgent_important": [],     # 1: Срочно и Важно (Do first)
        "q2_not_urgent_important": [], # 2: Не срочно, но Важно (Schedule)
        "q3_urgent_not_important": [], # 3: Срочно, но Не важно (Delegate)
        "q4_not_urgent_not_important": [] # 4: Не срочно и Не важно (Eliminate)
    }

    for t in tasks:
        q = t.eisenhower_quadrant or 4
        if q == 1:
            quadrants["q1_urgent_important"].append(t)
        elif q == 2:
            quadrants["q2_not_urgent_important"].append(t)
        elif q == 3:
            quadrants["q3_urgent_not_important"].append(t)
        else:
            quadrants["q4_not_urgent_not_important"].append(t)

    return quadrants


@router.put("/{task_id}/quadrant", response_model=TaskOut)
async def update_task_quadrant(
    task_id: int,
    quadrant: int = Query(..., ge=1, le=4),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = (
        select(Task)
        .options(selectinload(Task.tags), selectinload(Task.subtasks))
        .where(and_(Task.id == task_id, Task.user_id == current_user.id))
    )
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена.")

    task.eisenhower_quadrant = quadrant
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task
