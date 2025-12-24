from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional, List
import os
import httpx
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.db.model.transaction import Transaction, Category
from app.db.model.user import User

router = APIRouter(
    prefix="/api/chat",
    tags=["chatbot"],
    responses={404: {"description": "Not found"}},
)

class ChatMessage(BaseModel):
    message: str
    naggingLevel: str
    history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    reply: str
    mood: Optional[str] = "neutral"
