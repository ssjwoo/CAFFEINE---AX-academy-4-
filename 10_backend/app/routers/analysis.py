"""
소비 분석 API (Analysis Router)

2025-12-10: AWS RDS PostgreSQL 연동 완료
2025-12-21: 서비스 레이어 분리 리팩토링

라우터는 HTTP 요청/응답만 처리
비즈니스 로직은 services/analysis_service.py에서 담당
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.db.database import get_db
from app.services.analysis import (
    # 스키마
    DashboardSummary,
    CategoryBreakdown,
    MonthlyTrend,
    SpendingInsight,
    AnalysisResponse,
    # 사용자용 서비스 함수
    get_user_summary,
    get_user_categories,
    get_user_trends,
    get_user_full_analysis,
    get_mock_insights,
    # 관리자용 서비스 함수
    get_admin_full_analysis,
)


router = APIRouter(
    prefix="/analysis",
    tags=["analysis"],
    responses={404: {"description": "Not found"}},
)


# ============================================================
# 사용자용 API 엔드포인트
# ============================================================

@router.get("/summary", response_model=DashboardSummary)
async def api_get_dashboard_summary(
    user_id: int = Query(..., description="사용자 ID (필수)"),
    year: Optional[int] = Query(None, description="연도"),
    month: Optional[int] = Query(None, description="월"),
    db: AsyncSession = Depends(get_db)
):
    """대시보드 요약 통계"""
    return await get_user_summary(db, user_id, year, month)


@router.get("/categories", response_model=List[CategoryBreakdown])
async def api_get_category_breakdown(
    user_id: int = Query(..., description="사용자 ID (필수)"),
    months: int = Query(1, description="분석 개월 수"),
    year: Optional[int] = Query(None, description="연도"),
    month: Optional[int] = Query(None, description="월"),
    db: AsyncSession = Depends(get_db)
):
    """카테고리별 소비 분석"""
    return await get_user_categories(db, user_id, months, year, month)


@router.get("/monthly-trend", response_model=List[MonthlyTrend])
async def api_get_monthly_trend(
    user_id: int = Query(..., description="사용자 ID (필수)"),
    months: int = Query(6, description="조회 개월 수"),
    db: AsyncSession = Depends(get_db)
):
    """월별 지출 추이"""
    return await get_user_trends(db, user_id, months)


@router.get("/insights", response_model=List[SpendingInsight])
async def api_get_spending_insights(
    user_id: int = Query(..., description="사용자 ID (필수)"),
    db: AsyncSession = Depends(get_db)
):
    """AI 기반 소비 인사이트 (현재 Mock)"""
    return get_mock_insights()


@router.get("/full", response_model=AnalysisResponse)
async def api_get_full_analysis(
    user_id: int = Query(..., description="사용자 ID (필수)"),
    db: AsyncSession = Depends(get_db)
):
    """전체 분석 데이터 (사용자용)"""
    return await get_user_full_analysis(db, user_id)


# ============================================================
# 관리자용 API 엔드포인트
# ============================================================

@router.get("/admin/full", response_model=AnalysisResponse)
async def api_get_admin_full_analysis(
    year: Optional[int] = Query(None, description="분석 연도"),
    month: Optional[int] = Query(None, description="분석 월"),
    db: AsyncSession = Depends(get_db)
):
    """
    관리자용 전체 분석 데이터 (관리자 제외 모든 사용자 합계)
    user_id 없이 호출 가능
    """
    return await get_admin_full_analysis(db, year, month)
