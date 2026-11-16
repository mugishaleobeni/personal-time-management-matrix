from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class NoteBase(BaseModel):
    title: str = "Untitled Scratchpad Note"
    category: str = "Ideas"
    pinned: bool = False
    tags: List[str] = Field(default_factory=list)
    content: str = ""

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    pinned: Optional[bool] = None
    tags: Optional[List[str]] = None
    content: Optional[str] = None

class NoteResponse(NoteBase):
    id: str
    userId: str
    updatedAt: str
    createdAt: Optional[datetime] = None
