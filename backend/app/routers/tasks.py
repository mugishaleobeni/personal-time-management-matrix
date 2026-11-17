import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.task import TaskCreate, TaskUpdate, TaskResponse, TaskTimeIncrement
from app.utils.dependencies import get_current_user
from app.repository import get_col
from app.services.seed_service import seed_user_defaults

router = APIRouter(prefix="/tasks", tags=["Tasks Manager"])

def serialize_task(doc: dict) -> dict:
    item = dict(doc)
    item["id"] = item.get("_id") or item.get("id")
    raw_subtasks = item.get("subtasks")
    if not isinstance(raw_subtasks, list):
        raw_subtasks = []
    normalized_subtasks = []
    for s in raw_subtasks:
        if isinstance(s, dict):
            s_dict = dict(s)
            s_id = s_dict.get("id") or s_dict.get("_id") or f"st-{uuid.uuid4().hex[:8]}"
            s_text = s_dict.get("text") or s_dict.get("title") or s_dict.get("name") or ""
            s_completed = bool(s_dict.get("completed", False))
            normalized_subtasks.append({"id": str(s_id), "text": str(s_text), "completed": s_completed})
        elif isinstance(s, str):
            normalized_subtasks.append({"id": f"st-{uuid.uuid4().hex[:8]}", "text": s, "completed": False})
    item["subtasks"] = normalized_subtasks
    return item

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["_id"]
    query = {"userId": user_id}
    if category and category != "All":
        query["category"] = category
    if priority and priority != "All":
        query["priority"] = priority
    if status and status != "All":
        query["status"] = status
        
    tasks = await get_col("tasks").find(query).to_list(1000)
    
    if search and isinstance(search, str) and search.strip():
        s_lower = search.strip().lower()
        tasks = [t for t in tasks if s_lower in t.get("title", "").lower() or s_lower in t.get("description", "").lower()]
        
    return [TaskResponse(**serialize_task(t)) for t in tasks]

@router.post("", response_model=TaskResponse)
async def create_task(data: TaskCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    task_id = f"tsk-{uuid.uuid4().hex[:10]}"
    
    now = datetime.utcnow()
    doc = data.dict()
    doc["_id"] = task_id
    doc["userId"] = user_id
    doc["createdAt"] = now
    doc["updatedAt"] = now
    
    await get_col("tasks").insert_one(doc)
    return TaskResponse(**serialize_task(doc))

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    task = await get_col("tasks").find_one({"_id": task_id, "userId": user_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse(**serialize_task(task))

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, data: TaskUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    tasks_col = get_col("tasks")
    
    existing = await tasks_col.find_one({"_id": task_id, "userId": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    
    # Auto-check all subtasks when task status is updated to Completed
    if update_data.get("status") == "Completed" and "subtasks" not in update_data:
        existing_subtasks = existing.get("subtasks", []) or []
        if existing_subtasks:
            update_data["subtasks"] = [
                {**st, "completed": True} if isinstance(st, dict) else {"id": f"st-{idx}", "text": str(st), "completed": True}
                for idx, st in enumerate(existing_subtasks)
            ]
    
    await tasks_col.update_one({"_id": task_id, "userId": user_id}, {"$set": update_data})
    updated = await tasks_col.find_one({"_id": task_id, "userId": user_id}) or existing
    updated.update(update_data)
    return TaskResponse(**serialize_task(updated))

@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    res = await get_col("tasks").delete_one({"_id": task_id, "userId": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "deleted_id": task_id}

@router.post("/{task_id}/toggle", response_model=TaskResponse)
async def toggle_task_completion(task_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    tasks_col = get_col("tasks")
    task = await tasks_col.find_one({"_id": task_id, "userId": user_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    next_status = "In Progress" if task.get("status") == "Completed" else "Completed"
    update_doc = {"status": next_status, "updatedAt": datetime.utcnow()}
    
    # When completing task, automatically check all subtasks and save to database
    subtasks = task.get("subtasks", []) or []
    if next_status == "Completed" and subtasks:
        updated_subtasks = [
            {**st, "completed": True} if isinstance(st, dict) else {"id": f"st-{idx}", "text": str(st), "completed": True}
            for idx, st in enumerate(subtasks)
        ]
        update_doc["subtasks"] = updated_subtasks
        task["subtasks"] = updated_subtasks
        
    await tasks_col.update_one(
        {"_id": task_id, "userId": user_id},
        {"$set": update_doc}
    )
    task["status"] = next_status
    return TaskResponse(**serialize_task(task))

@router.post("/{task_id}/time", response_model=TaskResponse)
async def accumulate_task_time(task_id: str, body: TaskTimeIncrement, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    tasks_col = get_col("tasks")
    
    await tasks_col.update_one(
        {"_id": task_id, "userId": user_id},
        {"$inc": {"timeSpentSeconds": body.seconds}, "$set": {"updatedAt": datetime.utcnow()}}
    )
    task = await tasks_col.find_one({"_id": task_id, "userId": user_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse(**serialize_task(task))
