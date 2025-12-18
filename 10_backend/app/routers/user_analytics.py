"""
User Analytics Router
Provides endpoints for tracking new signups, churned users, and churn metrics
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.model.user import User
from app.db.model.transaction import Transaction
from app.db.schema.user import UserResponse
from app.routers.user import get_current_user
from pydantic import BaseModel
from fastapi import HTTPException, status

router = APIRouter(prefix="/api/admin/users", tags=["Admin - User Analytics"])


# Schemas
class ChurnMetrics(BaseModel):
    """Churn rate metrics"""
    churn_rate: float
    total_churned: int
    active_users: int
    new_signups: int
    total_users: int


# Helper to check superuser
async def verify_superuser(current_user: User) -> User:
    """Verify that current user is a superuser"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


# Helper function to check if user is churned
async def is_user_churned(db: AsyncSession, user_id: int, days: int = 30) -> bool:
    """Check if user has no transactions in the last N days"""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    result = await db.execute(
        select(Transaction)
        .where(
            and_(
                Transaction.user_id == user_id,
                Transaction.transaction_time >= cutoff_date
            )
        )
        .limit(1)
    )
    
    # If no recent transactions, user is churned
    return result.scalar_one_or_none() is None


@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all users
    
    **Admin only endpoint**
    """
    await verify_superuser(current_user)
    
    result = await db.execute(
        select(User).order_by(User.created_at.desc())
    )
    
    users = result.scalars().all()
    return users


@router.get("/new-signups", response_model=List[UserResponse])
async def get_new_signups(
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get users who signed up in the last N days
    
    **Admin only endpoint**
    """
    await verify_superuser(current_user)
    cutoff_date = datetime.now() - timedelta(days=days)
    
    result = await db.execute(
        select(User)
        .where(User.created_at >= cutoff_date)
        .order_by(User.created_at.desc())
    )
    
    users = result.scalars().all()
    return users


@router.get("/churned", response_model=List[UserResponse])
async def get_churned_users(
    days: int = Query(30, ge=1, le=365, description="Days of inactivity to consider churned"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get users with no transactions in the last N days
    
    **Admin only endpoint**
    """
    await verify_superuser(current_user)
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Get all users
    result = await db.execute(select(User))
    all_users = result.scalars().all()
    
    # Filter churned users
    churned_users = []
    for user in all_users:
        if await is_user_churned(db, user.id, days):
            churned_users.append(user)
    
    return churned_users


@router.get("/stats/churn-rate", response_model=ChurnMetrics)
async def get_churn_rate(
    churn_days: int = Query(30, ge=1, le=365, description="Days of inactivity for churn"),
    signup_days: int = Query(30, ge=1, le=365, description="Days to count new signups"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get churn rate and related metrics
    
    **Admin only endpoint**
    
    - **churn_rate**: Percentage of users who are churned
    - **total_churned**: Number of churned users
    - **active_users**: Number of active users (not churned)
    - **new_signups**: New users in the specified period
    - **total_users**: Total registered users
    """
    await verify_superuser(current_user)
    # Get total users
    total_result = await db.execute(select(func.count(User.id)))
    total_users = total_result.scalar() or 0
    
    # Get new signups
    signup_cutoff = datetime.now() - timedelta(days=signup_days)
    signup_result = await db.execute(
        select(func.count(User.id))
        .where(User.created_at >= signup_cutoff)
    )
    new_signups = signup_result.scalar() or 0
    
    # Get all users and check churn status
    result = await db.execute(select(User))
    all_users = result.scalars().all()
    
    total_churned = 0
    for user in all_users:
        if await is_user_churned(db, user.id, churn_days):
            total_churned += 1
    
    active_users = total_users - total_churned
    churn_rate = (total_churned / total_users * 100) if total_users > 0 else 0.0
    
    return ChurnMetrics(
        churn_rate=round(churn_rate, 2),
        total_churned=total_churned,
        active_users=active_users,
        new_signups=new_signups,
        total_users=total_users
    )
