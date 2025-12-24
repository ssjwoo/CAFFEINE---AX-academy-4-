"""
Admin Transactions Service Layer
관리자 전용 거래 조회 비즈니스 로직

라우터는 HTTP 요청/응답만 처리
이 서비스에서 DB 쿼리 및 데이터 변환 담당
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import Optional, List
import logging

from app.db.model.transaction import Transaction, Category
from pydantic import BaseModel

logger = logging.getLogger(__name__)


# ============================================================
# 스키마 (Pydantic Models)
# ============================================================

class AdminTransactionBase(BaseModel):
    """거래 기본 정보 스키마"""
    id: int
    user_id: int
    merchant: str
    amount: float
    category: str
    transaction_date: str
    description: Optional[str] = None
    status: str = "completed"
    currency: str = "KRW"


class AdminTransactionList(BaseModel):
    """관리자용 거래 목록 응답 스키마"""
    total: int
    page: int
    page_size: int
    transactions: List[AdminTransactionBase]
    data_source: str = "DB (Admin)"


# ============================================================
# 서비스 함수들 (비즈니스 로직)
# ============================================================

async def get_all_transactions(
    db: AsyncSession,
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> AdminTransactionList:
    """
    관리자용 전체 거래 조회 (superuser 제외한 모든 사용자 거래)
    """
    try:
        # 기본 쿼리 - superuser가 아닌 사용자의 거래만 조회
        base_query = text("""
            SELECT t.id, t.user_id, t.merchant_name, t.amount, c.name as category_name,
                   t.transaction_time, t.description, t.status, t.currency
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE u.is_superuser = false
        """)
        
        count_query = text("""
            SELECT COUNT(t.id)
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE u.is_superuser = false
        """)
        
        # 동적 조건 구축
        conditions = []
        params = {}
        
        if start_date:
            conditions.append("t.transaction_time >= :start_date")
            params["start_date"] = datetime.strptime(start_date, "%Y-%m-%d")
        
        if end_date:
            conditions.append("t.transaction_time <= :end_date")
            params["end_date"] = datetime.strptime(end_date, "%Y-%m-%d")
        
        if min_amount is not None:
            conditions.append("t.amount >= :min_amount")
            params["min_amount"] = min_amount
        
        if max_amount is not None:
            conditions.append("t.amount <= :max_amount")
            params["max_amount"] = max_amount
        
        if search:
            conditions.append("(t.merchant_name ILIKE :search OR t.description ILIKE :search)")
            params["search"] = f"%{search}%"
        
        if category:
            conditions.append("c.name = :category")
            params["category"] = category
        
        # 조건 추가
        where_clause = ""
        if conditions:
            where_clause = " AND " + " AND ".join(conditions)
        
        # 총 개수 조회
        count_sql = f"""
            SELECT COUNT(t.id)
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE u.is_superuser = false {where_clause}
        """
        count_result = await db.execute(text(count_sql), params)
        total = count_result.scalar() or 0
        
        # 데이터 조회 (페이징)
        offset = (page - 1) * page_size
        data_sql = f"""
            SELECT t.id, t.user_id, t.merchant_name, t.amount, c.name as category_name,
                   t.transaction_time, t.description, t.status, t.currency
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE u.is_superuser = false {where_clause}
            ORDER BY t.transaction_time DESC
            OFFSET :offset LIMIT :limit
        """
        params["offset"] = offset
        params["limit"] = page_size
        
        result = await db.execute(text(data_sql), params)
        rows = result.fetchall()
        
        # 응답 변환
        transactions = [
            AdminTransactionBase(
                id=row[0],
                user_id=row[1],
                merchant=row[2] or "알 수 없음",
                amount=float(row[3]),
                category=row[4] or "기타",
                transaction_date=row[5].strftime("%Y-%m-%d %H:%M:%S") if row[5] else "",
                description=row[6],
                status=row[7] or "completed",
                currency=row[8] or "KRW"
            )
            for row in rows
        ]
        
        return AdminTransactionList(
            total=total,
            page=page,
            page_size=page_size,
            transactions=transactions,
            data_source="DB (Admin - All Users)"
        )
        
    except Exception as e:
        logger.error(f"관리자 거래 조회 실패: {e}")
        return AdminTransactionList(
            total=0,
            page=page,
            page_size=page_size,
            transactions=[],
            data_source="Error"
        )


async def get_transaction_detail(
    db: AsyncSession,
    transaction_id: int
) -> Optional[AdminTransactionBase]:
    """관리자용 거래 상세 조회"""
    try:
        query = text("""
            SELECT t.id, t.user_id, t.merchant_name, t.amount, c.name as category_name,
                   t.transaction_time, t.description, t.status, t.currency
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = :transaction_id AND u.is_superuser = false
        """)
        
        result = await db.execute(query, {"transaction_id": transaction_id})
        row = result.fetchone()
        
        if not row:
            return None
        
        return AdminTransactionBase(
            id=row[0],
            user_id=row[1],
            merchant=row[2] or "알 수 없음",
            amount=float(row[3]),
            category=row[4] or "기타",
            transaction_date=row[5].strftime("%Y-%m-%d %H:%M:%S") if row[5] else "",
            description=row[6],
            status=row[7] or "completed",
            currency=row[8] or "KRW"
        )
        
    except Exception as e:
        logger.error(f"거래 상세 조회 실패: {e}")
        return None
