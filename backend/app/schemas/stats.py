from typing import List, Dict, Any
from pydantic import BaseModel


class DailyTaskStat(BaseModel):
    date: str
    completed_count: int
    created_count: int


class ProductivityStatsOut(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    completion_rate: float
    current_task_streak: int
    total_focus_hours: float
    total_habits_completed: int
    karma_score: int
    daily_stats_last_7_days: List[DailyTaskStat] = []
