from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt
from core.security import create_access_token, get_password_hash, verify_password
from core.config import settings
from models.user import UserModel

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(user_in: UserRegister):
    from core.database import db
    existing_user = await db.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_dict = {
        "name": user_in.name,
        "email": user_in.email,
        "hashed_password": get_password_hash(user_in.password),
        "created_at": datetime.utcnow(),
        "last_active": datetime.utcnow(),
        "refresh_tokens": []
    }
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id)
    settings_dict = {
        "darkMode": False,
        "notifications": True,
        "emailUpdates": True,
        "aiSuggestions": True,
        "autoSave": True,
        "language": "English"
    }
    user_dict["settings"] = settings_dict
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user_id, "name": user_in.name, "email": user_in.email, "settings": settings_dict}}

@router.post("/login")
async def login(user_in: UserLogin):
    from core.database import db
    user = await db.users.find_one({"email": user_in.email})
    if not user or not verify_password(user_in.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(str(user["_id"]))
    user_id = str(user.pop("_id"))
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user_id, "name": user["name"], "email": user["email"], "settings": user.get("settings", {})}}

@router.patch("/settings/{user_id}")
async def update_settings(user_id: str, settings_in: dict):
    from core.database import db
    from bson import ObjectId
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"settings": settings_in}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"msg": "Settings updated"}

@router.delete("/account/{user_id}")
async def delete_account(user_id: str):
    from core.database import db
    from bson import ObjectId
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # 1. Get user email before deletion for team cleanup
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_email = user.get("email")

    # 2. Permanent deletion of all notes owned by this user
    await db.notes.delete_many({"owner_id": user_id})
    
    # 3. Remove user from all teams and note collaborations
    if user_email:
        # Delete teams owned by this user
        await db.teams.delete_many({"owner_id": user_id})
        
        # Remove from team members list of other teams
        await db.teams.update_many(
            {"members": user_email},
            {"$pull": {"members": user_email}}
        )
        # Remove from team pending invites list
        await db.teams.update_many(
            {"pending_invites": user_email},
            {"$pull": {"pending_invites": user_email}}
        )
        # Remove from note collaborators list
        await db.notes.update_many(
            {"collaborators": user_email},
            {"$pull": {"collaborators": user_email}}
        )
    
    # 4. Delete AI summaries associated with this user
    await db.summaries.delete_many({"user_id": user_id})
    
    # 5. Final permanent deletion of the user account
    await db.users.delete_one({"_id": ObjectId(user_id)})
    
    return {"msg": "Account and all associated data permanently deleted"}
