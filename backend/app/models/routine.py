from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class RoutineBase(BaseModel):
    id: Optional[str] = None
    period: str = "Morning"  # Morning | Afternoon | Evening
    title: str
    time: str = "06:00"
    duration: int = 30  # minutes
    completed: bool = False
    lastCompletedDate: Optional[str] = None
    streak: int = 1
    days: List[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5, 6, 7])

class RoutineCreate(RoutineBase):
    pass

class RoutineUpdate(BaseModel):
    period: Optional[str] = None
    title: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[int] = None
    completed: Optional[bool] = None
    lastCompletedDate: Optional[str] = None
    streak: Optional[int] = None
    days: Optional[List[int]] = None

class RoutineResponse(RoutineBase):
    id: str
    userId: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
