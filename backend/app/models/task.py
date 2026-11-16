from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SubTask(BaseModel):
    id: str
    text: str
    completed: bool = False

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    category: str = "Work"
    priority: str = "Medium"
    status: str = "Not Started"
    dueDate: Optional[str] = None
    startTime: Optional[str] = "09:00"
    endTime: Optional[str] = "10:00"
    timeSpentSeconds: int = 0
    subtasks: List[SubTask] = Field(default_factory=list)

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    dueDate: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    timeSpentSeconds: Optional[int] = None
    subtasks: Optional[List[SubTask]] = None

class TaskTimeIncrement(BaseModel):
    seconds: int = 1

class TaskResponse(TaskBase):
    id: str
    userId: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
