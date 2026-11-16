import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.note import NoteCreate, NoteUpdate, NoteResponse
from app.utils.dependencies import get_current_user
from app.repository import get_col
from app.services.seed_service import seed_user_defaults

router = APIRouter(prefix="/notes", tags=["Notebook"])

def serialize_note(doc: dict) -> dict:
    item = dict(doc)
    item["id"] = item.get("_id") or item.get("id")
    if "updatedAt" in item and isinstance(item["updatedAt"], datetime):
        item["updatedAt"] = item["updatedAt"].strftime("%b %d, %Y %H:%M")
    elif "updatedAt" not in item:
        item["updatedAt"] = "Just now"
    return item

@router.get("", response_model=List[NoteResponse])
async def list_notes(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["_id"]
    await seed_user_defaults(user_id)
    
    query = {"userId": user_id}
    if category and category != "All":
        query["category"] = category
        
    notes = await get_col("notes").find(query).to_list(1000)
    
    if search:
        s_lower = search.lower()
        notes = [n for n in notes if s_lower in n.get("title", "").lower() or s_lower in n.get("content", "").lower()]
        
    return [NoteResponse(**serialize_note(n)) for n in notes]

@router.post("", response_model=NoteResponse)
async def create_note(data: NoteCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    note_id = f"nt-{uuid.uuid4().hex[:10]}"
    
    now = datetime.utcnow()
    doc = data.dict()
    doc["_id"] = note_id
    doc["userId"] = user_id
    doc["createdAt"] = now
    doc["updatedAt"] = "Just now"
    
    await get_col("notes").insert_one(doc)
    return NoteResponse(**serialize_note(doc))

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    note = await get_col("notes").find_one({"_id": note_id, "userId": user_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteResponse(**serialize_note(note))

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(note_id: str, data: NoteUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    col = get_col("notes")
    
    existing = await col.find_one({"_id": note_id, "userId": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Note not found")
        
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    update_data["updatedAt"] = "Just now"
    
    await col.update_one({"_id": note_id, "userId": user_id}, {"$set": update_data})
    updated = await col.find_one({"_id": note_id, "userId": user_id}) or existing
    updated.update(update_data)
    return NoteResponse(**serialize_note(updated))

@router.delete("/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    res = await get_col("notes").delete_one({"_id": note_id, "userId": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"status": "success", "deleted_id": note_id}
