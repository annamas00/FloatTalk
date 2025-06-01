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

# ------------------ App Setup ------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5174",
    "https://annamas00.github.io" 
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ Config ------------------

LOG_FILE = "logs.jsonl"
SECRET_KEY = "key"
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

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    return payload.get("sub")

# ------------------ Auth Routes ------------------

@app.post("/register")
def register(email: str, password: str):
    if email in fake_users_db:
        raise HTTPException(status_code=400, detail="User already exists")

    fake_users_db[email] = {
        "email": email,
        "hashed_password": hash_password(password),
        "user_id": f"user_{uuid.uuid4()}"
    }

    return {"msg": "Registered successfully"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = fake_users_db.get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me", response_model=UserProfile)
def read_me(current_user_email: str = Depends(get_current_user)):
    user = fake_users_db.get(current_user_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "email": user["email"],
        "user_id": user["user_id"]
    }

@app.get("/")
def read_root():
    return {"status": "ok"}
# ------------------ App Logic ------------------

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

# ------------------ Start Server ------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
