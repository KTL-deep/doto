from datetime import datetime, date, time, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String, nullable=False)
    icon = Column(String, default="star")
    color = Column(String, default="#ec4899")
    
    # Target Days: comma-separated day numbers (1=Mon, 7=Sun) e.g. "1,2,3,4,5,6,7" or target count
    goal_days = Column(String, default="1,2,3,4,5,6,7")
    target_frequency = Column(Integer, default=1) # e.g. 1 time per day, 8 glasses of water
    frequency_unit = Column(String, default="day") # day, week
    frequency_unit_label = Column(String, default="times") # times, glasses, pages, minutes
    
    reminder_time = Column(Time, nullable=True)
    is_archived = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="habits")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan", order_by="desc(HabitLog.date)")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    date = Column(Date, nullable=False, index=True)
    value = Column(Integer, default=1)
    note = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    habit = relationship("Habit", back_populates="logs")
