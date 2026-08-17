from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TagBase(BaseModel):
    name: str
    color: Optional[str] = "#10b981"
    parent_id: Optional[int] = None


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    parent_id: Optional[int] = None


class TagOut(TagBase):
    id: int
    user_id: int
    created_at: datetime
    task_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
