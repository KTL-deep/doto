from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.tag import Tag, task_tags
from backend.app.models.task import Task
from backend.app.schemas.tag import TagCreate, TagUpdate, TagOut

router = APIRouter()


@router.get("", response_model=List[TagOut])
async def get_tags(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = (
        select(Tag)
        .where(Tag.user_id == current_user.id)
        .order_by(Tag.name.asc())
    )
    result = await db.execute(stmt)
    tags = result.scalars().all()

    # Tag counts
    counts_stmt = (
        select(
            task_tags.c.tag_id,
            func.count(task_tags.c.task_id).label("total")
        )
        .join(Task, Task.id == task_tags.c.task_id)
        .where(and_(Task.user_id == current_user.id, Task.status != "trash"))
        .group_by(task_tags.c.tag_id)
    )
    counts_result = await db.execute(counts_stmt)
    counts_map = {row.tag_id: row.total for row in counts_result.all()}

    output = []
    for t in tags:
        output.append({
            "id": t.id,
            "user_id": t.user_id,
            "name": t.name,
            "color": t.color,
            "parent_id": t.parent_id,
            "created_at": t.created_at,
            "task_count": counts_map.get(t.id, 0)
        })

    return output


@router.post("", response_model=TagOut)
async def create_tag(
    tag_in: TagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Check if tag already exists for user
    existing = await db.execute(
        select(Tag).where(and_(Tag.user_id == current_user.id, Tag.name == tag_in.name))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Тег с таким именем уже существует.")

    tag = Tag(
        user_id=current_user.id,
        name=tag_in.name,
        color=tag_in.color or "#10b981",
        parent_id=tag_in.parent_id
    )
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    
    res = TagOut.model_validate(tag)
    res.task_count = 0
    return res


@router.put("/{tag_id}", response_model=TagOut)
async def update_tag(
    tag_id: int,
    tag_in: TagUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(
        select(Tag).where(and_(Tag.id == tag_id, Tag.user_id == current_user.id))
    )
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Тег не найден.")

    update_data = tag_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(tag, field, val)

    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(
        select(Tag).where(and_(Tag.id == tag_id, Tag.user_id == current_user.id))
    )
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Тег не найден.")

    await db.delete(tag)
    await db.commit()
    return {"status": "success", "message": "Тег удален."}
