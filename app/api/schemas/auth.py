from typing import Optional

from pydantic import BaseModel


class LoginInput(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    is_admin: bool


class SessionResponse(BaseModel):
    valid: bool
    username: Optional[str] = None
    is_admin: Optional[bool] = None


class ChangePasswordInput(BaseModel):
    old_password: str
    new_password: str
