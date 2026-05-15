import httpx
import json
import io
from PyPDF2 import PdfReader
from core.config import settings

OLLAMA_URL = settings.OLLAMA_URL + "/api/generate"
MODEL = settings.OLLAMA_MODEL

async def get_llama_suggestion(text: str, subject: str = None) -> str:
    subject_ctx = f"The subject is {subject}. " if subject else ""
    prompt = f"You are an academic note assistant. {subject_ctx}Continue this sentence naturally (5-10 words): '{text}'. Return ONLY the continuation."
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False
        })
        if response.status_code == 200:
            return response.json().get("response", "").strip()
    return ""

async def extract_text_from_pdf(file_content: bytes) -> str:
    pdf = PdfReader(io.BytesIO(file_content))
    text = ""
    for page in pdf.pages:
        text += page.extract_text()
    return text

async def summarize_text(text: str) -> dict:
    prompt = f"""You are an elite academic researcher. Analyze the following text and provide a comprehensive, high-level executive summary.
    Identify the core thesis, key methodologies used, critical findings, and the final conclusion.
    
    Structure your response as a JSON object with:
    1. 'title': A professional academic title.
    2. 'description': A single comprehensive STRING containing the executive description (no nested objects).
    
    Text to analyze:
    {text[:12000]}
    
    Return ONLY the JSON object."""
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.3,
                "num_ctx": 16384
            }
        })
        if response.status_code == 200:
            res_text = response.json().get("response", "{}")
            print(f"DEBUG AI RAW: {res_text[:200]}...") # Log first 200 chars
            try:
                import re
                # Find the first { and last } to extract JSON even if AI adds extra text
                match = re.search(r"\{.*\}", res_text, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                    # Safety check: ensure description is a string
                    if isinstance(data.get("description"), dict):
                        # Convert dict to a nicely formatted string
                        desc_obj = data["description"]
                        data["description"] = "\n\n".join([f"{k.capitalize()}: {v}" for k, v in desc_obj.items()])
                    return data
                return json.loads(res_text)
            except Exception as e:
                print(f"JSON Parse Error: {e}")
                return {"title": "Summary", "description": f"Error parsing AI response: {str(e)}"}
    return {"title": "Error", "description": "Could not connect to Llama 3."}

async def text_summarize(text: str) -> dict:
    prompt = f"Summarize the following academic notes into a comprehensive executive description. Text: {text[:8000]}"
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False
        })
        if response.status_code == 200:
            return {"description": response.json().get("response", "")}
    return {"description": "Error generating summary"}

async def explain_concept(text: str) -> str:
    prompt = f"Identify the most complex academic concept in this text and explain it simply like I am 5 years old. Text: {text[:5000]}"
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False
        })
        if response.status_code == 200:
            return response.json().get("response", "")
    return "Error generating explanation"

async def generate_quiz(text: str) -> str:
    prompt = f"Generate 3 multiple choice questions based on this academic text to test my knowledge. Text: {text[:5000]}"
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False
        })
        if response.status_code == 200:
            return response.json().get("response", "")
    return "Error generating quiz"
