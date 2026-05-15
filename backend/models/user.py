from pydantic import BaseModel, EmailStr, Field, BeforeValidator
from typing import List, Optional, Annotated
from datetime import datetime
from bson import ObjectId

# Pydantic v2 compatible ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    refresh_tokens: List[str] = []
    settings: dict = Field(default_factory=lambda: {
        "darkMode": False,
        "notifications": True,
        "emailUpdates": True,
        "aiSuggestions": True,
        "autoSave": True,
        "language": "English"
    })

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
