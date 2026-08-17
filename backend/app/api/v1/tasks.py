from typing import Any, List, Optional
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, delete
from sqlalchemy.orm import selectinload
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.task import Task, SubTask
from backend.app.models.tag import Tag, task_tags
from backend.app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskOut,
    TaskBatchUpdate,
    SubTaskCreate,
    SubTaskUpdate,
    SubTaskOut
)
from backend.app.services.task_service import compute_next_due_date, parse_smart_task_input

router = APIRouter()


@router.get("", response_model=List[TaskOut])
async def get_tasks(
    view: Optional[str] = Query("all", description="inbox, today, next7days, completed, trash, all"),
    list_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    priority: Optional[int] = None,
    quadrant: Optional[int] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    today = date.today()
    stmt = (
        select(Task)
        .options(selectinload(Task.tags), selectinload(Task.subtasks))
        .where(Task.user_id == current_user.id)
    )

    # View filtering
    if view == "inbox":
        stmt = stmt.where(and_(Task.list_id.is_(None), Task.status == "todo"))
    elif view == "today":
        stmt = stmt.where(and_(Task.status == "todo", Task.due_date <= today))
    elif view == "next7days":
        next_week = today + timedelta(days=7)
        stmt = stmt.where(and_(Task.status == "todo", Task.due_date <= next_week))
    elif view == "completed":
        stmt = stmt.where(Task.status == "completed")
    elif view == "trash":
        stmt = stmt.where(Task.status == "trash")
    else:
        # Default views exclude trash unless specified
        if status_filter:
            stmt = stmt.where(Task.status == status_filter)
        elif view != "all_including_trash":
            stmt = stmt.where(Task.status != "trash")

    # Extra filters
    if list_id is not None:
        stmt = stmt.where(Task.list_id == list_id)

    if tag_id is not None:
        stmt = stmt.join(Task.tags).where(Tag.id == tag_id)

    if priority is not None:
        stmt = stmt.where(Task.priority == priority)

    if quadrant is not None:
        stmt = stmt.where(Task.eisenhower_quadrant == quadrant)

    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(or_(Task.title.ilike(search_pattern), Task.description.ilike(search_pattern)))

    # Order by pinned first, then sort_order, then due_date, then priority desc, then created_at desc
    stmt = stmt.order_by(
        Task.is_pinned.desc(),
        Task.sort_order.asc(),
        Task.due_date.asc().nulls_last(),
        Task.priority.desc(),
        Task.created_at.desc()
    )

    result = await db.execute(stmt)
    tasks = result.scalars().unique().all()
    return tasks


@router.post("", response_model=TaskOut)
async def create_task(
    task_in: TaskCreate,
    smart_parse: bool = Query(False, description="Enable natural language syntax parsing"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    title = task_in.title
    priority = task_in.priority
    due_date = task_in.due_date
    due_time = task_in.due_time
    has_time = task_in.has_time
    all_day = task_in.all_day
    recurrence_rule = task_in.recurrence_rule
    quadrant = task_in.eisenhower_quadrant
    tag_ids = list(task_in.tag_ids or [])

    if smart_parse:
        parsed = parse_smart_task_input(task_in.title)
        title = parsed["title"]
        if parsed["priority"] > 0:
            priority = parsed["priority"]
        if parsed["due_date"]:
            due_date = parsed["due_date"]
        if parsed["due_time"]:
            due_time = parsed["due_time"]
            has_time = parsed["has_time"]
            all_day = parsed["all_day"]
        if parsed["recurrence_rule"]:
            recurrence_rule = parsed["recurrence_rule"]
        if parsed["eisenhower_quadrant"]:
            quadrant = parsed["eisenhower_quadrant"]
            
        # Parse tag names to tag ids or create tags if needed
        for tag_name in parsed["tags"]:
            tag_res = await db.execute(
                select(Tag).where(and_(Tag.user_id == current_user.id, Tag.name == tag_name))
            )
            found_tag = tag_res.scalar_one_or_none()
            if not found_tag:
                found_tag = Tag(user_id=current_user.id, name=tag_name, color="#10b981")
                db.add(found_tag)
                await db.flush()
            if found_tag.id not in tag_ids:
                tag_ids.append(found_tag.id)

    task = Task(
        user_id=current_user.id,
        list_id=task_in.list_id,
        title=title,
        description=task_in.description or "",
        priority=priority,
        status=task_in.status or "todo",
        due_date=due_date,
        due_time=due_time,
        has_time=has_time,
        all_day=all_day,
        reminder_at=task_in.reminder_at,
        recurrence_rule=recurrence_rule,
        is_pinned=task_in.is_pinned or False,
        sort_order=task_in.sort_order or 0,
        eisenhower_quadrant=quadrant or 4,
        kanban_column=task_in.kanban_column or "todo",
        duration_minutes=task_in.duration_minutes or 30,
        estimated_pomo=task_in.estimated_pomo or 1
    )

    # Attach tags
    if tag_ids:
        tag_res = await db.execute(
            select(Tag).where(and_(Tag.id.in_(tag_ids), Tag.user_id == current_user.id))
        )
        task.tags = tag_res.scalars().all()

    db.add(task)
    await db.flush()

    # Add initial subtasks if any
    if task_in.subtasks:
        for idx, st_in in enumerate(task_in.subtasks):
            subtask = SubTask(
                task_id=task.id,
                title=st_in.title,
                is_completed=st_in.is_completed or False,
                due_date=st_in.due_date,
                sort_order=idx
            )
            db.add(subtask)

    await db.commit()

    # Reload with relations
    res = await db.execute(
        select(Task)
        .options(selectinload(Task.tags), selectinload(Task.subtasks))
        .where(Task.id == task.id)
    )
    return res.scalar_one()


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: int,
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
    return task


@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
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

    update_data = task_in.model_dump(exclude_unset=True)

    # Handle completion timestamp
    if "status" in update_data:
        if update_data["status"] == "completed" and task.status != "completed":
            task.completed_at = datetime.now(timezone.utc)
            # Check recurrence rule
            if task.recurrence_rule and task.due_date:
                next_date = compute_next_due_date(task.due_date, task.recurrence_rule)
                if next_date:
                    # Create next recurring task instance
                    next_task = Task(
                        user_id=task.user_id,
                        list_id=task.list_id,
                        title=task.title,
                        description=task.description,
                        priority=task.priority,
                        status="todo",
                        due_date=next_date,
                        due_time=task.due_time,
                        duration_minutes=task.duration_minutes,
                        has_time=task.has_time,
                        all_day=task.all_day,
                        recurrence_rule=task.recurrence_rule,
                        eisenhower_quadrant=task.eisenhower_quadrant,
                        kanban_column="todo",
                        tags=list(task.tags)
                    )
                    db.add(next_task)
        elif update_data["status"] == "todo":
            task.completed_at = None

    # Handle tag associations
    if "tag_ids" in update_data:
        tag_ids = update_data.pop("tag_ids")
        if tag_ids is not None:
            tag_res = await db.execute(
                select(Tag).where(and_(Tag.id.in_(tag_ids), Tag.user_id == current_user.id))
            )
            task.tags = tag_res.scalars().all()

    for field, val in update_data.items():
        setattr(task, field, val)

    db.add(task)
    await db.commit()

    res = await db.execute(
        select(Task)
        .options(selectinload(Task.tags), selectinload(Task.subtasks))
        .where(Task.id == task.id)
    )
    return res.scalar_one()


@router.post("/{task_id}/toggle", response_model=TaskOut)
async def toggle_task_status(
    task_id: int,
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

    if task.status == "completed":
        task.status = "todo"
        task.completed_at = None
    else:
        task.status = "completed"
        task.completed_at = datetime.now(timezone.utc)
        if task.recurrence_rule and task.due_date:
            next_date = compute_next_due_date(task.due_date, task.recurrence_rule)
            if next_date:
                next_task = Task(
                    user_id=task.user_id,
                    list_id=task.list_id,
                    title=task.title,
                    description=task.description,
                    priority=task.priority,
                    status="todo",
                    due_date=next_date,
                    due_time=task.due_time,
                    has_time=task.has_time,
                    all_day=task.all_day,
                    recurrence_rule=task.recurrence_rule,
                    eisenhower_quadrant=task.eisenhower_quadrant,
                    kanban_column="todo",
                    tags=list(task.tags)
                )
                db.add(next_task)

    db.add(task)
    await db.commit()

    res = await db.execute(
        select(Task)
        .options(selectinload(Task.tags), selectinload(Task.subtasks))
        .where(Task.id == task.id)
    )
    return res.scalar_one()


@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    permanent: bool = Query(False, description="Permanent delete or move to trash"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = select(Task).where(and_(Task.id == task_id, Task.user_id == current_user.id))
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена.")

    if permanent or task.status == "trash":
        await db.delete(task)
    else:
        task.status = "trash"
        db.add(task)

    await db.commit()
    return {"status": "success", "message": "Задача удалена."}


@router.post("/batch")
async def batch_update_tasks(
    batch_in: TaskBatchUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    if not batch_in.task_ids:
        return {"status": "success", "updated_count": 0}

    stmt = select(Task).where(and_(Task.id.in_(batch_in.task_ids), Task.user_id == current_user.id))
    res = await db.execute(stmt)
    tasks = res.scalars().all()

    for task in tasks:
        if batch_in.status is not None:
            task.status = batch_in.status
            if task.status == "completed":
                task.completed_at = datetime.now(timezone.utc)
            elif task.status == "todo":
                task.completed_at = None
        if batch_in.list_id is not None:
            task.list_id = batch_in.list_id
        if batch_in.priority is not None:
            task.priority = batch_in.priority
        if batch_in.due_date is not None:
            task.due_date = batch_in.due_date
        if batch_in.eisenhower_quadrant is not None:
            task.eisenhower_quadrant = batch_in.eisenhower_quadrant
        db.add(task)

    await db.commit()
    return {"status": "success", "updated_count": len(tasks)}


# Subtasks Endpoints
@router.post("/{task_id}/subtasks", response_model=SubTaskOut)
async def create_subtask(
    task_id: int,
    subtask_in: SubTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    task_res = await db.execute(
        select(Task).where(and_(Task.id == task_id, Task.user_id == current_user.id))
    )
    task = task_res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена.")

    subtask = SubTask(
        task_id=task.id,
        title=subtask_in.title,
        is_completed=subtask_in.is_completed or False,
        due_date=subtask_in.due_date,
        sort_order=subtask_in.sort_order or 0
    )
    db.add(subtask)
    await db.commit()
    await db.refresh(subtask)
    return subtask


@router.put("/{task_id}/subtasks/{subtask_id}", response_model=SubTaskOut)
async def update_subtask(
    task_id: int,
    subtask_id: int,
    subtask_in: SubTaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = (
        select(SubTask)
        .join(Task, Task.id == SubTask.task_id)
        .where(and_(SubTask.id == subtask_id, Task.id == task_id, Task.user_id == current_user.id))
    )
    res = await db.execute(stmt)
    subtask = res.scalar_one_or_none()
    if not subtask:
        raise HTTPException(status_code=404, detail="Подзадача не найдена.")

    update_data = subtask_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(subtask, field, val)

    db.add(subtask)
    await db.commit()
    await db.refresh(subtask)
    return subtask


@router.delete("/{task_id}/subtasks/{subtask_id}")
async def delete_subtask(
    task_id: int,
    subtask_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = (
        select(SubTask)
        .join(Task, Task.id == SubTask.task_id)
        .where(and_(SubTask.id == subtask_id, Task.id == task_id, Task.user_id == current_user.id))
    )
    res = await db.execute(stmt)
    subtask = res.scalar_one_or_none()
    if not subtask:
        raise HTTPException(status_code=404, detail="Подзадача не найдена.")

    await db.delete(subtask)
    await db.commit()
    return {"status": "success", "message": "Подзадача удалена."}
