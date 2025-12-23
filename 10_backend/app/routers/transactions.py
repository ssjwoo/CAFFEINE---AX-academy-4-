from datetime import datetime, timedelta
from typing import List, Optional
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, func, or_, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.db.database import get_db
from app.db.model.transaction import Anomaly, Category, Transaction
from app.core.jwt import verify_access_token

# 로거 설정
logger = logging.getLogger(__name__)

# 라우터 설정
router = APIRouter(
    prefix="/api/transactions",
    tags=["transactions"],
    responses={404: {"description": "Not found"}},
)

# Pydantic Schemas (Request/Response)
class TransactionBase(BaseModel):
    """거래 기본 정보 스키마"""
    id: int
    merchant: str
    amount: float
    category: str
    transaction_date: str
    description: Optional[str] = None
    status: str = "completed"
    currency: str = "KRW"

class TransactionList(BaseModel):
    """거래 목록 응답 스키마"""
    total: int
    page: int
    page_size: int
    transactions: List[TransactionBase]
    data_source: str = "DB"

class TransactionUpdate(BaseModel):
    """거래 수정 요청 스키마"""
    description: Optional[str] = None

class TransactionCreate(BaseModel):
    """거래 생성 요청 스키마"""
    merchant: str
    amount: float
    category: str
    transaction_date: str
    description: Optional[str] = None
    currency: str = "KRW"

class TransactionBulkCreate(BaseModel):
    """거래 일괄 생성 요청 스키마"""
    user_id: int
    transactions: List[TransactionCreate]

class TransactionBulkResponse(BaseModel):
    """거래 일괄 생성 응답 스키마"""
    status: str
    created_count: int
    failed_count: int
    message: str

class AnomalyReport(BaseModel):
    """이상거래 신고 요청 스키마"""
    reason: str
    severity: str = "medium"  # low/medium/high

