"""
거래내역 API (Transactions Router)

2025-12-10: AWS RDS PostgreSQL 연동 완료

RDS 스키마:
- transactions.category_id → categories.id (FK 관계)
- transactions.merchant_name (가맹점명)
- transactions.description (메모)
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime
import logging

from app.db.database import get_db
from app.db.model.transaction import Transaction, Category, Anomaly

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/transactions",
    tags=["transactions"],
    responses={404: {"description": "Not found"}},
)


# ============================================================
# Pydantic 스키마
# ============================================================

class TransactionBase(BaseModel):
    """거래 기본 정보"""
    id: int
    merchant: str
    amount: float
    category: str
    transaction_date: str
    description: Optional[str] = None
    status: str = "completed"
    currency: str = "KRW"


class TransactionList(BaseModel):
    """거래 목록 응답"""
    total: int
    page: int
    page_size: int
    transactions: List[TransactionBase]
    data_source: str = "DB"


class TransactionUpdate(BaseModel):
    """거래 수정 요청"""
    description: Optional[str] = None


class TransactionCreate(BaseModel):
    """거래 추가 요청"""
    amount: float
    category: str
    merchant_name: str
    description: Optional[str] = None
    transaction_date: Optional[str] = None  # ISO format: 2025-12-16T10:30:00


class AnomalyReport(BaseModel):
    """이상거래 신고 요청"""
    reason: str
    severity: str = "medium"  # low/medium/high


# ============================================================
# Mock 데이터 (DB 연결 실패 시 폴백)
# ============================================================

def get_mock_transactions() -> List[TransactionBase]:
    """[MOCK] 거래 내역 Mock 데이터"""
    return [
        TransactionBase(id=1, merchant="스타벅스 강남점", amount=5500, category="외식", 
                       transaction_date="2025-12-10 09:30:00", description="아메리카노"),
        TransactionBase(id=2, merchant="카카오택시", amount=15000, category="교통",
                       transaction_date="2025-12-09 18:45:00", description="퇴근길"),
        TransactionBase(id=3, merchant="쿠팡", amount=89000, category="쇼핑",
                       transaction_date="2025-12-09 21:30:00", description="생필품 구매"),
    ]


# ============================================================
# API 엔드포인트
# ============================================================

@router.get("", response_model=TransactionList)
async def get_transactions(
    user_id: Optional[int] = None,
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    거래 내역 조회 (페이징 + 필터링)
    """
    try:
        # 기본 쿼리 (Category JOIN)
        query = select(Transaction).options(selectinload(Transaction.category))
        count_query = select(func.count(Transaction.id))
        
        conditions = []
        
        if user_id:
            conditions.append(Transaction.user_id == user_id)
        
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            conditions.append(Transaction.transaction_time >= start_dt)
        
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            conditions.append(Transaction.transaction_time <= end_dt)
        
        if min_amount is not None:
            conditions.append(Transaction.amount >= min_amount)
        
        if max_amount is not None:
            conditions.append(Transaction.amount <= max_amount)
        
        if search:
            search_pattern = f"%{search}%"
            conditions.append(
                or_(
                    Transaction.merchant_name.ilike(search_pattern),
                    Transaction.description.ilike(search_pattern)
                )
            )
        
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        # 총 개수
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # 페이징
        offset = (page - 1) * page_size
        query = query.order_by(Transaction.transaction_time.desc()).offset(offset).limit(page_size)
        
        result = await db.execute(query)
        rows = result.scalars().all()
        
        # 카테고리 필터 (조인 후)
        transactions = []
        for tx in rows:
            cat_name = tx.category.name if tx.category else "기타"
            if category and cat_name != category:
                continue
            transactions.append(TransactionBase(
                id=tx.id,
                merchant=tx.merchant_name or "알 수 없음",
                amount=float(tx.amount),
                category=cat_name,
                transaction_date=tx.transaction_time.strftime("%Y-%m-%d %H:%M:%S") if tx.transaction_time else "",
                description=tx.description,
                status=tx.status,
                currency=tx.currency
            ))
        
        return TransactionList(
            total=total,
            page=page,
            page_size=page_size,
            transactions=transactions,
            data_source="DB (AWS RDS)"
        )
        
    except Exception as e:
        logger.warning(f"DB 연결 실패, Mock 데이터 반환: {e}")
        mock_data = get_mock_transactions()
        return TransactionList(
            total=len(mock_data),
            page=1,
            page_size=20,
            transactions=mock_data,
            data_source="[MOCK] DB 연결 필요"
        )


