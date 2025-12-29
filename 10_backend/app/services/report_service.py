"""
리포트 생성 서비스

주간/월간 소비 데이터를 집계하고 리포트를 생성합니다.
"""

import logging
import re
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.model.transaction import Transaction, Category
from app.db.model.user import User

logger = logging.getLogger(__name__)



from app.services.ai_service import call_gemini_api, generate_report_prompt

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
    
    # 최대 지출 거래 조회
    max_tx_query = select(Transaction).where(
        and_(
            Transaction.transaction_time >= start_of_week,
            Transaction.transaction_time < end_of_week,
            Transaction.status == "completed"
        )
    ).order_by(Transaction.amount.desc()).limit(1)
    max_tx_result = await db.execute(max_tx_query)
    max_transaction = max_tx_result.scalar_one_or_none()
    
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
        func.sum(Transaction.amount).label("amount"),
        func.count(Transaction.id).label("count")
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
    
    report_data = {
        "period_start": start_of_week.strftime("%Y-%m-%d"),
        "period_end": (end_of_week - timedelta(days=1)).strftime("%Y-%m-%d"),
        "total_amount": this_week_total,
        "transaction_count": this_week_data.count or 0,
        "change_rate": round(change_rate, 1),
        "top_categories": [],
        "max_transaction": None
    }
    
    # 카테고리 데이터 처리 (비율 계산)
    if categories and this_week_total > 0:
        max_cat_amount = float(categories[0].amount) if categories else 1
        for cat in categories:
            cat_amount = float(cat.amount)
            # 최대 카테고리 대비 비율 (바 차트용)
            percentage = (cat_amount / max_cat_amount) * 100
            report_data["top_categories"].append({
                "name": cat.name, 
                "amount": cat_amount, 
                "count": int(cat.count),
                "percent": percentage
            })
            
    if max_transaction:
        report_data["max_transaction"] = {
            "merchant_name": max_transaction.merchant_name,
            "amount": float(max_transaction.amount),
            "date": max_transaction.transaction_time.strftime("%m/%d")
        }


    # AI Insight 생성
    try:
        prompt = generate_report_prompt("주간 소비", report_data)
        ai_insight = await call_gemini_api(prompt)
        report_data["ai_insight"] = ai_insight
        logger.info(f"Generated AI Insight (Weekly): {ai_insight}")
    except Exception as e:
        logger.error(f"Failed to generate AI insight: {e}")
        report_data["ai_insight"] = "AI 분석을 불러올 수 없습니다."

    return report_data


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
    
    # 최대 지출 거래 조회
    max_tx_query = select(Transaction).where(
        and_(
            Transaction.transaction_time >= start_of_month,
            Transaction.transaction_time < end_of_month,
            Transaction.status == "completed"
        )
    ).order_by(Transaction.amount.desc()).limit(1)
    max_tx_result = await db.execute(max_tx_query)
    max_transaction = max_tx_result.scalar_one_or_none()
    
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
        func.sum(Transaction.amount).label("amount"),
        func.count(Transaction.id).label("count")
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
    
    report_data = {
        "period_start": start_of_month.strftime("%Y-%m-%d"),
        "period_end": (end_of_month - timedelta(days=1)).strftime("%Y-%m-%d"),
        "total_amount": this_month_total,
        "transaction_count": this_month_data.count or 0,
        "change_rate": round(change_rate, 1),
        "top_categories": [],
        "max_transaction": None
    }
    
    # 카테고리 데이터 처리 (비율 계산)
    if categories and this_month_total > 0:
        max_cat_amount = float(categories[0].amount) if categories else 1
        for cat in categories:
            cat_amount = float(cat.amount)
            percentage = (cat_amount / max_cat_amount) * 100
            report_data["top_categories"].append({
                "name": cat.name, 
                "amount": cat_amount, 
                "count": int(cat.count),
                "percent": percentage
            })
            
    if max_transaction:
        report_data["max_transaction"] = {
            "merchant_name": max_transaction.merchant_name,
            "amount": float(max_transaction.amount),
            "date": max_transaction.transaction_time.strftime("%m/%d")
        }


    # AI Insight 생성
    try:
        prompt = generate_report_prompt("월간 소비", report_data)
        ai_insight = await call_gemini_api(prompt)
        report_data["ai_insight"] = ai_insight
        logger.info(f"Generated AI Insight (Monthly): {ai_insight}")
    except Exception as e:
        logger.error(f"Failed to generate AI insight: {e}")
        report_data["ai_insight"] = "AI 분석을 불러올 수 없습니다."

    return report_data


