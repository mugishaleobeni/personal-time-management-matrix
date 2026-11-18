from pydantic import BaseModel, EmailStr
from typing import Optional, List

class NotificationSettingsUpdate(BaseModel):
    emailTime: Optional[str] = "08:00"
    reportFrequency: Optional[str] = "daily"
    emailDigest: Optional[bool] = True

class DigestDispatchResponse(BaseModel):
    status: str
    recipient: str
    digestSummary: str
    tasksDueToday: int
    routinesCompleted: int
    dispatchedAt: str
    delivered: Optional[bool] = False
    provider: Optional[str] = "brevo"
