from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Any
import uuid
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from fastapi.responses import JSONResponse

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
users_collection = db.users
logs_collection = db.logs
bottles = db.bottles
messages = db.messages
conversations = db.conversations

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

# ------------------ Auth Routes ------------------

@app.post("/register")
async def register_user(payload: RegisterRequest):
    if await users_collection.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    if await users_collection.find_one({"nickname": payload.nickname}):
        raise HTTPException(status_code=400, detail="Nickname already taken")

    user = {
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "nickname": payload.nickname,
        "user_id": f"user_{uuid.uuid4()}"
    }

    await users_collection.insert_one(user)
    return {"msg": "User registered successfully"}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user["email"]})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me", response_model=UserProfile)
async def read_me(current_user_email: str = Depends(get_current_user)):
    user = await users_collection.find_one({"email": current_user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "email": user["email"],
        "user_id": user["user_id"],
        "nickname": user["nickname"]
    }

# ------------------ Bottles and Logs ------------------

@app.get("/auth/anon")
async def create_anon_user():
    return {"user_id": f"anon_{uuid.uuid4()}"}

@app.post("/log")
async def log_event(entry: LogEntry):
    log = entry.dict()
    log["timestamp"] = datetime.utcnow().isoformat()
    print("📥 Log received:", log)
    result = await logs_collection.insert_one(log)
    print("📦 Mongo insert ID:", result.inserted_id)
    return {"status": "logged"}

@app.get("/bottles")
async def get_valid_bottles():
    now = datetime.utcnow().isoformat()
    cursor = logs_collection.find({
        "action": "bottle_thrown",
        "details.duration_until": {"$gt": now}
    })

    bottles = []
    async for doc in cursor:
        bottles.append({
            "title": doc["action"],
            "message": doc["details"].get("tags", []),
            "location": doc["details"].get("location", {}),
            "time": doc["details"].get("time"),
            "duration_until": doc["details"].get("duration_until")
        })

    return JSONResponse(content=bottles)

@app.get("/all_bottles")
async def get_all_bottles():
    result = []
    cursor = bottles.find().sort("bottle_timestamp", -1)
    async for doc in cursor:
        result.append({
            "bottle_id": doc.get("bottle_id"),
            "content": doc.get("content"),
            "tags": doc.get("tags", []),
            "timestamp": doc.get("bottle_timestamp"),
            "status": doc.get("status", "floating")
        })
    return {"bottles": result}

@app.get("/my_bottles")
async def get_my_bottles(user_id: str):
    result = []
    cursor = bottles.find({"sender_id": user_id}).sort("bottle_timestamp", -1)
    async for doc in cursor:
        result.append({
            "bottle_id": doc.get("bottle_id"),
            "content": doc.get("content"),
            "tags": doc.get("tags", []),
            "timestamp": doc.get("bottle_timestamp"),
            "status": doc.get("status", "floating")
        })
    return {"bottles": result}

# ------------------ Root ------------------

@app.get("/")
async def root():
    return {"message": "It works."}

# ------------------ Run ------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)