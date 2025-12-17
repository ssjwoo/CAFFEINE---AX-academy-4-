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
from app.routers.user import get_current_user

router = APIRouter(
    prefix=" /api/chat,
