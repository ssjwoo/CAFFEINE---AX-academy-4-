"""
이상 거래 탐지 API (Anomaly Detection Router)

현재는 빈 목록을 반환하며, 추후 ML 모델 또는 룰 베이스 로직으로 확장 가능합니다.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Optional, List
from datetime import datetime, timedelta
import logging

from app.db.database import get_db
from app.db.model.transaction import Transaction, Category
from app.db.model.user import User

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/anomalies",
    tags=["anomalies"],
    responses={404: {"description": "Not found"}},
)


# ============================================================
# Pydantic 스키마
# ============================================================

class AnomalyResponse(BaseModel):
    """이상 거래 응답 모델"""
    id: int
    userId: str
    userName: str
    category: str
    amount: float
    date: str
    riskLevel: str  # "위험", "경고", "주의"
    reason: str
    status: str  # "pending", "approved", "rejected"
    
    class Config:
        from_attributes = True


# ============================================================
# 헬퍼 함수
# ============================================================

def determine_risk_level(amount: float, avg_amount: float) -> tuple[str, str]:
    """
    거래 금액을 기반으로 위험 수준을 결정합니다.
    
    Args:
        amount: 현재 거래 금액
        avg_amount: 평균 거래 금액
    
    Returns:
        (위험 등급, 사유) 튜플
    """
    if avg_amount == 0:
        return ("주의", "평균 거래액 정보 없음")
    
    ratio = amount / avg_amount
    
    if ratio >= 5.0:
        return ("위험", f"평균 거래액의 {ratio:.1f}배 초과")
    elif ratio >= 3.0:
        return ("경고", f"평균 거래액의 {ratio:.1f}배 초과")
    elif amount >= 1000000:  # 100만원 이상
        return ("주의", "고액 거래 (100만원 이상)")
    else:
        return ("주의", "일반 거래")


# ============================================================
# API 엔드포인트
# ============================================================

@router.get("", response_model=List[AnomalyResponse])
async def get_anomalies(
    status: Optional[str] = Query(None, description="필터: pending, approved, rejected"),
    risk_level: Optional[str] = Query(None, description="필터: 위험, 경고, 주의"),
    days: int = Query(30, description="조회 기간 (일)"),
    db: AsyncSession = Depends(get_db)
):
    """
    이상 거래 목록을 조회합니다.
    
    현재는 최근 고액 거래(50만원 이상)를 반환하며,
    추후 ML 모델 기반 이상 탐지로 확장 가능합니다.
    
    Args:
        status: 처리 상태 필터 (pending, approved, rejected)
        risk_level: 위험 등급 필터 (위험, 경고, 주의)
        days: 조회 기간 (기본 30일)
        db: 데이터베이스 세션
    
    Returns:
        이상 거래 목록
    """
    try:
        # TODO: 실제 서비스에서는 별도 anomaly_transactions 테이블 사용 권장
        # 현재는 데모를 위해 고액 거래를 이상 거래로 간주
        
        start_date = datetime.now() - timedelta(days=days)
        
        # 사용자별 평균 거래액 계산 (서브쿼리)
        avg_query = select(
            Transaction.user_id,
            func.avg(Transaction.amount).label('avg_amount')
        ).group_by(Transaction.user_id).subquery()
        
        # 고액 거래 조회 (평균의 3배 이상 또는 50만원 이상)
        query = select(
            Transaction.id,
            Transaction.user_id,
            Transaction.amount,
            Transaction.transaction_time,
            Category.name.label('category_name'),
            User.name.label('user_name'),
            avg_query.c.avg_amount
        ).join(
            Category, Transaction.category_id == Category.id, isouter=True
        ).join(
            User, Transaction.user_id == User.id, isouter=True
        ).join(
            avg_query, Transaction.user_id == avg_query.c.user_id, isouter=True
        ).where(
            and_(
                Transaction.transaction_time >= start_date,
                or_(
                    Transaction.amount >= 500000,  # 50만원 이상
                    Transaction.amount >= avg_query.c.avg_amount * 3  # 평균의 3배 이상
                )
            )
        ).order_by(Transaction.transaction_time.desc()).limit(100)
        
        result = await db.execute(query)
        rows = result.fetchall()
        
        anomalies = []
        for row in rows:
            avg_amount = float(row.avg_amount) if row.avg_amount else 0
            risk_level_str, reason = determine_risk_level(row.amount, avg_amount)
            
            # 위험 등급 필터 적용
            if risk_level and risk_level_str != risk_level:
                continue
            
            anomaly = AnomalyResponse(
                id=row.id,
                userId=f"user_{row.user_id}",
                userName=row.user_name or f"사용자 {row.user_id}",
                category=row.category_name or "기타",
                amount=float(row.amount),
                date=row.transaction_time.strftime("%Y-%m-%d %H:%M"),
                riskLevel=risk_level_str,
                reason=reason,
                status="pending"  # 현재는 모두 pending, 추후 별도 테이블 관리
            )
            anomalies.append(anomaly)
        
        # 상태 필터 적용 (현재는 모두 pending이므로 생략 가능)
        if status:
            anomalies = [a for a in anomalies if a.status == status]
        
        logger.info(f"Anomaly detection: Found {len(anomalies)} anomalies in last {days} days")
        return anomalies
        
    except Exception as e:
        logger.error(f"Failed to fetch anomalies: {e}", exc_info=True)
        # 에러 발생 시 빈 목록 반환 (Frontend 호환성 유지)
        return []


@router.post("/{anomaly_id}/approve")
async def approve_anomaly(
    anomaly_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    이상 거래를 정상으로 승인합니다.
    
    TODO: 실제 구현에서는 anomaly_transactions 테이블의 상태를 업데이트해야 합니다.
    """
    logger.info(f"Anomaly {anomaly_id} approved")
    return {"message": "Anomaly approved", "id": anomaly_id}


@router.post("/{anomaly_id}/reject")
async def reject_anomaly(
    anomaly_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    이상 거래를 거부합니다.
    
    TODO: 실제 구현에서는 anomaly_transactions 테이블의 상태를 업데이트하고,
    해당 거래를 차단하는 로직을 추가해야 합니다.
    """
    logger.info(f"Anomaly {anomaly_id} rejected")
    return {"message": "Anomaly rejected", "id": anomaly_id}
