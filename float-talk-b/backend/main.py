from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Any
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import uuid
import os

# ------------------ Setup ------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:5173",
        "https://annamas00.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = "HS256"
MONGO_URI = os.getenv("MONGO_URI")

client = AsyncIOMotorClient(MONGO_URI)
db = client["floattalk"]
users = db["users"]
bottles = db["bottles"]
messages = db["messages"]
conversations = db["conversations"]
logs = db["logs"]

@app.on_event("startup")
async def startup_db_check():
    try:
        await client.admin.command("ping")
        print("✅ MongoDB connected!")
    except Exception as e:
        print("❌ MongoDB connection failed:", e)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ------------------ Models ------------------

class LogEntry(BaseModel):
    user_id: str
    action: str
    details: Any

class UserProfile(BaseModel):
    email: EmailStr
    user_id: str
    nickname: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    nickname: str

# ------------------ Utils ------------------

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def hash_password(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    email = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return email

# ------------------ Auth ------------------

@app.post("/register")
async def register_user(payload: RegisterRequest):
    if await users.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await users.find_one({"nickname": payload.nickname}):
        raise HTTPException(status_code=400, detail="Nickname already taken")

    user = {
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "nickname": payload.nickname,
        "user_id": f"user_{uuid.uuid4()}"
    }
    await users.insert_one(user)
    return {"msg": "User registered successfully"}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user["email"]})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me", response_model=UserProfile)
async def read_me(current_user_email: str = Depends(get_current_user)):
    user = await users.find_one({"email": current_user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "email": user["email"],
        "user_id": user["user_id"],
        "nickname": user["nickname"]
    }

@app.get("/auth/anon")
async def create_anon_user():
    return {"user_id": f"anon_{uuid.uuid4()}"}

# ------------------ Bottles & Logs ------------------

@app.post("/log")
async def log_event(entry: LogEntry):
    log = entry.dict()
    log["timestamp"] = datetime.utcnow().isoformat()
    print("📥 Log received:", log)
    await logs.insert_one(log)
    return {"status": "logged"}

@app.get("/bottles")
async def get_valid_bottles():
    now = datetime.utcnow().isoformat()
    cursor = logs.find({
        "action": "bottle_thrown",
        "details.duration_until": {"$gt": now}
    })
    bottles_out = []
    async for doc in cursor:
        bottles_out.append({
            "title": doc["action"],
            "message": doc["details"].get("tags", []),
            "location": doc["details"].get("location", {}),
            "time": doc["details"].get("time"),
            "duration_until": doc["details"].get("duration_until")
        })
    return JSONResponse(content=bottles_out)

@app.post("/add_bottle")
async def add_bottle(req: Request):
    data = await req.json()
    bottle_doc = {
        "bottle_id": data["bottle_id"],
        "sender_id": data["sender_id"],
        "content": data["content"],
        "type": data.get("type", "text"),
        "bottle_timestamp": datetime.utcnow(),
        "bottle_expire_at": datetime.utcnow() + timedelta(days=2),
        "status": "floating",
        "tags": data.get("tags", []),
        "location": data.get("location", {}),
        "picked_by": None,
        "picked_at": None,
        "reply_enabled": True,
        "city": data.get("city", "")
    }
    await bottles.insert_one(bottle_doc)
    return {"status": "success", "message": "Bottle stored!"}

@app.get("/my_bottles")
async def get_my_bottles(user_id: str):
    cursor = bottles.find({"sender_id": user_id}).sort("bottle_timestamp", -1)
    return {"bottles": [
        {
            "bottle_id": doc.get("bottle_id"),
            "content": doc.get("content"),
            "tags": doc.get("tags", []),
            "timestamp": doc.get("bottle_timestamp"),
            "status": doc.get("status", "floating")
        } async for doc in cursor
    ]}

@app.get("/all_bottles")
async def get_all_bottles():
    cursor = bottles.find().sort("bottle_timestamp", -1)
    return {"bottles": [
        {
            "bottle_id": doc.get("bottle_id"),
            "content": doc.get("content"),
            "tags": doc.get("tags", []),
            "timestamp": doc.get("bottle_timestamp"),
            "status": doc.get("status", "floating")
        } async for doc in cursor
    ]}

# ------------------ Conversation ------------------

@app.post("/reply")
async def send_reply(data: dict):
    bottle_id = data.get("bottle_id")
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    content = data.get("content")
    if not all([bottle_id, sender_id, receiver_id, content]):
        return {"status": "error", "message": "Missing required fields"}

    conv = await conversations.find_one({"bottle_id": bottle_id})
    if not conv:
        conv_doc = {
            "conversation_id": f"conv_{bottle_id}",
            "bottle_id": bottle_id,
            "participants": [sender_id, receiver_id],
            "created_at": datetime.utcnow(),
            "last_updated": datetime.utcnow(),
            "status": "active",
            "reply_enabled": True
        }
        await conversations.insert_one(conv_doc)
    else:
        conv_doc = conv

    message = {
        "message_id": f"msg_{int(datetime.utcnow().timestamp())}",
        "conversation_id": conv_doc["conversation_id"],
        "bottle_id": bottle_id,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": content,
        "type": "text",
        "timestamp": datetime.utcnow(),
        "status": "sent",
        "reply_to": None
    }
    await messages.insert_one(message)
    await conversations.update_one(
        {"conversation_id": conv_doc["conversation_id"]},
        {"$set": {"last_updated": datetime.utcnow()}}
    )
    return {"status": "success", "message": "Reply stored"}

@app.get("/conversation/{bottle_id}/messages")
async def get_conversation_messages(bottle_id: str):
    conv = await conversations.find_one({"bottle_id": bottle_id})
    if not conv:
        return {"messages": []}
    cursor = messages.find({"conversation_id": conv["conversation_id"]}).sort("timestamp", 1)
    return {"messages": [
        {
            "sender_id": msg.get("sender_id"),
            "content": msg.get("content"),
            "timestamp": msg.get("timestamp"),
            "type": msg.get("type", "text"),
            "status": msg.get("status", "sent")
        } async for msg in cursor
    ]}

# ------------------ Start ------------------

@app.get("/")
async def root():
    return {"message": "Welcome to the FloatTalk API 🎉"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
