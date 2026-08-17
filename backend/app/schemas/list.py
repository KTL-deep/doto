from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TaskListBase(BaseModel):
    name: str
    color: Optional[str] = "#3b82f6"
    icon: Optional[str] = "folder"
    is_folder: Optional[bool] = False
    parent_id: Optional[int] = None
    sort_order: Optional[int] = 0
    view_mode: Optional[str] = "list"
    is_archived: Optional[bool] = False


class TaskListCreate(TaskListBase):
    pass


class TaskListUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_folder: Optional[bool] = None
    parent_id: Optional[int] = None
    sort_order: Optional[int] = None
    view_mode: Optional[str] = None
    is_archived: Optional[bool] = None


class TaskListOut(TaskListBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    task_count: Optional[int] = 0
    completed_task_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
