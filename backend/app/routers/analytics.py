from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.models.analytics import AnalyticsSummaryResponse, DailyFocus, CategoryBreakdown
from app.utils.dependencies import get_current_user
from app.repository import get_col
from app.services.pdf_service import generate_productivity_pdf

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])

@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    tasks = await get_col("tasks").find({"userId": user_id}).to_list(1000)
    routines = await get_col("routines").find({"userId": user_id}).to_list(1000)
    
    completed_tasks = [t for t in tasks if t.get("status") == "Completed"]
    pending_tasks = [t for t in tasks if t.get("status") != "Completed"]
    urgent_tasks = [t for t in tasks if t.get("priority") == "Urgent" and t.get("status") != "Completed"]
    completed_routines = [r for r in routines if r.get("completed")]
    
    total_seconds = sum(t.get("timeSpentSeconds", 0) for t in tasks)
    
    # Calculate score
    total_t = len(tasks) or 1
    total_r = len(routines) or 1
    task_ratio = (len(completed_tasks) / total_t) * 60
    routine_ratio = (len(completed_routines) / total_r) * 40
    score = min(100, round(task_ratio + routine_ratio))
    
    # Weekly breakdown
    weekly_data = [
        DailyFocus(day="Mon", hours=6.5, target=8, score=82),
        DailyFocus(day="Tue", hours=7.8, target=8, score=94),
        DailyFocus(day="Wed", hours=8.2, target=8, score=98),
        DailyFocus(day="Thu", hours=5.4, target=8, score=71),
        DailyFocus(day="Fri", hours=7.2, target=8, score=89),
        DailyFocus(day="Sat", hours=4.0, target=4, score=90),
        DailyFocus(day="Sun", hours=3.5, target=4, score=85),
    ]
    
    # Category breakdown
    cats = {}
    for t in tasks:
        c = t.get("category", "Work")
        cats[c] = cats.get(c, 0) + 1
        
    category_breakdown = [
        CategoryBreakdown(category=cat, taskCount=count, percentage=round((count / total_t) * 100))
        for cat, count in cats.items()
    ]
    
    return AnalyticsSummaryResponse(
        productivityScore=score,
        totalTasks=len(tasks),
        completedTasks=len(completed_tasks),
        pendingTasks=len(pending_tasks),
        urgentTasks=len(urgent_tasks),
        totalRoutines=len(routines),
        completedRoutines=len(completed_routines),
        totalFocusSeconds=total_seconds,
        weeklyFocusHours=weekly_data,
        categoryBreakdown=category_breakdown
    )

@router.get("/export-pdf")
async def export_pdf(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    tasks = await get_col("tasks").find({"userId": user_id}).to_list(1000)
    routines = await get_col("routines").find({"userId": user_id}).to_list(1000)
    
    pdf_stream = generate_productivity_pdf(current_user, tasks, routines)
    filename = f"Chronos-Productivity-Dossier-{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
