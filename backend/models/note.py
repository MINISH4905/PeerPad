from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Any, Annotated
from datetime import datetime
from bson import ObjectId

# Pydantic v2 compatible ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

class VersionModel(BaseModel):
    content: str
    saved_at: datetime = Field(default_factory=datetime.utcnow)

class NoteModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    title: str = "Untitled Note"
    content: str = ""
    type: str = "text"  # 'text' or 'drawing'
    drawing_data: Optional[dict] = None
    dataURL: Optional[str] = None  # Base64 drawing data from canvas
    images: List[Any] = []
    tag: str = "PERSONAL"
    owner_id: str
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    collaborators: List[str] = []
    teamId: Optional[str] = None  # Matches frontend field name
    subject: Optional[str] = None
    ai_generated: bool = False
    archived: bool = False
    versions: List[VersionModel] = []
    timestamp: Optional[Any] = None  # Frontend timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        extra = "allow"  # Accept extra fields from frontend
