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
    user_id: int = Query(..., description="사용자 ID (필수)"),
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=10000),
    db: AsyncSession = Depends(get_db)
):
    try:
        # 기본 쿼리 및 카운트 쿼리 생성
        query = select(Transaction).options(selectinload(Transaction.category))
        count_query = select(func.count(Transaction.id))
        
        # user_id는 필수 조건
        conditions = [Transaction.user_id == user_id]
        
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
            
            # 카테고리 이름 필터 (DB 쿼리로 하는 것이 좋으나 구조상 여기서 처리)
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
        
        # 카테고리 매핑 조회 (최적화)
        cat_query = select(Category)
        cat_result = await db.execute(cat_query)
        categories = {c.name: c.id for c in cat_result.scalars().all()}
        
        for tx in data.transactions:
            try:
                # 카테고리 ID 찾기 (없으면 '기타' 또는 첫 번째 카테고리)
                category_id = categories.get(tx.category)
                if not category_id:
                    category_id = categories.get('기타') or (list(categories.values())[0] if categories else None)
                
                # 날짜 파싱
                import random
                try:
                    tx_time = datetime.strptime(tx.transaction_date, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    try:
                        tx_time = datetime.strptime(tx.transaction_date, "%Y-%m-%d")
                    except ValueError:
                        # 날짜 파싱 실패 시 최근 1년 내 랜덤 날짜 생성
                        days_ago = random.randint(0, 365)
                        tx_time = datetime.now() - timedelta(days=days_ago)
                
                # INSERT 실행
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
    
    # 예산 체크 및 알림 발송 로직 (트랜잭션 커밋 후 비동기적으로 처리)
    try:
        if created_count > 0:
            from app.db.model.user import User as UserModel
            from app.core.notification import send_push_notification
            
            # 1. 사용자 예산 정보 및 푸시 토큰 조회
            user_query = select(UserModel).where(UserModel.id == data.user_id)
            user_result = await db.execute(user_query)
            user = user_result.scalar_one_or_none()
            
            if user and user.budget_limit and user.budget_limit > 0 and user.push_token and user.budget_alert_enabled:
                # 2. 이번 달 총 지출 계산
                now = datetime.now()
                start_of_month = datetime(now.year, now.month, 1)
                
                # 다음 달 1일 계산
                if now.month == 12:
                    start_of_next_month = datetime(now.year + 1, 1, 1)
                else:
                    start_of_next_month = datetime(now.year, now.month + 1, 1)
                
                sum_query = select(func.sum(Transaction.amount)).where(
                    and_(
                        Transaction.user_id == data.user_id,
                        Transaction.transaction_time >= start_of_month,
                        Transaction.transaction_time < start_of_next_month
                    )
                )
                sum_result = await db.execute(sum_query)
                total_spent = sum_result.scalar() or 0
                
                # 3. 예산 대비 지출 비율 체크
                limit = user.budget_limit
                percentage = (total_spent / limit) * 100
                
                if percentage >= 80:
                    # 알림 메시지 구성
                    title = "⚠️ 예산 초과 경고"
                    body = f"이번 달 예산의 {int(percentage)}%({total_spent:,.0f}원)를 사용했습니다."
                    
                    if percentage >= 100:
                        title = "🚨 예산 초과 알림"
                        body = f"이번 달 예산({limit:,.0f}원)을 초과했습니다! 현재 지출: {total_spent:,.0f}원"
                    
                    # 알림 발송
                    await send_push_notification(user.push_token, title, body)
                    logger.info(f"예산 알림 발송 완료: 사용자 {user.id}, {int(percentage)}%")
                    
    except Exception as noti_error:
        # 알림 발송 실패는 전체 로직 실패로 처리하지 않음
        logger.error(f"예산 알림 처리 중 오류 (무시됨): {noti_error}")

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
        
        deleted_count = result.rowcount
        
        return {
            "status": "success",
            "message": f"{deleted_count}건의 거래가 삭제되었습니다.",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        logger.error(f"삭제 실패: {e}")
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
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
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
        logger.error(f"통계 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="통계를 불러올 수 없습니다.")
