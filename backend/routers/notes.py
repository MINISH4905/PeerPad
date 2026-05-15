from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from models.note import NoteModel, VersionModel
from bson import ObjectId

router = APIRouter()

@router.post("/")
async def create_note(note: NoteModel):
    from core.database import db
    note_dict = note.dict(by_alias=True)
    if "_id" in note_dict and note_dict["_id"] is None:
        del note_dict["_id"]
    
    # Ensure timestamps
    note_dict["created_at"] = datetime.utcnow()
    note_dict["updated_at"] = datetime.utcnow()
        
    result = await db.notes.insert_one(note_dict)
    note_dict["id"] = str(result.inserted_id)
    if "_id" in note_dict:
        del note_dict["_id"]
    return note_dict

# --- Specific routes MUST come before /{note_id} to avoid conflicts ---

@router.get("/user/{user_id}")
async def get_user_notes(user_id: str):
    from core.database import db
    notes = []
    cursor = db.notes.find({"owner_id": user_id, "archived": {"$ne": True}})
    async for document in cursor:
        document["id"] = str(document.pop("_id"))
        notes.append(document)
    return notes

@router.get("/user/{user_id}/archived")
async def get_archived_notes(user_id: str):
    from core.database import db
    notes = []
    cursor = db.notes.find({"owner_id": user_id, "archived": True})
    async for document in cursor:
        document["id"] = str(document.pop("_id"))
        notes.append(document)
    return notes

@router.get("/team/{team_id}")
async def get_team_notes(team_id: str):
    """Fetch all non-archived notes belonging to a team — visible to all team members."""
    from core.database import db
    notes = []
    cursor = db.notes.find({"teamId": team_id, "archived": {"$ne": True}})
    async for document in cursor:
        document["id"] = str(document.pop("_id"))
        notes.append(document)
    return notes

# --- Generic note routes ---

@router.get("/{note_id}")
async def get_note(note_id: str):
    from core.database import db
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    note = await db.notes.find_one({"_id": ObjectId(note_id)})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note["id"] = str(note.pop("_id"))
    return note

@router.patch("/{note_id}")
async def update_note(note_id: str, update_data: dict):
    from core.database import db
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    update_data["updated_at"] = datetime.utcnow()
    
    # If content changes, we could append to versions here
    if "content" in update_data:
        # Simplified: just update. Real implementation would snapshot.
        pass

    await db.notes.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": update_data}
    )
    updated_note = await db.notes.find_one({"_id": ObjectId(note_id)})
    updated_note["id"] = str(updated_note.pop("_id"))
    return updated_note

@router.delete("/{note_id}")
async def archive_note(note_id: str):
    from core.database import db
    from datetime import timedelta
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    deleted_at = datetime.utcnow()
    expires_at = deleted_at + timedelta(days=30)
    
    result = await db.notes.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": {
            "archived": True, 
            "deletedAt": deleted_at,
            "expiresAt": expires_at,
            "updated_at": deleted_at
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"msg": "Note archived"}

@router.post("/{note_id}/restore")
async def restore_note(note_id: str):
    from core.database import db
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    result = await db.notes.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": {"archived": False, "updated_at": datetime.utcnow()}}
    )
    return {"msg": "Note restored"}

@router.delete("/{note_id}/permanent")
async def permanent_delete_note(note_id: str):
    from core.database import db
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    result = await db.notes.delete_one({"_id": ObjectId(note_id)})
    return {"msg": "Note permanently deleted"}
