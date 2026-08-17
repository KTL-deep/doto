from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class TaskList(Base):
    __tablename__ = "lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    color = Column(String, default="#3b82f6")  # Hex color or color name
    icon = Column(String, default="folder")    # Icon key
    is_folder = Column(Boolean, default=False)
    parent_id = Column(Integer, ForeignKey("lists.id", ondelete="SET NULL"), nullable=True)
    sort_order = Column(Integer, default=0)
    view_mode = Column(String, default="list") # list, kanban, timeline
    is_archived = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="lists")
    tasks = relationship("Task", back_populates="task_list", cascade="all, delete-orphan")
    children = relationship("TaskList", backref="parent", remote_side=[id])
