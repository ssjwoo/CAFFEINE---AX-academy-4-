"""
Admin Transactions Router
관리자 전용 거래 조회 API 라우터

HTTP 요청/응답만 처리
비즈니스 로직은 services/admin_transactions.py에서 담당
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.model.user import User
from app.routers.user import get_current_user
from app.services.admin_transactions import (
    AdminTransactionList,
    AdminTransactionBase,
    get_all_transactions,
    get_transaction_detail,
)


router = APIRouter(
    prefix="/admin/transactions",
    tags=["Admin - Transactions"],
    responses={404: {"description": "Not found"}},
)


# Helper to check superuser
async def verify_superuser(current_user: User) -> User:
    """Verify that current user is a superuser"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


@router.get("", response_model=AdminTransactionList)
async def api_get_all_transactions(
    category: Optional[str] = Query(None, description="카테고리 필터"),
    start_date: Optional[str] = Query(None, description="시작 날짜 (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="종료 날짜 (YYYY-MM-DD)"),
    min_amount: Optional[float] = Query(None, description="최소 금액"),
    max_amount: Optional[float] = Query(None, description="최대 금액"),
    search: Optional[str] = Query(None, description="가맹점명/설명 검색"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, description="페이지 크기"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    관리자 전용: 전체 사용자 거래 내역 조회 (superuser 제외)
    
    **Admin only endpoint**
    
    - 모든 일반 사용자의 거래 내역을 조회합니다
    - 필터링, 검색, 페이징 지원
    """
    await verify_superuser(current_user)
    
    return await get_all_transactions(
        db=db,
        category=category,
        start_date=start_date,
        end_date=end_date,
        min_amount=min_amount,
        max_amount=max_amount,
        search=search,
        page=page,
        page_size=page_size
    )


@router.get("/{transaction_id}", response_model=AdminTransactionBase)
async def api_get_transaction_detail(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    관리자 전용: 특정 거래 상세 조회
    
    **Admin only endpoint**
    """
    await verify_superuser(current_user)
    
    transaction = await get_transaction_detail(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found"
        )
    
    return transaction
