from typing import Optional, List
from datetime import datetime, date, time
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.tag import TagOut


class SubTaskBase(BaseModel):
    title: str
    is_completed: Optional[bool] = False
    due_date: Optional[date] = None
    sort_order: Optional[int] = 0


class SubTaskCreate(SubTaskBase):
    pass


class SubTaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[date] = None
    sort_order: Optional[int] = None


class SubTaskOut(SubTaskBase):
    id: int
    task_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    list_id: Optional[int] = None
    priority: Optional[int] = 0  # 0: None, 1: Low, 3: Medium, 5: High
    status: Optional[str] = "todo"
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    duration_minutes: Optional[int] = 30
    has_time: Optional[bool] = False
    all_day: Optional[bool] = True
    reminder_at: Optional[datetime] = None
    recurrence_rule: Optional[str] = None
    is_pinned: Optional[bool] = False
    sort_order: Optional[int] = 0
    eisenhower_quadrant: Optional[int] = 4
    kanban_column: Optional[str] = "todo"
    estimated_pomo: Optional[int] = 1


class TaskCreate(TaskBase):
    tag_ids: Optional[List[int]] = []
    subtasks: Optional[List[SubTaskCreate]] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    list_id: Optional[int] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    has_time: Optional[bool] = None
    all_day: Optional[bool] = None
    reminder_at: Optional[datetime] = None
    recurrence_rule: Optional[str] = None
    is_pinned: Optional[bool] = None
    sort_order: Optional[int] = None
    eisenhower_quadrant: Optional[int] = None
    kanban_column: Optional[str] = None
    estimated_pomo: Optional[int] = None
    actual_pomo: Optional[int] = None
    tag_ids: Optional[List[int]] = None


class TaskOut(TaskBase):
    id: int
    user_id: int
    actual_pomo: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    tags: List[TagOut] = []
    subtasks: List[SubTaskOut] = []

    model_config = ConfigDict(from_attributes=True)


class TaskBatchUpdate(BaseModel):
    task_ids: List[int]
    status: Optional[str] = None
    list_id: Optional[int] = None
    priority: Optional[int] = None
    due_date: Optional[date] = None
    eisenhower_quadrant: Optional[int] = None
