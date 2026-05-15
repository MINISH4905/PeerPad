from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Optional
from pydantic import BaseModel
from services.ai_service import get_llama_suggestion, summarize_text, extract_text_from_pdf, text_summarize, explain_concept, generate_quiz
from datetime import datetime
from core.database import db

router = APIRouter()

class SuggestionRequest(BaseModel):
    text: str
    subject: Optional[str] = None

class TextRequest(BaseModel):
    text: str

@router.post("/suggest")
async def suggest(request: SuggestionRequest):
    suggestion = await get_llama_suggestion(request.text, request.subject)
    return {"title": "Error", "keyPoints": ["Could not connect to Llama 3"]}

@router.post("/summarize")
async def summarize(file: UploadFile = File(...), user_id: Optional[str] = None):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    text = await extract_text_from_pdf(content)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
    summary = await summarize_text(text)
    
    # Save summary to DB
    summary_doc = {
        "title": summary.get("title", "Summary"),
        "description": summary.get("description", ""),
        "filename": file.filename,
        "user_id": user_id,
        "created_at": datetime.utcnow()
    }
    await db.summaries.insert_one(summary_doc)
    
    return summary

@router.post("/text-summarize")
async def summarize_text_api(request: TextRequest):
    return await text_summarize(request.text)

@router.post("/explain")
async def explain_api(request: TextRequest):
    result = await explain_concept(request.text)
    return {"explanation": result}

@router.post("/quiz")
async def quiz_api(request: TextRequest):
    result = await generate_quiz(request.text)
    return {"quiz": result}

@router.get("/recent")
async def get_recent_summaries(user_id: Optional[str] = None):
    from core.database import db
    summaries = []
    query = {"user_id": user_id} if user_id else {}
    cursor = db.summaries.find(query).sort("created_at", -1).limit(5)
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        summaries.append(doc)
    return summaries

@router.delete("/recent/{summary_id}")
async def delete_summary(summary_id: str):
    from core.database import db
    from bson import ObjectId
    if not ObjectId.is_valid(summary_id):
        raise HTTPException(status_code=400, detail="Invalid summary ID")
    await db.summaries.delete_one({"_id": ObjectId(summary_id)})
    return {"status": "success"}

@router.get("/stats")
async def get_stats():
    # Count unique users in summaries collection
    unique_users = await db.summaries.distinct("user_id")
    return {
        "unique_users_count": len(unique_users)
    }
