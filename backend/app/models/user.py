from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"

class UserBase(BaseModel):
    name: str = "Alex Sterling"
    email: EmailStr
    role: str = "Lead Systems Architect"
    timezone: str = "Africa/Kigali (CAT)"
    timeFormat: str = "24h"
    avatar: str = DEFAULT_AVATAR
    bgImage: str = ""
    emailDigest: bool = True
    emailTime: str = "08:00"
    reportFrequency: str = "daily"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str = Field(min_length=6)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    timezone: Optional[str] = None
    timeFormat: Optional[str] = None
    avatar: Optional[str] = None
    bgImage: Optional[str] = None
    emailDigest: Optional[bool] = None
    emailTime: Optional[str] = None
    reportFrequency: Optional[str] = None

class UserInDB(UserBase):
    id: str
    hashed_password: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(UserBase):
    id: str
    createdAt: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
