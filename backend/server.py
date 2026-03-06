from fastapi import FastAPI, APIRouter
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# --- Models ---
class SessionTab(BaseModel):
    url: str
    title: str
    pinned: bool = False

class SessionWindow(BaseModel):
    tabs: List[SessionTab]

class SessionCreate(BaseModel):
    name: str
    windows: List[SessionWindow]

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    windows: List[SessionWindow]
    window_count: int = 0
    tab_count: int = 0
    saved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# --- Routes ---
@api_router.get("/")
async def root():
    return {"message": "TabPilot API"}

@api_router.post("/sessions", response_model=Session, status_code=201)
async def create_session(input_data: SessionCreate):
    session = Session(
        name=input_data.name,
        windows=input_data.windows,
        window_count=len(input_data.windows),
        tab_count=sum(len(w.tabs) for w in input_data.windows),
    )
    doc = session.model_dump()
    await db.sessions.insert_one(doc)
    return session

@api_router.get("/sessions", response_model=List[Session])
async def get_sessions():
    sessions = await db.sessions.find({}, {"_id": 0}).sort("saved_at", -1).to_list(100)
    return sessions

@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    await db.sessions.delete_one({"id": session_id})
    return {"status": "deleted"}


# --- Suggestions ---
class SuggestionCreate(BaseModel):
    name: str = ""
    message: str

class Suggestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    message: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

@api_router.post("/suggestions", response_model=Suggestion, status_code=201)
async def create_suggestion(input_data: SuggestionCreate):
    suggestion = Suggestion(name=input_data.name, message=input_data.message)
    doc = suggestion.model_dump()
    await db.suggestions.insert_one(doc)
    return suggestion


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
