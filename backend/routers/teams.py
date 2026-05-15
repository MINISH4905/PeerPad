from fastapi import APIRouter, HTTPException
from typing import List, Optional
from bson import ObjectId

router = APIRouter()

@router.post("/")
async def create_team(team_data: dict):
    from core.database import db
    # members are emails
    # invites are emails that haven't joined yet
    result = await db.teams.insert_one(team_data)
    team_data["id"] = str(result.inserted_id)
    if "_id" in team_data: del team_data["_id"]
    return team_data

@router.get("/invites/{email}")
async def get_team_invites(email: str):
    from core.database import db
    # Find teams where user is in 'members' but maybe we want a separate 'pending_invites'?
    # For simplicity, if they are in 'members', they are in the team.
    # But the user wants to "view invites sent from other accounts".
    # Let's add a 'pending_invites' field.
    cursor = db.teams.find({"pending_invites": email})
    invites = await cursor.to_list(length=100)
    for t in invites:
        t["id"] = str(t.pop("_id"))
    return invites

@router.get("/{team_id}")
async def get_team(team_id: str):
    from core.database import db
    team = await db.teams.find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    team["id"] = str(team.pop("_id"))
    return team

@router.post("/{team_id}/join")
async def join_team(team_id: str, data: dict):
    from core.database import db
    user_email = data.get("email")
    if not user_email:
        raise HTTPException(status_code=400, detail="Email required")
    
    # Add user to members if not already there
    await db.teams.update_one(
        {"_id": ObjectId(team_id)},
        {"$addToSet": {"members": user_email}}
    )
    return {"message": "Joined successfully"}

@router.get("/user/{email}")
async def get_user_teams(email: str):
    from core.database import db
    cursor = db.teams.find({"members": email})
    teams = await cursor.to_list(length=100)
    for t in teams:
        t["id"] = str(t.pop("_id"))
    return teams

@router.delete("/{team_id}")
async def delete_team(team_id: str):
    from core.database import db
    if not ObjectId.is_valid(team_id):
        raise HTTPException(status_code=400, detail="Invalid team ID")
    await db.teams.delete_one({"_id": ObjectId(team_id)})
    # Also delete notes associated with this team
    await db.notes.delete_many({"teamId": team_id})
    return {"status": "success"}

@router.post("/{team_id}/invite")
async def invite_user(team_id: str, data: dict):
    from core.database import db
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    # Add email to pending_invites if not already in members
    team = await db.teams.find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    if email in team.get("members", []):
        return {"message": "User is already a member"}
        
    await db.teams.update_one(
        {"_id": ObjectId(team_id)},
        {"$addToSet": {"pending_invites": email}}
    )
    return {"message": f"Invite sent to {email}"}