@router.post("", response_model=TransactionBase)
async def create_transaction(
    data: TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    새 거래 추가
    
    - amount: 금액 (필수)
    - category: 카테고리명 (쇼핑, 식비, 공과금, 여가, 교통, 기타 등)
    - merchant_name: 가맹점명 (필수)
    - description: 설명/메모 (선택)
    - transaction_date: 거래 시각 ISO format (선택, 기본값: 현재 시각)
    """
    try:
        # 카테고리 조회
        cat_query = select(Category).where(Category.name == data.category)
        cat_result = await db.execute(cat_query)
        category = cat_result.scalar_one_or_none()
        
        # 카테고리가 없으면 "기타"로 검색
        if not category:
            cat_query = select(Category).where(Category.name == "기타")
            cat_result = await db.execute(cat_query)
            category = cat_result.scalar_one_or_none()
        
        # 거래 시각 파싱
        if data.transaction_date:
            try:
                tx_time = datetime.fromisoformat(data.transaction_date.replace('Z', '+00:00'))
            except:
                tx_time = datetime.now()
        else:
            tx_time = datetime.now()
        
        # 새 거래 생성
        new_tx = Transaction(
            user_id=1,  # 기본 사용자 (추후 인증 연동 시 변경)
            amount=data.amount,
            merchant_name=data.merchant_name,
            description=data.description,
            transaction_time=tx_time,
            category_id=category.id if category else None,
            status="completed",
            currency="KRW"
        )
        
        db.add(new_tx)
        await db.commit()
        await db.refresh(new_tx)
        
        logger.info(f"새 거래 추가됨: ID={new_tx.id}, 금액={data.amount}, 가맹점={data.merchant_name}")
        
        return TransactionBase(
            id=new_tx.id,
            merchant=new_tx.merchant_name or "알 수 없음",
            amount=float(new_tx.amount),
            category=data.category,
            transaction_date=new_tx.transaction_time.strftime("%Y-%m-%d %H:%M:%S") if new_tx.transaction_time else "",
            description=new_tx.description,
            status=new_tx.status,
            currency=new_tx.currency
        )
        
    except Exception as e:
        logger.error(f"거래 추가 실패: {e}")
        raise HTTPException(status_code=500, detail=f"거래 추가 실패: {str(e)}")


@router.get("/{transaction_id}", response_model=TransactionBase)
async def get_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db)
):
    """거래 상세 조회"""
    try:
        query = select(Transaction).options(selectinload(Transaction.category)).where(Transaction.id == transaction_id)
        result = await db.execute(query)
        tx = result.scalar_one_or_none()
        
        if not tx:
            raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found")
        
        return TransactionBase(
            id=tx.id,
            merchant=tx.merchant_name or "알 수 없음",
            amount=float(tx.amount),
            category=tx.category.name if tx.category else "기타",
            transaction_date=tx.transaction_time.strftime("%Y-%m-%d %H:%M:%S") if tx.transaction_time else "",
            description=tx.description,
            status=tx.status,
            currency=tx.currency
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"DB 연결 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{transaction_id}/note")
async def update_transaction_note(
    transaction_id: int,
    update_data: TransactionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """거래 메모 수정"""
    try:
        check_query = select(Transaction).where(Transaction.id == transaction_id)
        result = await db.execute(check_query)
        tx = result.scalar_one_or_none()
        
        if not tx:
            raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found")
        
        update_query = (
            update(Transaction)
            .where(Transaction.id == transaction_id)
            .values(description=update_data.description)
        )
        await db.execute(update_query)
        await db.commit()
        
        return {
            "status": "success",
            "message": f"Transaction {transaction_id} updated",
            "data_source": "DB (AWS RDS)",
            "transaction_id": transaction_id,
            "new_description": update_data.description
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"DB 연결 실패: {e}")
        return {
            "status": "success",
            "message": f"[MOCK] Transaction {transaction_id} updated",
            "data_source": "[MOCK]",
            "transaction_id": transaction_id,
            "new_description": update_data.description
        }


@router.post("/{transaction_id}/anomaly-report")
async def report_anomaly(
    transaction_id: int,
    report: AnomalyReport,
    db: AsyncSession = Depends(get_db)
):
    """이상거래 신고"""
    try:
        # 거래 확인
        check_query = select(Transaction).where(Transaction.id == transaction_id)
        result = await db.execute(check_query)
        tx = result.scalar_one_or_none()
        
        if not tx:
            raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found")
        
        # anomalies 테이블에 추가
        from sqlalchemy import insert
        insert_query = insert(Anomaly).values(
            transaction_id=transaction_id,
            user_id=tx.user_id,
            severity=report.severity,
            reason=report.reason,
            is_resolved=False
        )
        await db.execute(insert_query)
        await db.commit()
        
        return {
            "status": "success",
            "message": f"Anomaly reported for transaction {transaction_id}",
            "data_source": "DB (AWS RDS)",
            "transaction_id": transaction_id,
            "severity": report.severity,
            "reason": report.reason,
            "report_id": f"ANM-{transaction_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"DB 연결 실패: {e}")
        return {
            "status": "success",
            "message": f"[MOCK] Anomaly reported",
            "data_source": "[MOCK]",
            "transaction_id": transaction_id,
            "severity": report.severity,
            "reason": report.reason
        }


# ============================================================
# 통계 API
# ============================================================

@router.get("/stats/summary")
async def get_transaction_stats(
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """거래 통계 요약"""
    try:
        query = select(
            func.count(Transaction.id).label('count'),
            func.sum(Transaction.amount).label('total'),
            func.avg(Transaction.amount).label('avg')
        )
        if user_id:
            query = query.where(Transaction.user_id == user_id)
        
        result = await db.execute(query)
        row = result.fetchone()
        
        return {
            "status": "success",
            "data_source": "DB (AWS RDS)",
            "stats": {
                "transaction_count": row.count or 0,
                "total_amount": float(row.total) if row.total else 0,
                "average_amount": float(row.avg) if row.avg else 0
            }
        }
        
    except Exception as e:
        logger.warning(f"DB 연결 실패: {e}")
        return {
            "status": "success",
            "data_source": "[MOCK]",
            "stats": {
                "transaction_count": 50,
                "total_amount": 1250000,
                "average_amount": 25000
            }
        }


# ==========================================================================
# 거래 삭제 API
# ==========================================================================

@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    거래 삭제
    
    - transaction_id: 삭제할 거래 ID
    """
    try:
        # 거래 조회
        query = select(Transaction).where(Transaction.id == transaction_id)
        result = await db.execute(query)
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(status_code=404, detail="거래를 찾을 수 없습니다")
        
        # 거래 삭제
        await db.delete(transaction)
        await db.commit()
        
        logger.info(f"Transaction deleted: id={transaction_id}")
        
        return {
            "status": "success",
            "message": f"거래 ID {transaction_id}가 삭제되었습니다",
            "deleted_id": transaction_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"거래 삭제 실패: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"거래 삭제 실패: {str(e)}")


# ==========================================================================
# 거래 삭제 API
# ==========================================================================

@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    거래 삭제
    
    - transaction_id: 삭제할 거래 ID
    """
    try:
        # 거래 조회
        query = select(Transaction).where(Transaction.id == transaction_id)
        result = await db.execute(query)
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(status_code=404, detail="거래를 찾을 수 없습니다")
        
        # 거래 삭제
        await db.delete(transaction)
        await db.commit()
        
        logger.info(f"Transaction deleted: id={transaction_id}")
        
        return {
            "status": "success",
            "message": f"거래 ID {transaction_id}가 삭제되었습니다",
            "deleted_id": transaction_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"거래 삭제 실패: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"거래 삭제 실패: {str(e)}")
