import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.routine import RoutineCreate, RoutineUpdate, RoutineResponse
from app.utils.dependencies import get_current_user
from app.repository import get_col
from app.services.seed_service import seed_user_defaults

router = APIRouter(prefix="/routines", tags=["Daily Routines"])

def serialize_routine(doc: dict) -> dict:
    item = dict(doc)
    item["id"] = str(item.get("_id") or item.get("id"))
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    last_date = item.get("lastCompletedDate")
    # A daily routine is only completed if it was completed TODAY.
    # When a new day arrives, it automatically presents as unchecked for daily tracking.
    if last_date != today_str:
        item["completed"] = False
    else:
        item["completed"] = bool(item.get("completed", False))
    return item

def get_routine_query(routine_id: str, user_id: str) -> dict:
    conditions: List[dict] = [{"_id": str(routine_id)}, {"id": str(routine_id)}]
    try:
        from bson import ObjectId
        if ObjectId.is_valid(routine_id):
            conditions.append({"_id": ObjectId(routine_id)})
    except Exception:
        pass
    return {"userId": user_id, "$or": conditions}

@router.get("", response_model=List[RoutineResponse])
async def list_routines(
    period: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["_id"]
    query = {"userId": user_id}
    if period and period != "All":
        query["period"] = period
        
    routines = await get_col("routines").find(query).to_list(1000)
    return [RoutineResponse(**serialize_routine(r)) for r in routines]

@router.post("", response_model=RoutineResponse)
async def create_routine(data: RoutineCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    routine_id = (data.id and str(data.id).startswith("rt-")) and str(data.id) or f"rt-{uuid.uuid4().hex[:10]}"
    
    now = datetime.utcnow()
    doc = data.dict()
    doc["_id"] = routine_id
    doc["id"] = routine_id
    doc["userId"] = user_id
    doc["createdAt"] = now
    doc["updatedAt"] = now
    
    await get_col("routines").insert_one(doc)
    return RoutineResponse(**serialize_routine(doc))

@router.put("/{routine_id}", response_model=RoutineResponse)
async def update_routine(routine_id: str, data: RoutineUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    col = get_col("routines")
    
    existing = await col.find_one(get_routine_query(routine_id, user_id))
    if not existing:
        raise HTTPException(status_code=404, detail="Routine not found")
        
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    
    target_id = existing.get("_id") or existing.get("id") or routine_id
    await col.update_one({"_id": target_id}, {"$set": update_data})
    updated = await col.find_one({"_id": target_id}) or existing
    updated.update(update_data)
    return RoutineResponse(**serialize_routine(updated))

@router.delete("/{routine_id}")
async def delete_routine(routine_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    col = get_col("routines")
    existing = await col.find_one(get_routine_query(routine_id, user_id))
    if not existing:
        raise HTTPException(status_code=404, detail="Routine not found")
    target_id = existing.get("_id") or existing.get("id") or routine_id
    res = await col.delete_one({"_id": target_id})
    return {"status": "success", "deleted_id": routine_id}

@router.post("/{routine_id}/toggle", response_model=RoutineResponse)
async def toggle_routine(routine_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    col = get_col("routines")
    
    routine = await col.find_one(get_routine_query(routine_id, user_id))
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
        
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    is_completed_today = (routine.get("lastCompletedDate") == today_str and routine.get("completed", False))
    next_completed = not is_completed_today
    
    current_streak = routine.get("streak", 0)
    if next_completed:
        next_streak = (current_streak or 0) + 1
        new_last_date = today_str
    else:
        next_streak = max(0, (current_streak or 1) - 1)
        new_last_date = None
    
    update_fields = {
        "completed": next_completed,
        "lastCompletedDate": new_last_date,
        "streak": next_streak,
        "updatedAt": datetime.utcnow()
    }
    target_id = routine.get("_id") or routine.get("id") or routine_id
    await col.update_one({"_id": target_id}, {"$set": update_fields})
    routine.update(update_fields)
    return RoutineResponse(**serialize_routine(routine))
