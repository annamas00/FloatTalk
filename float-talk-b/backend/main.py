from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Any
import uuid
import json

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
LOG_FILE = "logs.jsonl"

class LogEntry(BaseModel):
    user_id: str
    action: str
    details: Any  

@app.get("/auth/anon")
def create_anon_user():
    return {"user_id": f"anon_{uuid.uuid4()}"}

@app.post("/log")
def log_event(entry: LogEntry):
    print("Log endpoint called!")
    log = entry.dict()
    log["timestamp"] = datetime.utcnow().isoformat()

    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(log) + "\n")

    return {"status": "logged"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
