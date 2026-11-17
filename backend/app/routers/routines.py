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
    item["id"] = item.get("_id") or item.get("id")
    return item

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
    routine_id = f"rt-{uuid.uuid4().hex[:10]}"
    
    now = datetime.utcnow()
    doc = data.dict()
    doc["_id"] = routine_id
    doc["userId"] = user_id
    doc["createdAt"] = now
    doc["updatedAt"] = now
    
    await get_col("routines").insert_one(doc)
    return RoutineResponse(**serialize_routine(doc))

@router.put("/{routine_id}", response_model=RoutineResponse)
async def update_routine(routine_id: str, data: RoutineUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    col = get_col("routines")
    
    existing = await col.find_one({"_id": routine_id, "userId": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Routine not found")
        
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    
    await col.update_one({"_id": routine_id, "userId": user_id}, {"$set": update_data})
    updated = await col.find_one({"_id": routine_id, "userId": user_id}) or existing
    updated.update(update_data)
    return RoutineResponse(**serialize_routine(updated))

@router.delete("/{routine_id}")
async def delete_routine(routine_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    res = await get_col("routines").delete_one({"_id": routine_id, "userId": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Routine not found")
    return {"status": "success", "deleted_id": routine_id}

@router.post("/{routine_id}/toggle", response_model=RoutineResponse)
async def toggle_routine(routine_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    col = get_col("routines")
    
    routine = await col.find_one({"_id": routine_id, "userId": user_id})
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
        
    next_completed = not routine.get("completed", False)
    current_streak = routine.get("streak", 1)
    next_streak = current_streak + 1 if next_completed else max(0, current_streak - 1)
    
    update_fields = {
        "completed": next_completed,
        "streak": next_streak,
        "updatedAt": datetime.utcnow()
    }
    await col.update_one({"_id": routine_id, "userId": user_id}, {"$set": update_fields})
    routine.update(update_fields)
    return RoutineResponse(**serialize_routine(routine))
