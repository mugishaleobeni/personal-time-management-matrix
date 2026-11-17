from pydantic import BaseModel, Field, root_validator
from typing import List, Optional, Any, Dict
from datetime import datetime
import uuid

class SubTask(BaseModel):
    id: Optional[str] = None
    text: str = ""
    completed: bool = False

    @root_validator(pre=True)
    def normalize_subtask(cls, values):
        if isinstance(values, str):
            return {"id": f"st-{uuid.uuid4().hex[:8]}", "text": values, "completed": False}
        if isinstance(values, dict):
            s_id = values.get("id") or values.get("_id") or f"st-{uuid.uuid4().hex[:8]}"
            text = values.get("text") or values.get("title") or values.get("name") or ""
            completed = bool(values.get("completed", False))
            return {"id": str(s_id), "text": str(text), "completed": completed}
        return values

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

    @root_validator(pre=True)
    def normalize_task_base(cls, values):
        if isinstance(values, dict):
            if values.get("subtasks") is None:
                values["subtasks"] = []
        return values

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

    @root_validator(pre=True)
    def normalize_task_update(cls, values):
        if isinstance(values, dict) and "subtasks" in values and values["subtasks"] is None:
            values["subtasks"] = []
        return values

class TaskTimeIncrement(BaseModel):
    seconds: int = 1

class TaskResponse(TaskBase):
    id: str
    userId: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
