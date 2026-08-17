from typing import Optional, List
from datetime import datetime, date, time
from pydantic import BaseModel, ConfigDict


class HabitLogBase(BaseModel):
    date: date
    value: Optional[int] = 1
    note: Optional[str] = None


class HabitLogCreate(HabitLogBase):
    pass


class HabitLogOut(HabitLogBase):
    id: int
    habit_id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HabitBase(BaseModel):
    name: str
    icon: Optional[str] = "star"
    color: Optional[str] = "#ec4899"
    goal_days: Optional[str] = "1,2,3,4,5,6,7"
    target_frequency: Optional[int] = 1
    frequency_unit: Optional[str] = "day"
    frequency_unit_label: Optional[str] = "times"
    reminder_time: Optional[time] = None
    is_archived: Optional[bool] = False
    sort_order: Optional[int] = 0


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    goal_days: Optional[str] = None
    target_frequency: Optional[int] = None
    frequency_unit: Optional[str] = None
    frequency_unit_label: Optional[str] = None
    reminder_time: Optional[time] = None
    is_archived: Optional[bool] = None
    sort_order: Optional[int] = None


class HabitOut(HabitBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    current_streak: Optional[int] = 0
    best_streak: Optional[int] = 0
    total_completions: Optional[int] = 0
    today_completed: Optional[bool] = False
    today_value: Optional[int] = 0
    recent_logs: List[HabitLogOut] = []

    model_config = ConfigDict(from_attributes=True)
