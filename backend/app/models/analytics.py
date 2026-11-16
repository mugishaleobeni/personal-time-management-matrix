from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DailyFocus(BaseModel):
    day: str
    hours: float
    target: float
    score: int

class CategoryBreakdown(BaseModel):
    category: str
    taskCount: int
    percentage: int

class AnalyticsSummaryResponse(BaseModel):
    productivityScore: int
    totalTasks: int
    completedTasks: int
    pendingTasks: int
    urgentTasks: int
    totalRoutines: int
    completedRoutines: int
    totalFocusSeconds: int
    weeklyFocusHours: List[DailyFocus]
    categoryBreakdown: List[CategoryBreakdown]