def format_report_html(report_data: Dict[str, Any]) -> str:
    """
    리포트 데이터를 HTML 형식으로 변환합니다.
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
    
    # 상위 카테고리 HTML 생성 (바 차트 포함)
    categories_html = ""
    for cat in report_data["top_categories"][:3]:
        # 바 색상 (Top 1은 진하게, 나머지는 연하게)
        bar_color = "#667eea" if cat['percent'] > 90 else "#a3bffa"
        
        categories_html += f"""
        <tr>
            <td style="padding: 12px 8px; border-bottom: 1px solid #f1f3f5; width: 40%; vertical-align: middle;">
                <div style="font-size: 14px; font-weight: 500; color: #343a40;">{cat['name']}</div>
                <div style="font-size: 12px; color: #868e96; margin-top: 2px;">{cat['count']}건</div>
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #f1f3f5; width: 60%; vertical-align: middle;">
                <div style="text-align: right; font-size: 14px; font-weight: 600; color: #343a40; margin-bottom: 6px;">
                    ₩{cat['amount']:,.0f}
                </div>
                <div style="background-color: #e9ecef; height: 6px; border-radius: 3px; width: 100%;">
                    <div style="background-color: {bar_color}; height: 6px; border-radius: 3px; width: {cat['percent']}%;"></div>
                </div>
            </td>
        </tr>
        """
        
    # 최대 지출 하이라이트 섹션
    max_spend_html = ""
    if report_data.get("max_transaction"):
        tx = report_data["max_transaction"]
        max_spend_html = f"""
        <div style="background: linear-gradient(to right, #667eea10, #764ba210); padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #667eea30;">
            <div style="font-size: 12px; font-weight: bold; color: #667eea; text-transform: uppercase; letter-spacing: 0.5px;">Highest Spending</div>
            <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: bold; color: #495057; font-size: 15px;">{tx['merchant_name']}</div>
                    <div style="font-size: 12px; color: #868e96;">{tx['date']}</div>
                </div>
                <div style="font-weight: bold; color: #d6336c; font-size: 16px;">
                    ₩{tx['amount']:,.0f}
                </div>
            </div>
        </div>
        """
    
    # NEW: AI Insight Section & Headline extraction
    ai_headline_html = ""
    ai_insight_html = ""
    
    if "ai_insight" in report_data and report_data["ai_insight"]:
        raw_insight = report_data['ai_insight']
        
        # 헤드라인 추출 (Headline: ... 으로 시작하는 경우)
        headline_match = re.search(r'Headline:\s*(.*?)(\n|$)', raw_insight, re.IGNORECASE)
        if headline_match:
            headline_text = headline_match.group(1).strip()
            # 본문에서 헤드라인 라인 제거
            raw_insight = raw_insight.replace(headline_match.group(0), "").strip()
            
            ai_headline_html = f"""
            <div style="background-color: #667eea; color: white; padding: 12px 16px; text-align: center; border-radius: 6px 6px 0 0; font-weight: bold; font-size: 14px; margin-bottom: -4px;">
                💡 {headline_text}
            </div>
            """
        
        # 줄바꿈을 <br>로 변환하고, **굵게**를 <b>굵게</b><br>로 변환
        formatted_insight = raw_insight.replace("\n", "<br>")
        formatted_insight = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b><br>', formatted_insight)
        
        border_radius_style = "0 0 4px 4px" if ai_headline_html else "4px"
        margin_top_style = "0" if ai_headline_html else "24px"
        
        ai_insight_html = f"""
        {ai_headline_html}
        <div style="margin-top: {margin_top_style}; padding: 16px; background-color: #f8f9fa; border-left: 4px solid #6610f2; border-radius: {border_radius_style};">
            <p style="margin: 0 0 12px 0; font-weight: bold; color: #6610f2; font-size: 0.95em;">AI 소비 분석</p>
            <p style="margin: 0; color: #495057; font-size: 0.95em; line-height: 1.6;">{formatted_insight}</p>
        </div>
        """

    # HTML Table Construction (여백 및 스타일 조정)
    html = f"""
    {max_spend_html}
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
            <th style="text-align: left; padding: 6px 8px; border-bottom: 2px solid #dee2e6; color: #495057; font-size: 14px;">항목</th>
            <th style="text-align: right; padding: 6px 8px; border-bottom: 2px solid #dee2e6; color: #495057; font-size: 14px;">값</th>
        </tr>
        <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5; font-size: 14px;">총 소비</td>
            <td style="text-align: right; padding: 6px 8px; border-bottom: 1px solid #f1f3f5; font-weight: bold; font-size: 14px;">{total_amount_formatted}</td>
        </tr>
        <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5; font-size: 14px;">거래 건수</td>
            <td style="text-align: right; padding: 6px 8px; border-bottom: 1px solid #f1f3f5; font-size: 14px;">{transaction_count}</td>
        </tr>
        <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5; font-size: 14px;">전기 대비</td>
            <td style="text-align: right; padding: 6px 8px; border-bottom: 1px solid #f1f3f5; font-size: 14px; color: {change_color};">{change_text}</td>
        </tr>
    </table>

    <h3 style="margin: 24px 0 12px 0; font-size: 15px; color: #495057; border-bottom: 1px solid #dee2e6; padding-bottom: 8px;">상위 지출 카테고리</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
        {categories_html}
    </table>

    {ai_insight_html}
    """
    
    return html
