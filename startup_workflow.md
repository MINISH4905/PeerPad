# PeerPad Startup Workflow

To fully start the PeerPad application locally, you will need to open **three separate terminal windows** to run the frontend, the primary backend, and the AI bridge server.

Here are the commands for each terminal:

### Terminal 1: React Frontend
This terminal runs the Vite development server for the user interface.

```powershell
# Navigate to the project root
cd c:\peerpad

# Start the frontend dev server
npm run dev
```
*(Runs on http://localhost:5173)*

---

### Terminal 2: Main FastAPI & Socket.IO Backend
This terminal runs the primary backend handling authentication, database operations, and real-time Socket.IO collaboration.

```powershell
# Navigate to the backend directory
cd c:\peerpad\backend

# Activate the Python virtual environment
peer\Scripts\activate

# Start the main FastAPI server
uvicorn main:socket_app --reload --port 8000
```
*(Runs on http://localhost:8000)*

---

### Terminal 3: AI Bridge Server
This terminal runs the secondary microservice responsible for the AI debate system and AI tool generation.

```powershell
# Navigate to the backend directory
cd c:\peerpad\backend

# Activate the Python virtual environment
peer\Scripts\activate

# Start the AI bridge server
uvicorn bridge.server:app --reload --port 3002
```
*(Runs on http://localhost:3002)*

---

### Troubleshooting
- If you see `module not found` errors in the backend, ensure your virtual environment `(peer)` is active before running Uvicorn.
- If the frontend shows a blank screen or fails to load, verify that `npm install` has been run and both backend servers are currently active, as the frontend proxy relies on them.
