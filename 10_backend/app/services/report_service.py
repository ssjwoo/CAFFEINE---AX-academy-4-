"""
리포트 생성 서비스

주간/월간 소비 데이터를 집계하고 리포트를 생성합니다.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.model.transaction import Transaction, Category
from app.db.model.user import User

logger = logging.getLogger(__name__)


async def generate_weekly_report(db: AsyncSession) -> Dict[str, Any]:
    """
    주간 리포트 데이터를 생성합니다.
    
    Args:
        db: 데이터베이스 세션
    
    Returns:
        dict: 리포트 데이터
    """
    # 이번 주 (월요일 ~ 일요일)
    today = datetime.now()
    # 이번 주 월요일
    start_of_week = today - timedelta(days=today.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    # 다음 주 월요일 (이번 주 일요일 23:59:59)
    end_of_week = start_of_week + timedelta(days=7)
    
    # 지난 주
    last_week_start = start_of_week - timedelta(days=7)
    last_week_end = start_of_week
    
    # 이번 주 거래 데이터
    this_week_query = select(
        func.count(Transaction.id).label("count"),
        func.sum(Transaction.amount).label("total_amount")
    ).where(
        and_(
            Transaction.transaction_time >= start_of_week,
            Transaction.transaction_time < end_of_week,
            Transaction.status == "completed"
        )
    )
    this_week_result = await db.execute(this_week_query)
    this_week_data = this_week_result.first()
    
    # 지난 주 거래 데이터
    last_week_query = select(
        func.sum(Transaction.amount).label("total_amount")
    ).where(
        and_(
            Transaction.transaction_time >= last_week_start,
            Transaction.transaction_time < last_week_end,
            Transaction.status == "completed"
        )
    )
    last_week_result = await db.execute(last_week_query)
    last_week_data = last_week_result.first()
    
    # 카테고리별 집계
    category_query = select(
        Category.name,
        func.sum(Transaction.amount).label("amount")
    ).join(
        Transaction, Transaction.category_id == Category.id
    ).where(
        and_(
            Transaction.transaction_time >= start_of_week,
            Transaction.transaction_time < end_of_week,
            Transaction.status == "completed"
        )
    ).group_by(Category.name).order_by(func.sum(Transaction.amount).desc()).limit(5)
    
    category_result = await db.execute(category_query)
    categories = category_result.all()
    
    # 전주 대비 증감율 계산
    this_week_total = float(this_week_data.total_amount or 0)
    last_week_total = float(last_week_data.total_amount or 0)
    
    if last_week_total > 0:
        change_rate = ((this_week_total - last_week_total) / last_week_total) * 100
    else:
        change_rate = 0
    
    return {
        "period_start": start_of_week.strftime("%Y-%m-%d"),
        "period_end": (end_of_week - timedelta(days=1)).strftime("%Y-%m-%d"),
        "total_amount": this_week_total,
        "transaction_count": this_week_data.count or 0,
        "change_rate": round(change_rate, 1),
        "top_categories": [
            {"name": cat.name, "amount": float(cat.amount)}
            for cat in categories
        ]
    }


async def generate_monthly_report(db: AsyncSession) -> Dict[str, Any]:
    """
    월간 리포트 데이터를 생성합니다.
    
    Args:
        db: 데이터베이스 세션
    
    Returns:
        dict: 리포트 데이터
    """
    # 이번 달 (1일 ~ 말일)
    today = datetime.now()
    start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # 다음 달 1일
    if today.month == 12:
        end_of_month = start_of_month.replace(year=today.year + 1, month=1)
    else:
        end_of_month = start_of_month.replace(month=today.month + 1)
    
    # 지난 달
    if start_of_month.month == 1:
        last_month_start = start_of_month.replace(year=today.year - 1, month=12)
    else:
        last_month_start = start_of_month.replace(month=today.month - 1)
    last_month_end = start_of_month
    
    # 이번 달 거래 데이터
    this_month_query = select(
        func.count(Transaction.id).label("count"),
        func.sum(Transaction.amount).label("total_amount")
    ).where(
        and_(
            Transaction.transaction_time >= start_of_month,
            Transaction.transaction_time < end_of_month,
            Transaction.status == "completed"
        )
    )
    this_month_result = await db.execute(this_month_query)
    this_month_data = this_month_result.first()
    
    # 지난 달 거래 데이터
    last_month_query = select(
        func.sum(Transaction.amount).label("total_amount")
    ).where(
        and_(
            Transaction.transaction_time >= last_month_start,
            Transaction.transaction_time < last_month_end,
            Transaction.status == "completed"
        )
    )
    last_month_result = await db.execute(last_month_query)
    last_month_data = last_month_result.first()
    
    # 카테고리별 집계
    category_query = select(
        Category.name,
        func.sum(Transaction.amount).label("amount")
    ).join(
        Transaction, Transaction.category_id == Category.id
    ).where(
        and_(
            Transaction.transaction_time >= start_of_month,
            Transaction.transaction_time < end_of_month,
            Transaction.status == "completed"
        )
    ).group_by(Category.name).order_by(func.sum(Transaction.amount).desc()).limit(5)
    
    category_result = await db.execute(category_query)
    categories = category_result.all()
    
    # 전월 대비 증감율 계산
    this_month_total = float(this_month_data.total_amount or 0)
    last_month_total = float(last_month_data.total_amount or 0)
    
    if last_month_total > 0:
        change_rate = ((this_month_total - last_month_total) / last_month_total) * 100
    else:
        change_rate = 0
    
    return {
        "period_start": start_of_month.strftime("%Y-%m-%d"),
        "period_end": (end_of_month - timedelta(days=1)).strftime("%Y-%m-%d"),
        "total_amount": this_month_total,
        "transaction_count": this_month_data.count or 0,
        "change_rate": round(change_rate, 1),
        "top_categories": [
            {"name": cat.name, "amount": float(cat.amount)}
            for cat in categories
        ]
    }


def format_report_html(report_data: Dict[str, Any]) -> str:
    """
    리포트 데이터를 HTML 형식으로 변환합니다.
    
    Args:
        report_data: 리포트 데이터
    
    Returns:
        str: HTML 형식의 요약 내용
    """
    # 증감율에 따른 색상 및 아이콘
    change_rate = report_data["change_rate"]
    if change_rate > 0:
        change_color = "#dc3545"  # 빨강 (증가)
        change_icon = "↑"
    elif change_rate < 0:
        change_color = "#28a745"  # 초록 (감소)
        change_icon = "↓"
    else:
        change_color = "#6c757d"  # 회색 (동일)
        change_icon = "="
    
    # 총 소비
    total_amount_formatted = f"₩{report_data['total_amount']:,.0f}"
    
    # 거래 건수
    transaction_count = f"{report_data['transaction_count']}건"
    
    # 전기 대비
    change_text = f"{change_icon} {abs(change_rate):.1f}%"
    
    # 상위 카테고리
    categories_html = ""
    for cat in report_data["top_categories"][:3]:
        categories_html += f"""
        <div class="stat">
            <span class="stat-label">{cat['name']}</span>
            <span class="stat-value">₩{cat['amount']:,.0f}</span>
        </div>
        """
    
    html = f"""
    <div class="stat">
        <span class="stat-label">총 소비</span>
        <span class="stat-value">{total_amount_formatted}</span>
    </div>
    <div class="stat">
        <span class="stat-label">거래 건수</span>
        <span class="stat-value">{transaction_count}</span>
    </div>
    <div class="stat">
        <span class="stat-label">전기 대비</span>
        <span class="stat-value" style="color: {change_color};">{change_text}</span>
    </div>
    {categories_html}
    """
    
    return html
