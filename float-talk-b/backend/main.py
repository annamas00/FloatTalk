from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime
from typing import Any
import uuid
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

# ------------------ App Setup ------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174","http://localhost:5173" ],  # frontend dev server, change if needed
    allow_origin_regex="https?://.*",  # allow all origins for CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ Load Config ------------------

load_dotenv()  # Load .env file



SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = "HS256"
MONGO_URI = os.getenv("MONGO_URI")
print("📡 MONGO_URI =", MONGO_URI)

client = AsyncIOMotorClient(MONGO_URI)
@app.on_event("startup")
async def startup_db_check():
    try:
        await client.admin.command("ping")
        print("✅ MongoDB connected!")
    except Exception as e:
        print("❌ MongoDB connection failed:", e)

db = client["floattalk"]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")



# ------------------ Config ------------------

LOG_FILE = "logs.jsonl"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

fake_users_db = {}  # fake user "database"

# ------------------ Models ------------------

class LogEntry(BaseModel):
    user_id: str
    action: str
    details: Any

class UserProfile(BaseModel):
    email: str
    user_id: str

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
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    return payload.get("sub")

# ------------------ Auth Routes ------------------

@app.post("/register")
async def register(email: str, password: str):
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = {
        "email": email,
        "hashed_password": hash_password(password),
        "user_id": f"user_{uuid.uuid4()}"
    }
    await db.users.insert_one(user)
    return {"msg": "Registered successfully"}


@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me", response_model=UserProfile)
async def read_me(current_user_email: str = Depends(get_current_user)):
    user = await db.users.find_one({"email":current_user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "email": user["email"],
        "user_id": user["user_id"]
    }





# ------------------ App Logic ------------------

@app.get("/auth/anon")
async def create_anon_user():
    return {"user_id": f"anon_{uuid.uuid4()}"}

#-- @app.post("/log")
#async def log_event(entry: LogEntry):
 #   log = entry.dict()
  #  log["timestamp"] = datetime.utcnow().isoformat()
   # await db.logs.insert_one(log)
    #return {"status": "logged"} ----


@app.post("/log")
async def log_event(entry: LogEntry):
    log = entry.dict()
    log["timestamp"] = datetime.utcnow().isoformat()
    print("📥 Log wird gespeichert:", log)
    result = await db.logs.insert_one(log)
    print("📦 Mongo Insert Result:", result.inserted_id)
    return {"status": "logged"}


# -- Startseite --
@app.get("/")
async def root():
    return {"message": "Welcome to the FloatTalk API 🎉"}


# ------------------ Start Server ------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
