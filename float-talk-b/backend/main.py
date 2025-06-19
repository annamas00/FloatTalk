from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime
from typing import Any
import uuid
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from fastapi import Body
# ------------------ Setup ------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5173", "https://annamas00.github.io"],
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

class UserCreate(BaseModel):
    email: EmailStr
    password: str

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

# ------------------ Routes ------------------

@app.post("/register")
async def register_user(payload: RegisterRequest):
    # Check for existing email
    existing_user = await users_collection.find_one({"email": payload.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_nickname = await users_collection.find_one({"nickname": payload.nickname})
    if existing_nickname:
        raise HTTPException(status_code=400, detail="Nickname already taken")

    user = {
        "email": payload.email,
        "hashed_password": pwd_context.hash(payload.password),
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
        "user_id": user["user_id"]
    }

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

@app.get("/")
async def root():
    return {"message": "It works."}

# ------------------ Run ------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
