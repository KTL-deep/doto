from fastapi import APIRouter
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.users import router as users_router
from backend.app.api.v1.tasks import router as tasks_router
from backend.app.api.v1.lists import router as lists_router
from backend.app.api.v1.tags import router as tags_router
from backend.app.api.v1.habits import router as habits_router
from backend.app.api.v1.focus import router as focus_router
from backend.app.api.v1.matrix import router as matrix_router
from backend.app.api.v1.calendar import router as calendar_router
from backend.app.api.v1.stats import router as stats_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["tasks"])
api_router.include_router(lists_router, prefix="/lists", tags=["lists"])
api_router.include_router(tags_router, prefix="/tags", tags=["tags"])
api_router.include_router(habits_router, prefix="/habits", tags=["habits"])
api_router.include_router(focus_router, prefix="/focus", tags=["focus"])
api_router.include_router(matrix_router, prefix="/matrix", tags=["matrix"])
api_router.include_router(calendar_router, prefix="/calendar", tags=["calendar"])
api_router.include_router(stats_router, prefix="/stats", tags=["stats"])
