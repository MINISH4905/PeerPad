import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from core.config import settings
from routers import auth, notes, teams, ai

app = FastAPI(title=settings.PROJECT_NAME)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from core.database import db, client

# Socket.IO setup
sio = socketio.AsyncServer(
    async_mode='asgi', 
    cors_allowed_origins='*',
    ping_timeout=60,
    ping_interval=25
)
socket_app = socketio.ASGIApp(sio, app)

# Mount routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])

@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = client
    app.database = db

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

# Socket.IO Events
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    room = data.get('noteId') or data.get('teamId')
    if room:
        await sio.enter_room(sid, room)
        print(f"User {sid} joined room {room}")

@sio.event
async def text_change(sid, data):
    room = data.get('noteId') or data.get('teamId')
    if room:
        await sio.emit('text_change', data, room=room, skip_sid=sid)

@sio.event
async def drawing_change(sid, data):
    room = data.get('noteId') or data.get('teamId')
    if room:
        await sio.emit('drawing_change', data, room=room, skip_sid=sid)

@sio.event
async def chat_message(sid, data):
    room = data.get('teamId') or data.get('noteId')
    if room:
        # data should include sender, text, timestamp
        await sio.emit('chat_message', data, room=room, skip_sid=sid)

@sio.event
async def team_note_update(sid, data):
    room = data.get('teamId')
    if room:
        # data should include action ('create', 'delete', 'update') and the note/noteId
        await sio.emit('team_note_update', data, room=room, skip_sid=sid)

if __name__ == "__main__":
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True, log_level="info")
