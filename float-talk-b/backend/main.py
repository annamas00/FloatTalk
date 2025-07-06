from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Any
from motor.motor_asyncio import AsyncIOMotorClient,AsyncIOMotorDatabase
from dotenv import load_dotenv
import uuid
import os
from typing import List
import httpx
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
import math
from datetime import datetime, timezone
from bson import ObjectId
from zoneinfo import ZoneInfo

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
class UserUpdate(BaseModel):
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

@app.put("/me")
async def update_me(
    payload: UserUpdate,
    current_user_email: str = Depends(get_current_user)
):
    result = await users.update_one(
        {"email": current_user_email},
        {"$set": {"nickname": payload.nickname}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No changes applied")

    return {"message": "Profile updated"}

@app.get("/auth/anon")
async def create_anon_user():
    return {"user_id": f"anon_{uuid.uuid4()}"}

# ------------------ Bottles & Logs ------------------

LOCAL_TZ = ZoneInfo("Europe/Berlin")


client = AsyncIOMotorClient(
    MONGO_URI,
    tz_aware=True,        
)
db = client["floattalk"]

def now_local():
    return datetime.now(timezone.utc)



@app.post("/log")
async def log_event(entry: LogEntry):
    log = entry.dict()
    log["timestamp"] = now_local().isoformat()
    print("📥 Log received:", log)
    await logs.insert_one(log)
    return {"status": "logged"}

@app.get("/bottles")
async def get_valid_bottles():
    now = now_local().isoformat()
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
        "bottle_timestamp": now_local(),
        #"bottle_expire_at": datetime.utcnow() + timedelta(days=2),
        "status": "floating",
        "tags": data.get("tags", []),
        "location": data.get("location", {}),
        "picked_by": None,
        "picked_at": None,
        "reply_enabled": True,
        "city": data.get("city", ""),
        "visibility_km": data.get("visibility_km", 5)
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

#@app.get("/all_bottles")
#async def get_all_bottles():
 #   cursor = bottles.find().sort("bottle_timestamp", -1)
  #  return {"bottles": [
   #     {
     #       "bottle_id": doc.get("bottle_id"),
    #        "content": doc.get("content"),
      #      "tags": doc.get("tags", []),
       #     "timestamp": doc.get("bottle_timestamp"),
        #    "status": doc.get("status", "floating")
        #} async for doc in cursor
    #]}
@app.get("/all_bottles")
async def get_all_bottles():
    cursor = bottles.find().sort("bottle_timestamp", -1)

    result = []
    async for doc in cursor:          # <- korrektes async-Iterieren
        result.append({
            "bottle_id": doc.get("bottle_id"),
            "sender_id": doc.get("sender_id"),
            "content": doc.get("content"),
            "tags": doc.get("tags", []),
            "timestamp": doc.get("bottle_timestamp"),
            "status":    doc.get("status", "floating"),
            "location":  doc.get("location", {})      # ♦ wichtig für Marker
        })

    return {"bottles": result}




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
            "created_at": now_local(),
            "last_updated": now_local(),
            "status": "active",
            "reply_enabled": True
        }
        await conversations.insert_one(conv_doc)
    else:
        
       await conversations.update_one(
            {"_id": conv["_id"]},
            {
                "$addToSet": {
                    "participants": {"$each": [sender_id, receiver_id]}
                },
                "$set": {
                    "last_updated": now_local()
                }
            }
        )
       conv_doc = await conversations.find_one({"_id": conv["_id"]}) 
       
    message = {
        "message_id": f"msg_{int(now_local().timestamp())}",
        "conversation_id": conv_doc["conversation_id"],
        "bottle_id": bottle_id,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": content,
        "type": "text",
        "timestamp": now_local(),
        "status": "sent",
        "reply_to": None
    }
    await messages.insert_one(message)
    await conversations.update_one(
        {"conversation_id": conv_doc["conversation_id"]},
        {"$set": {"last_updated": now_local()}}
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



@app.get("/conversations/user/{user_id}")
async def get_user_conversations(user_id: str):
    try:
        cursor = conversations.find(
            {"participants": user_id, "status": "active"}
        ).sort("last_updated", -1)

        result = []

        async for conv in cursor:
            conversation_id = conv.get("conversation_id")
            bottle_id = conv.get("bottle_id")
            
            bottle_doc = await bottles.find_one({"bottle_id": bottle_id})
            bottle_preview = bottle_doc.get("content") if bottle_doc else None

            sender_id = bottle_doc.get("sender_id") if bottle_doc else None
            sender_doc = await users.find_one({"user_id": sender_id}) if sender_id else None
            sender_nickname = sender_doc.get("nickname") if sender_doc else None

           

            first_msg = await messages.find_one(
                {"conversation_id": conversation_id},
                sort=[("timestamp", 1)]
            )

            participant_ids = conv.get("participants", [])
            participants_info = []

            for pid in participant_ids:
                user_doc = await users.find_one({"user_id": pid})
                participants_info.append({
                    "user_id": pid,
                    "nickname": user_doc.get("nickname") if user_doc else None
                })

            result.append({
                "conversation_id": conversation_id,
                "bottle_id": conv.get("bottle_id"),
                "participants": participants_info,  # user_id + nickname
                "last_updated": conv.get("last_updated"),
                "preview": bottle_preview,
                "bottle_sender": {
                    "user_id": sender_id,
                    "nickname": sender_nickname or sender_id
                                                    },
                "first_message": {
                    "sender_id": first_msg.get("sender_id") if first_msg else None,
                    "content": first_msg.get("content") if first_msg else None,
                    "timestamp": first_msg.get("timestamp") if first_msg else None
                } if first_msg else None
            })

        return result

    except Exception as e:
        print(f"Error in get_user_conversations: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

""" @app.get("/conversation/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: str):
    convo = conversations.find_one({"conversation_id": conversation_id})
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = list(messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0, "sender_id": 1, "content": 1, "timestamp": 1}
    ))
    messages.sort(key=lambda x: x["timestamp"])  
    return {
        "conversation_id": conversation_id,
        "participants": convo["participants"],
        "messages": messages
    } """

def get_database() -> AsyncIOMotorDatabase:
    return db

@app.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
   
    conversation = await db.conversations.find_one({"conversation_id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    bottle = await db.bottles.find_one({"bottle_id": conversation.get("bottle_id")})
    if not bottle:
        raise HTTPException(status_code=404, detail="Bottle not found")

   
    user_docs = db.users.find({})
    user_map = {}
    async for user in user_docs:
        user_map[user.get("user_id")] = user.get("nickname", user.get("user_id"))

    
    cursor = db.messages.find({"conversation_id": conversation_id}).sort("timestamp", 1)
    messages = []
    async for msg in cursor:
        sender_id = msg.get("sender_id")
        messages.append({
            "timestamp": msg.get("timestamp"),
            "sender_id": sender_id,
            "sender_nickname": user_map.get(sender_id, sender_id),  
            "content": msg.get("content")
        })

    return {
        "conversation_id": conversation_id,
        "participants": conversation.get("participants", []),
        "messages": messages,
        "bottle_id": conversation.get("bottle_id"),
        "bottle": {
            "sender_id": bottle.get("sender_id"),
            "sender_nickname": user_map.get(bottle.get("sender_id"), bottle.get("sender_id")),  
            "content": bottle.get("content"),
            "timestamp": bottle.get("bottle_timestamp")
        }
    }


# -----------------------------------------
# Reverse-Geocode-Proxy                   |
# -----------------------------------------


geo = APIRouter()

@geo.get("/api/reverse")              
async def reverse_proxy(lat: float, lon: float):
    url = (
        "https://nominatim.openstreetmap.org/reverse"
        f"?format=json&lat={lat}&lon={lon}&addressdetails=1&zoom=18"
    )
    headers = {"User-Agent": "FloatTalk/1.0 (you@example.com)"}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, headers=headers)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, "Upstream error")

app.include_router(geo)


#----nearby bottles----

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Entfernung in Metern zwischen zwei WGS84-Koordinaten."""
    R = 6371000  # Erdradius [m]
    φ1, φ2 = map(math.radians, [lat1, lat2])
    dφ      = math.radians(lat2 - lat1)
    dλ      = math.radians(lon2 - lon1)

    a = (math.sin(dφ / 2) ** 2 +
         math.cos(φ1) * math.cos(φ2) * math.sin(dλ / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(a))

def _doc_to_json(doc: dict) -> dict:
    """Mongo-Dokument → JSON-fähiges Dict (ObjectId → str)."""
    doc = dict(doc)           # kopieren – Cursor‐Objekt ist SON
    doc["_id"] = str(doc["_id"])
    return doc

@app.get("/nearby_bottles")
async def nearby(lat: float, lon: float, radius: int = 5000):
    out: list[dict] = [] 
    """Alle aktuell gültigen Bottles im Umkreis (radius m)."""
    now = now_local()
    #cursor = bottles.find({"expire_at": {"$gt": now}})
    cursor = bottles.find({ 
            "location.lat": {"$exists": True},
            "location.lon": {"$exists": True},
            # Beispiel für künftiges TTL-Feld:
            # "expire_at": {"$gt": now}
        }
    )

    async for doc in cursor:
        loc = doc.get("location", {})
        if "lat" not in loc or "lon" not in loc:
            continue

        dist = _haversine(lat, lon, loc["lat"], loc["lon"])
        if dist <= radius:
            out.append(_doc_to_json(doc))

    return {"bottles": out}
# ------------------ Start ------------------

@app.get("/")
async def root():
    return {"message": "Welcome to the FloatTalk API 🎉"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
