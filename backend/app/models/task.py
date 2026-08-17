from datetime import datetime, date, time, timezone
from typing import List
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.tag import task_tags


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    list_id = Column(Integer, ForeignKey("lists.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True, default="")
    
    # Priority: 0 (None), 1 (Low/Blue), 3 (Medium/Yellow), 5 (High/Red)
    priority = Column(Integer, default=0)
    
    # Status: todo, completed, archived, trash
    status = Column(String, default="todo", index=True)
    
    # Due Date & Time & Duration
    due_date = Column(Date, nullable=True, index=True)
    due_time = Column(Time, nullable=True)
    duration_minutes = Column(Integer, default=30)
    has_time = Column(Boolean, default=False)
    all_day = Column(Boolean, default=True)
    
    # Reminders & Recurrence
    reminder_at = Column(DateTime, nullable=True)
    recurrence_rule = Column(String, nullable=True) # DAILY, WEEKDAYS, WEEKLY, MONTHLY, YEARLY, or RRULE string
    
    # Sorting, Pinning & Organization
    is_pinned = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    
    # Eisenhower Matrix Quadrant (1: Urgent & Important, 2: Not Urgent & Important, 3: Urgent & Not Important, 4: Not Urgent & Not Important)
    eisenhower_quadrant = Column(Integer, default=4)
    
    # Kanban Board Column
    kanban_column = Column(String, default="todo")
    
    # Pomodoro Tracking
    estimated_pomo = Column(Integer, default=1)
    actual_pomo = Column(Integer, default=0)
    
    # Timestamps
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="tasks")
    task_list = relationship("TaskList", back_populates="tasks")
    tags = relationship("Tag", secondary=task_tags, back_populates="tasks")
    subtasks = relationship("SubTask", back_populates="task", cascade="all, delete-orphan", order_by="SubTask.sort_order")
    focus_sessions = relationship("FocusSession", back_populates="task", cascade="all, delete-orphan")


class SubTask(Base):
    __tablename__ = "subtasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    due_date = Column(Date, nullable=True)
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    task = relationship("Task", back_populates="subtasks")
