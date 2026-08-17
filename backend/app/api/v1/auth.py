from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import create_access_token, verify_password, get_password_hash
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.list import TaskList
from backend.app.models.tag import Tag
from backend.app.models.task import Task
from backend.app.schemas.user import UserCreate, UserLogin, UserOut, Token
from datetime import date, timedelta as dt_delta

router = APIRouter()


async def seed_initial_user_data(db: AsyncSession, user: User):
    """Seed initial lists, tags, and sample tasks for a smooth onboarding experience like TickTick."""
    list_work = TaskList(user_id=user.id, name="Работа", color="#3b82f6", icon="briefcase", sort_order=1)
    list_personal = TaskList(user_id=user.id, name="Личное", color="#10b981", icon="user", sort_order=2)
    list_learning = TaskList(user_id=user.id, name="Обучение", color="#8b5cf6", icon="book-open", sort_order=3)
    db.add_all([list_work, list_personal, list_learning])
    await db.flush()

    tag_urgent = Tag(user_id=user.id, name="Срочно", color="#ef4444")
    tag_idea = Tag(user_id=user.id, name="Идея", color="#f59e0b")
    tag_health = Tag(user_id=user.id, name="Здоровье", color="#10b981")
    db.add_all([tag_urgent, tag_idea, tag_health])
    await db.flush()

    today = date.today()
    sample_task_1 = Task(
        user_id=user.id,
        list_id=list_work.id,
        title="Добро пожаловать в Doto! 🚀",
        description="Doto — это мощный аналог TickTick для задач, привычек, календаря и Pomodoro таймера.\n\n- Используйте **Ctrl+K** или кнопку **+** для быстрого добавления\n- Переключайтесь между списком, Канбаном, Матрицей Эйзенхауэра и Календарем",
        priority=5,
        due_date=today,
        has_time=True,
        all_day=False,
        eisenhower_quadrant=1,
        is_pinned=True,
        tags=[tag_urgent]
    )
    sample_task_2 = Task(
        user_id=user.id,
        list_id=list_personal.id,
        title="Попробовать таймер Помодоро 🍅",
        description="Запустите фокус-сессию в разделе Фокус или прямо из задачи!",
        priority=3,
        due_date=today,
        eisenhower_quadrant=2
    )
    sample_task_3 = Task(
        user_id=user.id,
        list_id=list_learning.id,
        title="Настроить трекер привычек 🎯",
        description="Создайте ежедневные цели: чтение, спорт, медитация.",
        priority=1,
        due_date=today + dt_delta(days=1),
        eisenhower_quadrant=2,
        tags=[tag_idea]
    )
    db.add_all([sample_task_1, sample_task_2, sample_task_3])
    await db.commit()


@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)) -> Any:
    # Check if user exists
    existing = await db.execute(
        select(User).where(or_(User.email == user_in.email, User.username == user_in.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email или логином уже существует."
        )

    user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name or user_in.username,
        hashed_password=get_password_hash(user_in.password),
        theme="dark"
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Seed starter data
    await seed_initial_user_data(db, user)

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(
        select(User).where(or_(User.email == user_in.username_or_email, User.username == user_in.username_or_email))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный логин или пароль."
        )

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(
        select(User).where(or_(User.email == form_data.username, User.username == form_data.username))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный логин или пароль."
        )

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/demo", response_model=Token)
async def demo_login(db: AsyncSession = Depends(get_db)) -> Any:
    """Instant login / creation for guest demo access."""
    demo_email = "demo@doto.app"
    result = await db.execute(select(User).where(or_(User.email == demo_email, User.username == "demo_user")))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email=demo_email,
            username="demo_user",
            full_name="Демо Пользователь",
            hashed_password=get_password_hash("demo12345"),
            theme="dark"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        await seed_initial_user_data(db, user)

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)) -> Any:
    return current_user
