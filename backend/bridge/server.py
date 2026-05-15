from fastapi import FastAPI, Request
import httpx
import uvicorn

app = FastAPI(title="PeerPad USB Bridge")

MAIN_SERVER_URL = "http://127.0.0.1:8000/api/input/stream"

@app.post("/pad/stream")
async def stream_from_mobile(request: Request):
    data = await request.json()
    # Relay to main server
    async with httpx.AsyncClient() as client:
        await client.post(MAIN_SERVER_URL, json=data)
    return {"status": "relayed"}

@app.get("/pad")
async def get_pad_ui():
    return {
        "msg": "This would serve a minimal drawing UI for the mobile phone browser.",
        "instructions": "Navigate here on your phone, draw, and events are relayed to the main workspace."
    }

if __name__ == "__main__":
    uvicorn.run("bridge.server:app", host="0.0.0.0", port=3002, reload=True)
