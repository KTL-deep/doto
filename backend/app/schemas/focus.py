from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FocusSessionCreate(BaseModel):
    duration_minutes: int
    session_type: Optional[str] = "pomodoro"  # pomodoro, stopwatch
    task_id: Optional[int] = None
    note: Optional[str] = None
    started_at: datetime
    ended_at: datetime


class FocusSessionOut(BaseModel):
    id: int
    user_id: int
    task_id: Optional[int] = None
    duration_minutes: int
    session_type: str
    note: Optional[str] = None
    started_at: datetime
    ended_at: datetime
    created_at: datetime
    task_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FocusStatsOut(BaseModel):
    total_focus_minutes: int
    total_sessions_count: int
    today_focus_minutes: int
    today_sessions_count: int
    weekly_focus_minutes: int
    daily_distribution: Dict[str, int] = {}
