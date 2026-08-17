from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    email: str
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    theme: Optional[str] = "dark"
    pomo_work_duration: Optional[int] = 25
    pomo_short_break: Optional[int] = 5
    pomo_long_break: Optional[int] = 15
    pomo_long_break_interval: Optional[int] = 4
    sound_enabled: Optional[bool] = True


class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    theme: Optional[str] = None
    pomo_work_duration: Optional[int] = None
    pomo_short_break: Optional[int] = None
    pomo_long_break: Optional[int] = None
    pomo_long_break_interval: Optional[int] = None
    sound_enabled: Optional[bool] = None
    password: Optional[str] = None


class UserOut(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
