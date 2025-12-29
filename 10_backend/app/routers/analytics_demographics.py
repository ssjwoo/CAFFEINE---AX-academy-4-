"""
Demographics Analytics Router
Provides age-based consumption analysis endpoints
"""

from datetime import datetime, date, timedelta
from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from collections import defaultdict

from app.db.database import get_db
from app.db.model.user import User
from app.db.model.transaction import Transaction
from app.routers.user import get_current_user
from pydantic import BaseModel
from fastapi import HTTPException, status

router = APIRouter(prefix="/analytics/demographics", tags=["Admin - Demographics Analytics"])


# Schemas
class AgeGroupData(BaseModel):
    """Age group data"""
    age_group: str
    count: int

class CategoryAmount(BaseModel):
    """Category amount pair"""
    category: str
    amount: float

class ConsumptionByAge(BaseModel):
    """Consumption data by age group"""
    age_group: str
    user_count: int
    total_spending: float
    avg_transaction_amount: float
    top_categories: List[CategoryAmount]

class CategoryPreferenceByAge(BaseModel):
    """Category preference by age group"""
    age_group: str
    top_category: str
    second_category: str
    third_category: str


# Helper to check superuser
async def verify_superuser(current_user: User) -> User:
    """Verify that current user is a superuser"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


# Helper functions
def calculate_age(birth_date: datetime) -> int:
    """Calculate age from birth date"""
    if not birth_date:
        return None
    
    today = date.today()
    b_date = birth_date.date() if isinstance(birth_date, datetime) else birth_date
    
    age = today.year - b_date.year
    # Adjust if birthday hasn't occurred this year
    if today.month < b_date.month or (today.month == b_date.month and today.day < b_date.day):
        age -= 1
    
    return age


def get_age_group(age: int) -> str:
    """Map age to age group"""
    if age is None:
        return "알 수 없음"
    elif age < 18:
        return "18세 미만"
    elif 18 <= age < 25:
        return "18-24세"
    elif 25 <= age < 35:
        return "25-34세"
    elif 35 <= age < 45:
        return "35-44세"
    elif 45 <= age < 55:
        return "45-54세"
    else:
        return "55세 이상"


@router.get("/age-groups", response_model=List[AgeGroupData])
async def get_age_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get distribution of users by age group
    
    **Admin only endpoint**
    """
    await verify_superuser(current_user)
    result = await db.execute(select(User))
    all_users = result.scalars().all()
    
    age_groups = defaultdict(int)
    
    for user in all_users:
        age = calculate_age(user.birth_date) if user.birth_date else None
        age_group = get_age_group(age)
        age_groups[age_group] += 1
    
    # Sort in logical age order
    order = ["18세 미만", "18-24세", "25-34세", "35-44세", "45-54세", "55세 이상", "알 수 없음"]
    sorted_groups = sorted(
        [AgeGroupData(age_group=k, count=v) for k, v in age_groups.items()],
        key=lambda x: order.index(x.age_group) if x.age_group in order else 999
    )
    
    return sorted_groups


@router.get("/consumption-by-age", response_model=List[ConsumptionByAge])
async def get_consumption_by_age(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get consumption statistics by age group
    
    **Admin only endpoint**
    
    Returns total spending, average transaction amount, and top categories for each age group
    """
    await verify_superuser(current_user)
    
    # Import Category model
    from app.db.model.transaction import Category
    
    # Get all transactions with user and category info (explicit joins)
    result = await db.execute(
        select(User.id, User.birth_date, Transaction.amount, Category.name.label('category_name'))
        .join(Transaction, User.id == Transaction.user_id)
        .join(Category, Transaction.category_id == Category.id)
    )
    rows = result.all()
    
    # Group by age group
    age_data = defaultdict(lambda: {
        'users': set(),
        'transaction_count': 0,
        'total_amount': 0.0,
        'category_totals': defaultdict(float)
    })
    
    for user_id, birth_date, amount, category_name in rows:
        age = calculate_age(birth_date) if birth_date else None
        age_group = get_age_group(age)
        
        age_data[age_group]['users'].add(user_id)
        age_data[age_group]['transaction_count'] += 1
        age_data[age_group]['total_amount'] += float(amount)
        age_data[age_group]['category_totals'][category_name] += float(amount)
    
    # Calculate statistics
    consumption_data = []
    order = ["18세 미만", "18-24세", "25-34세", "35-44세", "45-54세", "55세 이상", "알 수 없음"]
    
    for age_group in order:
        data = age_data.get(age_group, {'users': set(), 'transaction_count': 0, 'total_amount': 0.0, 'category_totals': {}})
        
        user_count = len(data['users'])
        transaction_count = data['transaction_count']
        total_spending = data['total_amount']
        avg_amount = total_spending / transaction_count if transaction_count > 0 else 0.0
        
        # Get top 3 categories
        sorted_categories = sorted(
            data['category_totals'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        top_categories = [
            CategoryAmount(category=cat, amount=amt)
            for cat, amt in sorted_categories
        ]
        
        consumption_data.append(ConsumptionByAge(
            age_group=age_group,
            user_count=user_count,
            total_spending=round(total_spending, 2),
            avg_transaction_amount=round(avg_amount, 2),
            top_categories=top_categories
        ))
    
    return consumption_data


@router.get("/category-preferences", response_model=List[CategoryPreferenceByAge])
async def get_category_preferences_by_age(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get top 3 spending categories for each age group
    
    **Admin only endpoint**
    """
    await verify_superuser(current_user)
    
    # Import Category model
    from app.db.model.transaction import Category
    
    # Get all transactions with user and category info (explicit joins)
    result = await db.execute(
        select(User.birth_date, Transaction.amount, Category.name.label('category_name'))
        .join(Transaction, User.id == Transaction.user_id)
        .join(Category, Transaction.category_id == Category.id)
    )
    rows = result.all()
    
    # Group by age group
    age_data = defaultdict(lambda: defaultdict(float))
    
    for birth_date, amount, category_name in rows:
        age = calculate_age(birth_date) if birth_date else None
        age_group = get_age_group(age)
        age_data[age_group][category_name] += float(amount)
    
    # Get top 3 for each age group
    preferences = []
    order = ["18세 미만", "18-24세", "25-34세", "35-44세", "45-54세", "55세 이상", "알 수 없음"]
    
    for age_group in order:
        if age_group not in age_data:
            continue
            
        sorted_categories = sorted(
            age_data[age_group].items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        top_1 = sorted_categories[0][0] if len(sorted_categories) > 0 else "-"
        top_2 = sorted_categories[1][0] if len(sorted_categories) > 1 else "-"
        top_3 = sorted_categories[2][0] if len(sorted_categories) > 2 else "-"
        
        preferences.append(CategoryPreferenceByAge(
            age_group=age_group,
            top_category=top_1,
            second_category=top_2,
            third_category=top_3
        ))
    
    return preferences
