"""
Analysis Service Layer
비즈니스 로직과 DB 쿼리 분리

분석 관련 모든 데이터 처리 로직을 담당
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timedelta
from typing import Optional, List
import logging

from app.db.model.transaction import Transaction, Category

logger = logging.getLogger(__name__)


# ============================================================
# 스키마 (Pydantic Models)
# ============================================================

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_spending: float
    average_transaction: float
    transaction_count: int
    top_category: str
    month_over_month_change: float
    transaction_count_mom_change: float
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
# Mock 데이터 (DB 연결 실패 시 fallback)
# ============================================================

def get_mock_summary() -> DashboardSummary:
    return DashboardSummary(
        total_spending=1250000, average_transaction=25000, transaction_count=50,
        top_category="외식", month_over_month_change=-5.2,
        transaction_count_mom_change=-3.8, data_source="[MOCK]"
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
# 서비스 함수들 (비즈니스 로직)
# ============================================================

async def get_user_summary(
    db: AsyncSession,
    user_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> DashboardSummary:
    """특정 사용자의 대시보드 요약 통계"""
    try:
        now = datetime.now()
        
        if year and month:
            this_month_start = datetime(year, month, 1, 0, 0, 0)
        else:
            this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # 이번 달 통계
        query = select(
            func.coalesce(func.sum(Transaction.amount), 0).label('total'),
            func.coalesce(func.avg(Transaction.amount), 0).label('avg'),
            func.count(Transaction.id).label('count')
        ).where(
            Transaction.transaction_time >= this_month_start,
            Transaction.user_id == user_id
        )
        
        result = await db.execute(query)
        row = result.fetchone()
        
        total = float(row.total) if row.total else 0
        avg = float(row.avg) if row.avg else 0
        count = row.count or 0
        
        # 최다 카테고리
        cat_query = text("""
            SELECT c.name, SUM(t.amount) as cat_total
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.transaction_time >= :start_date AND t.user_id = :user_id
            GROUP BY c.name
            ORDER BY cat_total DESC
            LIMIT 1
        """)
        cat_result = await db.execute(cat_query, {"start_date": this_month_start, "user_id": user_id})
        cat_row = cat_result.fetchone()
        top_category = cat_row[0] if cat_row else "없음"
        
        # 전월 대비 증감률
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = this_month_start - timedelta(seconds=1)
        
        prev_query = select(
            func.coalesce(func.sum(Transaction.amount), 0).label('prev_total'),
            func.count(Transaction.id).label('prev_count')
        ).where(
            Transaction.transaction_time >= last_month_start,
            Transaction.transaction_time <= last_month_end,
            Transaction.user_id == user_id
        )
        
        prev_result = await db.execute(prev_query)
        prev_row = prev_result.fetchone()
        prev_total = float(prev_row.prev_total) if prev_row.prev_total else 0
        prev_count = prev_row.prev_count if prev_row.prev_count else 0
        
        mom_change = ((total - prev_total) / prev_total * 100) if prev_total > 0 else (0.0 if total == 0 else 100.0)
        count_mom_change = ((count - prev_count) / prev_count * 100) if prev_count > 0 else (0.0 if count == 0 else 100.0)
        
        return DashboardSummary(
            total_spending=total,
            average_transaction=avg,
            transaction_count=count,
            top_category=top_category or "없음",
            month_over_month_change=round(mom_change, 1),
            transaction_count_mom_change=round(count_mom_change, 1),
            data_source="DB (AWS RDS)"
        )
        
    except Exception as e:
        logger.warning(f"get_user_summary 실패: {e}")
        return get_mock_summary()


async def get_user_categories(
    db: AsyncSession,
    user_id: int,
    months: int = 1,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> List[CategoryBreakdown]:
    """특정 사용자의 카테고리별 소비 분석"""
    try:
        if year and month:
            end_date = datetime(year, month, 1, 0, 0, 0)
            if end_date.month == 12:
                end_date = end_date.replace(year=end_date.year + 1, month=1)
            else:
                end_date = end_date.replace(month=end_date.month + 1)
        else:
            end_date = datetime.now()
        
        start_date = end_date - timedelta(days=30 * months)
        
        query = text("""
            SELECT c.name as category, SUM(t.amount) as total, COUNT(t.id) as count
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.transaction_time >= :start_date AND t.user_id = :user_id
            GROUP BY c.name
            ORDER BY total DESC
        """)
        
        result = await db.execute(query, {"start_date": start_date, "user_id": user_id})
        rows = result.fetchall()
        
        grand_total = sum(float(row[1]) for row in rows) if rows else 1
        
        categories = [
            CategoryBreakdown(
                category=row[0] or "기타",
                total_amount=float(row[1]),
                transaction_count=row[2],
                percentage=round((float(row[1]) / grand_total) * 100, 1)
            )
            for row in rows
        ]
        
        return categories if categories else get_mock_category_breakdown()
        
    except Exception as e:
        logger.warning(f"get_user_categories 실패: {e}")
        return get_mock_category_breakdown()


async def get_user_trends(
    db: AsyncSession,
    user_id: int,
    months: int = 6
) -> List[MonthlyTrend]:
    """특정 사용자의 월별 지출 추이"""
    try:
        query = text("""
            SELECT TO_CHAR(transaction_time, 'YYYY-MM') as month,
                   SUM(amount) as total,
                   COUNT(id) as count
            FROM transactions
            WHERE user_id = :user_id
            GROUP BY TO_CHAR(transaction_time, 'YYYY-MM')
            ORDER BY month DESC
            LIMIT :limit
        """)
        
        result = await db.execute(query, {"limit": months, "user_id": user_id})
        rows = result.fetchall()
        
        trends = [
            MonthlyTrend(month=row[0], total_amount=float(row[1]), transaction_count=row[2])
            for row in rows
        ]
        
        return list(reversed(trends)) if trends else get_mock_monthly_trend()
        
    except Exception as e:
        logger.warning(f"get_user_trends 실패: {e}")
        return get_mock_monthly_trend()


async def get_user_full_analysis(
    db: AsyncSession,
    user_id: int
) -> AnalysisResponse:
    """특정 사용자의 전체 분석 데이터"""
    try:
        summary = await get_user_summary(db, user_id)
        categories = await get_user_categories(db, user_id)
        trends = await get_user_trends(db, user_id)
        
        return AnalysisResponse(
            summary=summary,
            category_breakdown=categories,
            monthly_trend=trends,
            insights=get_mock_insights(),
            data_source="DB (AWS RDS)"
        )
    except Exception as e:
        logger.warning(f"get_user_full_analysis 실패: {e}")
        return AnalysisResponse(
            summary=get_mock_summary(),
            category_breakdown=get_mock_category_breakdown(),
            monthly_trend=get_mock_monthly_trend(),
            insights=get_mock_insights(),
            data_source="[MOCK]"
        )


# ============================================================
# 관리자용 전체 사용자 분석
# ============================================================

async def get_admin_summary(
    db: AsyncSession,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> DashboardSummary:
    """관리자용: 전체 사용자(관리자 제외) 요약 통계"""
    try:
        now = datetime.now()
        
        if year and month:
            this_month_start = datetime(year, month, 1, 0, 0, 0)
        else:
            this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        summary_query = text("""
            SELECT 
                COALESCE(SUM(t.amount), 0) as total,
                COALESCE(AVG(t.amount), 0) as avg,
                COUNT(t.id) as count
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE u.is_superuser = false
              AND t.transaction_time >= :start_date
        """)
        result = await db.execute(summary_query, {"start_date": this_month_start})
        row = result.fetchone()
        
        total = float(row[0]) if row[0] else 0
        avg = float(row[1]) if row[1] else 0
        count = row[2] or 0
        
        # 최다 카테고리
        cat_query = text("""
            SELECT c.name, SUM(t.amount) as cat_total
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE u.is_superuser = false
              AND t.transaction_time >= :start_date
            GROUP BY c.name
            ORDER BY cat_total DESC
            LIMIT 1
        """)
        cat_result = await db.execute(cat_query, {"start_date": this_month_start})
        cat_row = cat_result.fetchone()
        top_category = cat_row[0] if cat_row else "없음"
        
        # 전월 대비 증감률
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = this_month_start - timedelta(seconds=1)
        
        prev_query = text("""
            SELECT COALESCE(SUM(t.amount), 0) as prev_total, COUNT(t.id) as prev_count
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE u.is_superuser = false
              AND t.transaction_time >= :start_date
              AND t.transaction_time <= :end_date
        """)
        prev_result = await db.execute(prev_query, {"start_date": last_month_start, "end_date": last_month_end})
        prev_row = prev_result.fetchone()
        prev_total = float(prev_row[0]) if prev_row[0] else 0
        prev_count = prev_row[1] if prev_row[1] else 0
        
        mom_change = ((total - prev_total) / prev_total * 100) if prev_total > 0 else (0.0 if total == 0 else 100.0)
        count_mom_change = ((count - prev_count) / prev_count * 100) if prev_count > 0 else (0.0 if count == 0 else 100.0)
        
        return DashboardSummary(
            total_spending=total,
            average_transaction=avg,
            transaction_count=count,
            top_category=top_category or "없음",
            month_over_month_change=round(mom_change, 1),
            transaction_count_mom_change=round(count_mom_change, 1),
            data_source="DB (Admin - All Users)"
        )
        
    except Exception as e:
        logger.warning(f"get_admin_summary 실패: {e}")
        return get_mock_summary()


async def get_admin_categories(
    db: AsyncSession,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> List[CategoryBreakdown]:
    """관리자용: 전체 사용자(관리자 제외) 카테고리 분석"""
    try:
        now = datetime.now()
        
        if year and month:
            this_month_start = datetime(year, month, 1, 0, 0, 0)
        else:
            this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        query = text("""
            SELECT c.name as category, SUM(t.amount) as total, COUNT(t.id) as count
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE u.is_superuser = false
              AND t.transaction_time >= :start_date
            GROUP BY c.name
            ORDER BY total DESC
        """)
        result = await db.execute(query, {"start_date": this_month_start})
        rows = result.fetchall()
        
        grand_total = sum(float(r[1]) for r in rows) if rows else 1
        
        return [
            CategoryBreakdown(
                category=r[0] or "기타",
                total_amount=float(r[1]),
                transaction_count=r[2],
                percentage=round((float(r[1]) / grand_total) * 100, 1)
            )
            for r in rows
        ] or get_mock_category_breakdown()
        
    except Exception as e:
        logger.warning(f"get_admin_categories 실패: {e}")
        return get_mock_category_breakdown()


async def get_admin_trends(db: AsyncSession, months: int = 6) -> List[MonthlyTrend]:
    """관리자용: 전체 사용자(관리자 제외) 월별 추이"""
    try:
        query = text("""
            SELECT TO_CHAR(t.transaction_time, 'YYYY-MM') as month,
                   SUM(t.amount) as total,
                   COUNT(t.id) as count
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE u.is_superuser = false
            GROUP BY TO_CHAR(t.transaction_time, 'YYYY-MM')
            ORDER BY month DESC
            LIMIT :limit
        """)
        result = await db.execute(query, {"limit": months})
        rows = result.fetchall()
        
        return [
            MonthlyTrend(month=r[0], total_amount=float(r[1]), transaction_count=r[2])
            for r in reversed(rows)
        ] or get_mock_monthly_trend()
        
    except Exception as e:
        logger.warning(f"get_admin_trends 실패: {e}")
        return get_mock_monthly_trend()


async def get_admin_full_analysis(
    db: AsyncSession,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> AnalysisResponse:
    """관리자용 전체 분석 데이터"""
    try:
        summary = await get_admin_summary(db, year, month)
        categories = await get_admin_categories(db, year, month)
        trends = await get_admin_trends(db)
        
        return AnalysisResponse(
            summary=summary,
            category_breakdown=categories,
            monthly_trend=trends,
            insights=get_mock_insights(),
            data_source="DB (Admin - All Users)"
        )
    except Exception as e:
        logger.warning(f"get_admin_full_analysis 실패: {e}")
        return AnalysisResponse(
            summary=get_mock_summary(),
            category_breakdown=get_mock_category_breakdown(),
            monthly_trend=get_mock_monthly_trend(),
            insights=get_mock_insights(),
            data_source="[MOCK]"
        )
