from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.list import TaskList
from backend.app.models.task import Task
from backend.app.schemas.list import TaskListCreate, TaskListUpdate, TaskListOut

router = APIRouter()


@router.get("", response_model=List[TaskListOut])
async def get_lists(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Query all lists for current user
    stmt = (
        select(TaskList)
        .where(TaskList.user_id == current_user.id)
        .order_by(TaskList.sort_order.asc(), TaskList.created_at.asc())
    )
    result = await db.execute(stmt)
    lists = result.scalars().all()

    # Get task counts per list
    counts_stmt = (
        select(
            Task.list_id,
            func.count(Task.id).label("total"),
            func.sum(case((Task.status == "completed", 1), else_=0)).label("completed")
        )
        .where(and_(Task.user_id == current_user.id, Task.status != "trash"))
        .group_by(Task.list_id)
    )
    counts_result = await db.execute(counts_stmt)
    counts_map = {row.list_id: (row.total, row.completed or 0) for row in counts_result.all()}

    output = []
    for lst in lists:
        total, completed = counts_map.get(lst.id, (0, 0))
        lst_dict = {
            "id": lst.id,
            "user_id": lst.user_id,
            "name": lst.name,
            "color": lst.color,
            "icon": lst.icon,
            "is_folder": lst.is_folder,
            "parent_id": lst.parent_id,
            "sort_order": lst.sort_order,
            "view_mode": lst.view_mode,
            "is_archived": lst.is_archived,
            "created_at": lst.created_at,
            "updated_at": lst.updated_at,
            "task_count": total,
            "completed_task_count": completed
        }
        output.append(lst_dict)

    return output


@router.post("", response_model=TaskListOut)
async def create_list(
    list_in: TaskListCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    task_list = TaskList(
        user_id=current_user.id,
        name=list_in.name,
        color=list_in.color or "#3b82f6",
        icon=list_in.icon or "folder",
        is_folder=list_in.is_folder or False,
        parent_id=list_in.parent_id,
        sort_order=list_in.sort_order or 0,
        view_mode=list_in.view_mode or "list",
        is_archived=list_in.is_archived or False
    )
    db.add(task_list)
    await db.commit()
    await db.refresh(task_list)
    
    res = TaskListOut.model_validate(task_list)
    res.task_count = 0
    res.completed_task_count = 0
    return res


@router.put("/{list_id}", response_model=TaskListOut)
async def update_list(
    list_id: int,
    list_in: TaskListUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(
        select(TaskList).where(and_(TaskList.id == list_id, TaskList.user_id == current_user.id))
    )
    task_list = result.scalar_one_or_none()
    if not task_list:
        raise HTTPException(status_code=404, detail="Список не найден.")

    update_data = list_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(task_list, field, val)

    db.add(task_list)
    await db.commit()
    await db.refresh(task_list)
    return task_list


@router.delete("/{list_id}")
async def delete_list(
    list_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(
        select(TaskList).where(and_(TaskList.id == list_id, TaskList.user_id == current_user.id))
    )
    task_list = result.scalar_one_or_none()
    if not task_list:
        raise HTTPException(status_code=404, detail="Список не найден.")

    await db.delete(task_list)
    await db.commit()
    return {"status": "success", "message": "Список удален."}