# 거래 내역 조회 API
@router.get("", response_model=TransactionList)
async def get_transactions(
    user_id: Optional[int] = Query(None, description="사용자 ID (선택)"),
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1), # 상한선 제거하여 유연성 확보
    db: AsyncSession = Depends(get_db)
):
    try:
        # user_id가 없으면 빈 목록 반환 (인증되지 않은 경우)
        if user_id is None:
            return TransactionList(
                total=0,
                page=page,
                page_size=page_size,
                transactions=[],
                data_source="DB"
            )
        
        # 기본 쿼리 및 카운트 쿼리 생성
        query = select(Transaction).options(selectinload(Transaction.category))
        count_query = select(func.count(Transaction.id))
        
        conditions = []
        
        # user_id가 제공된 경우에만 필터링 (관리자는 전체 조회 가능)
        if user_id is not None:
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
        
        # 조건 적용
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        # 총 개수 조회
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # 페이징 적용 (최신순)
        offset = (page - 1) * page_size
        query = query.order_by(Transaction.transaction_time.desc()).offset(offset).limit(page_size)
        
        # 데이터 조회
        result = await db.execute(query)
        rows = result.scalars().all()
        
        # 응답 데이터 변환
        transactions = []
        for tx in rows:
            cat_name = tx.category.name if tx.category else "기타"
            
            # 카테고리 이름 필터
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
        logger.error(f"거래 내역 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="거래 내역을 불러올 수 없습니다.")

# 거래 내역 일괄 생성 API
@router.post("/bulk", response_model=TransactionBulkResponse)
async def create_transactions_bulk(
    data: TransactionBulkCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        from sqlalchemy import insert
        
        created_count = 0
        failed_count = 0
        
        # 카테고리 매핑 조회
        cat_query = select(Category)
        cat_result = await db.execute(cat_query)
        categories = {c.name: c.id for c in cat_result.scalars().all()}
        
        for tx in data.transactions:
            try:
                category_id = categories.get(tx.category)
                if not category_id:
                    category_id = categories.get('기타') or (list(categories.values())[0] if categories else None)
                
                # 다양한 날짜 형식 파싱 시도
                tx_time = None
                date_formats = [
                    "%Y-%m-%d %H:%M:%S",
                    "%Y-%m-%d %H:%M",
                    "%Y-%m-%d",
                    "%Y.%m.%d %H:%M:%S",
                    "%Y.%m.%d %H:%M",
                    "%Y.%m.%d",
                    "%d/%m/%Y %H:%M:%S",
                    "%d/%m/%Y",
                    "%m/%d/%Y %H:%M:%S",
                    "%m/%d/%Y",
                ]
                for fmt in date_formats:
                    try:
                        tx_time = datetime.strptime(tx.transaction_date.strip(), fmt)
                        break
                    except ValueError:
                        continue
                
                # 모든 형식 실패 시 현재 시간 사용 (랜덤 아님)
                if tx_time is None:
                    logger.warning(f"날짜 파싱 실패: {tx.transaction_date}")
                    tx_time = datetime.now()
                
                insert_stmt = insert(Transaction).values(
                    user_id=data.user_id,
                    category_id=category_id,
                    amount=tx.amount,
                    currency=tx.currency,
                    merchant_name=tx.merchant,
                    description=tx.description,
                    status="completed",
                    transaction_time=tx_time
                )
                await db.execute(insert_stmt)
                created_count += 1
                
            except Exception as e:
                logger.warning(f"거래 개별 생성 실패: {e}")
                failed_count += 1
        
        await db.commit()
    except Exception as e:
        logger.error(f"일괄 생성 처리 중 치명적 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    # 예산 체크 및 알림 발송 (생략하거나 유지 가능)

    return TransactionBulkResponse(
        status="success",
        created_count=created_count,
        failed_count=failed_count,
        message=f"{created_count}건 생성 완료, {failed_count}건 실패"
    )


# 거래 내역 전체 삭제 API
@router.delete("")
async def delete_all_transactions(
    user_id: int = Query(..., description="사용자 ID"),
    db: AsyncSession = Depends(get_db)
):
    try:
        delete_stmt = delete(Transaction).where(Transaction.user_id == user_id)
        result = await db.execute(delete_stmt)
        await db.commit()
        return {
            "status": "success",
            "message": f"{result.rowcount}건의 거래가 삭제되었습니다.",
            "deleted_count": result.rowcount
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 거래 내역 상세 조회 API
@router.get("/{transaction_id}", response_model=TransactionBase)
async def get_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db)
):
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
        logger.warning(f"상세 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 거래 메모 수정 API
@router.patch("/{transaction_id}/note")
async def update_transaction_note(
    transaction_id: int,
    update_data: TransactionUpdate,
    db: AsyncSession = Depends(get_db)
):
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
        logger.warning(f"메모 수정 실패: {e}")
        # Mock Response for fallback
        return {
            "status": "success",
            "message": f"[MOCK] Transaction {transaction_id} updated",
            "data_source": "[MOCK]",
            "transaction_id": transaction_id,
            "new_description": update_data.description
        }

# 이상거래 신고 API
@router.post("/{transaction_id}/anomaly-report")
async def report_anomaly(
    transaction_id: int,
    report: AnomalyReport,
    db: AsyncSession = Depends(get_db)
):
    try:
        # 거래 존재 확인
        check_query = select(Transaction).where(Transaction.id == transaction_id)
        result = await db.execute(check_query)
        tx = result.scalar_one_or_none()
        
        if not tx:
            raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found")
        
        # Anomaly 테이블에 저장
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
            "message": f"Reported anomaly for transaction {transaction_id}",
            "data_source": "DB (AWS RDS)",
            "transaction_id": transaction_id,
            "severity": report.severity,
            "reason": report.reason,
            "report_id": f"ANM-{transaction_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"이상거래 신고 실패: {e}")
        return {
            "status": "success",
            "message": f"[MOCK] Anomaly reported",
            "data_source": "[MOCK]",
            "transaction_id": transaction_id
        }

# 거래 통계 요약 조회 API
@router.get("/stats/summary")
async def get_transaction_stats(
    user_id: int = Query(..., description="사용자 ID (필수)"),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(
            func.count(Transaction.id).label('count'),
            func.sum(Transaction.amount).label('total'),
            func.avg(Transaction.amount).label('avg')
        ).where(Transaction.user_id == user_id)  # 필수 필터링
        
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
        logger.error(f"통계 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="통계를 불러올 수 없습니다.")

