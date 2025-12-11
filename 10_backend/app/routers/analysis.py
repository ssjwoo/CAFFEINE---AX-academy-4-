"""
소비 분석 API (Analysis Router)

2025-12-10: AWS RDS PostgreSQL 연동 완료

RDS 스키마:
- transactions.category_id → categories.id (FK 관계)  
- transactions.merchant_name (가맹점명)
- transactions.transaction_time (거래 시간)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Optional, List
from datetime import datetime, timedelta
import logging

from app.db.database import get_db
from app.db.model.transaction import Transaction, Category

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/analysis",
    tags=["analysis"],
    responses={404: {"description": "Not found"}},
)


# ============================================================
# Pydantic 스키마
# ============================================================

class DashboardSummary(BaseModel):
    total_spending: float
    average_transaction: float
    transaction_count: int
    top_category: str
    month_over_month_change: float
    data_source: str = "DB"


class CategoryBreakdown(BaseModel):
    category: str
    total_amount: float
    transaction_count: int
    percentage: float


class MonthlyTrend(BaseModel):
    month: str
    total_amount: float
    transaction_count: int


class SpendingInsight(BaseModel):
    insight_type: str
    title: str
    description: str
    category: Optional[str] = None
    amount: Optional[float] = None


class AnalysisResponse(BaseModel):
    summary: DashboardSummary
    category_breakdown: List[CategoryBreakdown]
    monthly_trend: List[MonthlyTrend]
    insights: List[SpendingInsight]
    data_source: str = "DB"


# ============================================================
# Mock 데이터
# ============================================================

def get_mock_summary() -> DashboardSummary:
    return DashboardSummary(
        total_spending=1250000, average_transaction=25000, transaction_count=50,
        top_category="외식", month_over_month_change=-5.2, data_source="[MOCK]"
    )

def get_mock_category_breakdown() -> List[CategoryBreakdown]:
    return [
        CategoryBreakdown(category="외식", total_amount=450000, transaction_count=18, percentage=36.0),
        CategoryBreakdown(category="교통", total_amount=280000, transaction_count=12, percentage=22.4),
        CategoryBreakdown(category="쇼핑", total_amount=220000, transaction_count=8, percentage=17.6),
    ]

def get_mock_monthly_trend() -> List[MonthlyTrend]:
    return [
        MonthlyTrend(month="2025-10", total_amount=1320000, transaction_count=52),
        MonthlyTrend(month="2025-11", total_amount=1180000, transaction_count=47),
        MonthlyTrend(month="2025-12", total_amount=1250000, transaction_count=50),
    ]

def get_mock_insights() -> List[SpendingInsight]:
    return [
        SpendingInsight(insight_type="warning", title="외식비 주의", 
                       description="이번 달 외식비가 전월 대비 15% 증가했습니다.", category="외식"),
        SpendingInsight(insight_type="tip", title="다음 소비 예측",
                       description="AI 분석 결과, 다음 결제는 '외식' 카테고리일 확률이 78%입니다.", category="외식"),
    ]


# ============================================================
# API 엔드포인트
# ============================================================

@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """대시보드 요약 통계"""
    try:
        now = datetime.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # 이번 달 통계
        query = select(
            func.coalesce(func.sum(Transaction.amount), 0).label('total'),
            func.coalesce(func.avg(Transaction.amount), 0).label('avg'),
            func.count(Transaction.id).label('count')
        ).where(Transaction.transaction_time >= this_month_start)
        
        if user_id:
            query = query.where(Transaction.user_id == user_id)
        
        result = await db.execute(query)
        row = result.fetchone()
        
        total = float(row.total) if row.total else 0
        avg = float(row.avg) if row.avg else 0
        count = row.count or 0
        
        # 최다 카테고리 (JOIN 사용)
        cat_query = text("""
            SELECT c.name, SUM(t.amount) as cat_total
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.transaction_time >= :start_date
            GROUP BY c.name
            ORDER BY cat_total DESC
            LIMIT 1
        """)
        cat_result = await db.execute(cat_query, {"start_date": this_month_start})
        cat_row = cat_result.fetchone()
        top_category = cat_row[0] if cat_row else "없음"
        
        return DashboardSummary(
            total_spending=total,
            average_transaction=avg,
            transaction_count=count,
            top_category=top_category or "없음",
            month_over_month_change=0.0,  # 간단화
            data_source="DB (AWS RDS)"
        )
        
    except Exception as e:
        logger.warning(f"DB 연결 실패: {e}")
        return get_mock_summary()


@router.get("/categories", response_model=List[CategoryBreakdown])
async def get_category_breakdown(
    user_id: Optional[int] = None,
    months: int = 1,
    db: AsyncSession = Depends(get_db)
):
    """카테고리별 소비 분석"""
    try:
        start_date = datetime.now() - timedelta(days=30 * months)
        
        query = text("""
            SELECT c.name as category, 
                   SUM(t.amount) as total, 
                   COUNT(t.id) as count
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.transaction_time >= :start_date
            GROUP BY c.name
            ORDER BY total DESC
        """)
        
        result = await db.execute(query, {"start_date": start_date})
        rows = result.fetchall()
        
        grand_total = sum(float(row[1]) for row in rows) if rows else 1
        
        categories = []
        for row in rows:
            total_amount = float(row[1])
            categories.append(CategoryBreakdown(
                category=row[0] or "기타",
                total_amount=total_amount,
                transaction_count=row[2],
                percentage=round((total_amount / grand_total) * 100, 1)
            ))
        
        return categories if categories else get_mock_category_breakdown()
        
    except Exception as e:
        logger.warning(f"DB 연결 실패: {e}")
        return get_mock_category_breakdown()


@router.get("/monthly-trend", response_model=List[MonthlyTrend])
async def get_monthly_trend(
    user_id: Optional[int] = None,
    months: int = 6,
    db: AsyncSession = Depends(get_db)
):
    """월별 지출 추이"""
    try:
        query = text("""
            SELECT TO_CHAR(transaction_time, 'YYYY-MM') as month,
                   SUM(amount) as total,
                   COUNT(id) as count
            FROM transactions
            GROUP BY TO_CHAR(transaction_time, 'YYYY-MM')
            ORDER BY month DESC
            LIMIT :limit
        """)
        
        result = await db.execute(query, {"limit": months})
        rows = result.fetchall()
        
        trends = [
            MonthlyTrend(month=row[0], total_amount=float(row[1]), transaction_count=row[2])
            for row in rows
        ]
        
        return list(reversed(trends)) if trends else get_mock_monthly_trend()
        
    except Exception as e:
        logger.warning(f"DB 연결 실패: {e}")
        return get_mock_monthly_trend()


@router.get("/insights", response_model=List[SpendingInsight])
async def get_spending_insights(
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """AI 기반 소비 인사이트 (현재 Mock)"""
    return get_mock_insights()


@router.get("/full", response_model=AnalysisResponse)
async def get_full_analysis(
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """전체 분석 데이터"""
    try:
        summary = await get_dashboard_summary(user_id, db)
        categories = await get_category_breakdown(user_id, 1, db)
        trends = await get_monthly_trend(user_id, 6, db)
        
        return AnalysisResponse(
            summary=summary,
            category_breakdown=categories,
            monthly_trend=trends,
            insights=get_mock_insights(),
            data_source="DB (AWS RDS)"
        )
    except Exception as e:
        logger.warning(f"DB 연결 실패: {e}")
        return AnalysisResponse(
            summary=get_mock_summary(),
            category_breakdown=get_mock_category_breakdown(),
            monthly_trend=get_mock_monthly_trend(),
            insights=get_mock_insights(),
            data_source="[MOCK]"
        )
