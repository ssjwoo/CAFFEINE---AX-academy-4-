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
import os
import io
import matplotlib.pyplot as plt
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

# 한글 폰트 설정 (윈도우 기본 맑은 고딕)
FONT_PATH = "C:\\Windows\\Fonts\\malgun.ttf"
if os.path.exists(FONT_PATH):
    pdfmetrics.registerFont(TTFont('MalgunGothic', FONT_PATH))
    pdfmetrics.registerFont(TTFont('MalgunGothicBold', "C:\\Windows\\Fonts\\malgunbd.ttf"))
else:
    # 폰트가 없을 경우 기본 폰트 사용 (한글 깨짐 주의)
    logger.warning("Korean font not found. PDF might have encoding issues.")

def generate_category_pie_chart(top_categories: list) -> io.BytesIO:
    """
    카테고리 지출 비중을 도넛형 파이 차트로 생성합니다.
    """
    if not top_categories:
        return None
        
    labels = [c['name'] for c in top_categories]
    sizes = [c['amount'] for c in top_categories]
    
    # 세련된 인디고/슬레이트 컬러 팔레트
    colors_palette = ['#4338ca', '#6366f1', '#818cf8', '#a5b4fc', '#e2e8f0']
    
    fig, ax = plt.subplots(figsize=(6, 4))
    
    # 폰트 설정 (맑은 고딕)
    plt.rcParams['font.family'] = 'Malgun Gothic'
    
    # 파이 차트 생성 (도넛 형태)
    wedges, texts, autotexts = ax.pie(
        sizes, 
        labels=labels, 
        autopct='%1.1f%%', 
        startangle=140, 
        colors=colors_palette,
        pctdistance=0.85,
        explode=[0.05] + [0] * (len(top_categories) - 1), # 가장 큰 조각 살짝 강조
        textprops={'fontsize': 10, 'color': '#1e293b'}
    )
    
    # 도넛 센터 구멍
    centre_circle = plt.Circle((0,0), 0.70, fc='white')
    fig = plt.gcf()
    fig.gca().add_artist(centre_circle)
    
    # 텍스트 스타일링
    for text in texts:
        text.set_color('#475569')
        text.set_weight('bold')
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_weight('bold')
        
    ax.axis('equal')  # 원형 유지
    plt.tight_layout()
    
    # 메모리 버퍼에 저장
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', dpi=150, transparent=True)
    img_buffer.seek(0)
    plt.close()
    
    return img_buffer

def generate_report_pdf(report_type: str, report_data: Dict[str, Any], output_path: str):
    """
    리포트 데이터를 바탕으로 전문적인 PDF 파일을 생성합니다.
    """
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    
    # 맞춤형 스타일 정의
    korean_style = ParagraphStyle(
        'KoreanStyle',
        parent=styles['Normal'],
        fontName='MalgunGothic',
        fontSize=10,
        leading=14,
        wordWrap='CJK'
    )
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Title'],
        fontName='MalgunGothicBold',
        fontSize=24,
        leading=28,
        spaceAfter=20,
        textColor=colors.HexColor("#1a202c")
    )
    
    sub_title_style = ParagraphStyle(
        'SubTitleStyle',
        parent=styles['Heading2'],
        fontName='MalgunGothicBold',
        fontSize=16,
        leading=20,
        spaceBefore=15,
        spaceAfter=10,
        textColor=colors.HexColor("#667eea")
    )

    # 가운데 정렬 스타일 추가
    korean_center_style = ParagraphStyle(
        'KoreanCenterStyle',
        parent=korean_style,
        alignment=1 # 1: CENTER
    )
    
    elements = []
    
    # AI 인사이트에서 헤드라인 추출
    ai_raw_content = report_data.get('ai_insight', "AI 분석 결과가 없습니다.")
    
    # [긴급/최종] 절대 사용 금지어 필터링 (사용자 피드백 반영)
    forbidden_map = {
        "결론 및 제언": "종합 성장 전략",
        "제언": "전략",
        "액션 아이템": "핵심 과제",
        "액션아이템": "핵심 과제",
        "비즈니스 액션": "실행 전략",
        "제고": "강화",
        "도모": "추진"
    }
    for old, new in forbidden_map.items():
        ai_raw_content = ai_raw_content.replace(old, new)
    
    headline_text = ""
    if "# [HEADLINE]" in ai_raw_content:
        parts = ai_raw_content.split("# [HEADLINE]")
        if len(parts) > 1:
            headline_text = parts[1].split("\n")[0].strip()
            ai_raw_content = parts[0] + "\n".join(parts[1].split("\n")[1:])
    
    # 1. 제목 및 기간
    elements.append(Paragraph(f"Caffeine {report_type} 분석 리포트", title_style))
    
    # AI 헤드라인 강조 배치
    if headline_text:
        headline_style = ParagraphStyle(
            'HeadlineStyle',
            parent=korean_style,
            fontSize=16,
            fontName='MalgunGothicBold',
            textColor=colors.HexColor("#4338ca"),
            alignment=1, # Center
            spaceAfter=15,
            borderPadding=10,
            backgroundColor=colors.HexColor("#eef2ff"),
            borderRadius=8
        )
        elements.append(Paragraph(f'"{headline_text}"', headline_style))
    else:
        elements.append(Paragraph(f"분석 기간: {report_data['period_start']} ~ {report_data['period_end']}", korean_style))
    
    # 상단 구분선
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#667eea"), spaceBefore=5, spaceAfter=15))
    
    # 2. 지출 하이라이트 (신규 추가: 상단 카드)
    if report_data.get('max_transaction'):
        max_tx = report_data['max_transaction']
        elements.append(Paragraph("✨ 이번 기간 지출 하이라이트", sub_title_style))
        
        highlight_data = [[
            Paragraph(f"<font size='12' color='#4338ca'><b>최대 지출 내역</b></font><br/><br/>"
                      f"<font size='20' color='#1a202c'><b>{max_tx['merchant_name']}</b></font><br/>"
                      f"<font size='11' color='#64748b'>{max_tx['date']} | {max_tx['category']}</font>", korean_style),
            Paragraph(f"<font size='10' color='#64748b'>결제 금액</font><br/><br/>"
                      f"<font size='22' color='#e53e3e'><b>{int(max_tx['amount']):,}원</b></font>", ParagraphStyle('RightAlign', parent=korean_style, alignment=2))
        ]]
        
        highlight_table = Table(highlight_data, colWidths=[300, 160])
        highlight_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('ROUNDEDCORNERS', [10, 10, 10, 10]),
            ('LEFTPADDING', (0,0), (-1,-1), 20),
            ('RIGHTPADDING', (0,0), (-1,-1), 20),
            ('TOPPADDING', (0,0), (-1,-1), 15),
            ('BOTTOMPADDING', (0,0), (-1,-1), 15),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(highlight_table)
        elements.append(Spacer(1, 25))

    # 3. 핵심 지표 요약 (표 형식)
    elements.append(Paragraph("📊 핵심 지표 요약", sub_title_style))
    
    change_rate = report_data.get('change_rate', 0)
    pos_color = colors.HexColor("#e53e3e")
    neg_color = colors.HexColor("#38a169")
    neutral_color = colors.HexColor("#475569")
    
    hex_color_str = "#e53e3e" if change_rate > 0 else "#38a169" if change_rate < 0 else "#475569"
    
    summary_data = [
        [Paragraph("<b>항목</b>", korean_center_style), Paragraph("<b>내용</b>", korean_center_style)],
        [Paragraph("총 소비 금액", korean_center_style), Paragraph(f"KRW {int(report_data['total_amount']):,}", korean_center_style)],
        [Paragraph("총 거래 건수", korean_center_style), Paragraph(f"{report_data['transaction_count']}건", korean_center_style)],
        [Paragraph("전기 대비 변동", korean_center_style), Paragraph(f"<font color='{hex_color_str}'><b>{change_rate}%</b></font>", korean_center_style)]
    ]
    
    summary_table = Table(summary_data, colWidths=[150, 300])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'MalgunGothic'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#475569")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 12),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 30))
    
    # 3. 비주얼 분석 (그래프 추가)
    if report_data.get('top_categories'):
        elements.append(Paragraph("📊 카테고리별 지출 비중", sub_title_style))
        chart_buffer = generate_category_pie_chart(report_data['top_categories'])
        if chart_buffer:
            from reportlab.platypus import Image
            img = Image(chart_buffer, width=400, height=260)
            img.hAlign = 'CENTER'
            elements.append(img)
            elements.append(Spacer(1, 20))

    # 4. 상위 소비 카테고리
    elements.append(Paragraph("📈 상세 지출 순위", sub_title_style))
    cat_data = [[
        Paragraph("<b>순위</b>", korean_center_style), 
        Paragraph("<b>카테고리</b>", korean_center_style), 
        Paragraph("<b>금액</b>", korean_center_style), 
        Paragraph("<b>건수</b>", korean_center_style), 
        Paragraph("<b>비중</b>", korean_center_style)
    ]]
    for i, cat in enumerate(report_data['top_categories'], 1):
        cat_data.append([
            Paragraph(str(i), korean_center_style),
            Paragraph(cat['name'], korean_center_style),
            Paragraph(f"{int(cat['amount']):,}원", korean_center_style),
            Paragraph(f"{cat['count']}건", korean_center_style),
            Paragraph(f"{cat['percent']:.1f}%", korean_center_style)
        ])
    
    cat_table = Table(cat_data, colWidths=[50, 110, 120, 80, 90])
    cat_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'MalgunGothic'),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#475569")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(cat_table)
    elements.append(Spacer(1, 25))
    
    # 4. AI 비즈니스 인사이트 (가장 중요)
    elements.append(Paragraph("💡 AI 비즈니스 인사이트", sub_title_style))
    elements.append(Spacer(1, 15)) # 겹침 방지를 위한 명확한 여백 고정
    
    ai_raw_content = report_data.get('ai_insight', "AI 분석 결과가 없습니다.")
    
    # AI 박스 내부에 들어갈 요소들 구성
    ai_elements = []
    
    # 텍스트 강조 컬러 정의 (Indigo-700 계열)
    accent_color = "#4338ca"
    
    # 마크다운 문법 처리 및 스타일링
    lines = ai_raw_content.split('\n')
    for line in lines:
        stripped_line = line.strip()
        if not stripped_line:
            ai_elements.append(Spacer(1, 10))
            continue
            
        # 강조 표시 (<b> 태그 + 색상 적용) - 상위에서 먼저 처리
        import re
        # **텍스트** 를 강조 컬러와 굵은 글씨로 변환
        line_content = re.sub(r'\*\*(.*?)\*\*', f'<font color="{accent_color}"><b>\\1</b></font>', stripped_line)
        
        # 계층 구조 파악 (공백으로 시작하는지 확인)
        is_indented = line.startswith(' ') or line.startswith('\t')
        
        # 헤더 처리 (## 제목 등)
        if stripped_line.startswith('## '):
            header_style = ParagraphStyle(
                'AIHeader',
                parent=korean_style,
                fontSize=13,
                fontName='MalgunGothicBold',
                leading=20,
                spaceBefore=15,
                spaceAfter=8,
                textColor=colors.HexColor(accent_color),
                leftIndent=10,
                borderColor=colors.HexColor("#667eea"),
                borderLeftWidth=2,
                borderPadding=5
            )
            ai_elements.append(Paragraph(line_content.replace('## ', ''), header_style))
        elif stripped_line.startswith('# '):
            header_style = ParagraphStyle(
                'AIHeaderMain',
                parent=korean_style,
                fontSize=15,
                fontName='MalgunGothicBold',
                leading=22,
                spaceBefore=18,
                spaceAfter=10,
                textColor=colors.HexColor(accent_color),
                borderLeftWidth=4,
                borderPadding=10,
                borderColor=colors.HexColor(accent_color)
            )
            ai_elements.append(Paragraph(line_content.replace('# ', ''), header_style))
            
        # 리스트 처리
        elif stripped_line.startswith('- ') or stripped_line.startswith('* '):
            content = line_content[2:]
            
            if is_indented:
                # 하위 카테고리 (Level 2)
                sub_bullet_style = ParagraphStyle(
                    'AISubBullet',
                    parent=korean_style,
                    fontSize=10,
                    leading=16,
                    leftIndent=35,
                    firstLineIndent=-15,
                    spaceAfter=4
                )
                ai_elements.append(Paragraph(f"- {content}", sub_bullet_style))
            else:
                # 상위 카테고리 (Level 1)
                bullet_style = ParagraphStyle(
                    'AIBullet',
                    parent=korean_style,
                    fontSize=11,
                    fontName='MalgunGothicBold', # 상위 카테고리는 볼드 처리
                    leading=18,
                    leftIndent=20,
                    firstLineIndent=-15,
                    spaceAfter=6
                )
                ai_elements.append(Paragraph(f"• {content}", bullet_style))
                
        # 일반 본문
        else:
            body_style = ParagraphStyle(
                'AIBody',
                parent=korean_style,
                fontSize=10.5,
                leading=17,
                alignment=0, # LEFT
                spaceBefore=2,
                spaceAfter=5,
                leftIndent=10
            )
            ai_elements.append(Paragraph(line_content, body_style))
            
    # AI 컨텐츠 직접 추가 (테이블 래핑 제거하여 LayoutError 방지)
    for ai_el in ai_elements:
        elements.append(ai_el)
    
    # 5. 푸터 (Footer) 추가
    elements.append(Spacer(1, 40))
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=korean_style,
        fontSize=8,
        textColor=colors.grey,
        alignment=1 # Center
    )
    elements.append(Paragraph("본 리포트는 Caffeine AI 분석 엔진에 의해 자동으로 생성되었습니다.", footer_style))
    elements.append(Paragraph("© 2025 Caffeine Financial Platform. All rights reserved.", footer_style))
    
    # PDF 생성
    doc.build(elements)
    logger.info(f"PDF Report generated: {output_path}")

async def generate_weekly_report(db: AsyncSession) -> Dict[str, Any]:
    """
    주간 리포트 데이터를 생성합니다. (지난주 월~일)
    
    Args:
        db: 데이터베이스 세션
    
    Returns:
        dict: 리포트 데이터
    """
    # 실행 시점 (보통 월요일 오전)
    today = datetime.now()
    
    # 지난주 월요일 구하기
    # today.weekday(): 월(0) ~ 일(6)
    # 이번주 월요일: today - timedelta(days=today.weekday())
    # 지난주 월요일: 이번주 월요일 - 7일
    this_week_monday = today - timedelta(days=today.weekday())
    start_of_week = this_week_monday - timedelta(days=7)
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 지난주 일요일 (이번주 월요일 00:00 직전)
    end_of_week = this_week_monday.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 지지난 주 (증감율 비교용)
    last_week_start = start_of_week - timedelta(days=7)
    last_week_end = start_of_week
    
    # 이번 주(실제로는 지난 주) 거래 데이터 (이상 거래 제외)
    this_week_query = select(
        func.count(Transaction.id).label("count"),
        func.sum(Transaction.amount).label("total_amount")
    ).where(
        and_(
            Transaction.transaction_time >= start_of_week,
            Transaction.transaction_time < end_of_week,
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
        )
    )
    this_week_result = await db.execute(this_week_query)
    this_week_data = this_week_result.first()
    
    # 최대 지출 거래 조회 (카테고리명 포함)
    max_tx_query = select(Transaction, Category.name).join(
        Category, Transaction.category_id == Category.id
    ).where(
        and_(
            Transaction.transaction_time >= start_of_week,
            Transaction.transaction_time < end_of_week,
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
        )
    ).order_by(Transaction.amount.desc()).limit(1)
    max_tx_result = await db.execute(max_tx_query)
    max_tx_row = max_tx_result.first()
    
    max_transaction = max_tx_row[0] if max_tx_row else None
    max_cat_name = max_tx_row[1] if max_tx_row else None
    
    # 이상 거래 조회
    fraud_tx_query = select(Transaction).where(
        and_(
            Transaction.transaction_time >= start_of_week,
            Transaction.transaction_time < end_of_week,
            Transaction.is_fraudulent == True
        )
    ).order_by(Transaction.transaction_time.desc())
    fraud_tx_result = await db.execute(fraud_tx_query)
    fraud_transactions = fraud_tx_result.scalars().all()

    # 지난 주(실제로는 지지난 주) 거래 데이터 (이상 거래 제외)
    last_week_query = select(
        func.sum(Transaction.amount).label("total_amount")
    ).where(
        and_(
            Transaction.transaction_time >= last_week_start,
            Transaction.transaction_time < last_week_end,
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
        )
    )
    last_week_result = await db.execute(last_week_query)
    last_week_data = last_week_result.first()
    
    # 카테고리별 집계 (이상 거래 제외)
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
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
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
        "max_transaction": None,
        "fraud_transactions": []
    }
    
    # 카테고리 데이터 처리 (비율 계산)
    if categories and this_week_total > 0:
        for cat in categories:
            cat_amount = float(cat.amount)
            # 전체 지출액 대비 비중으로 계산
            percentage = (cat_amount / this_week_total) * 100
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
            "date": max_transaction.transaction_time.strftime("%m/%d"),
            "category": max_cat_name
        }

    # 이상 거래 데이터 처리
    for tx in fraud_transactions:
        report_data["fraud_transactions"].append({
            "merchant_name": tx.merchant_name,
            "amount": float(tx.amount),
            "date": tx.transaction_time.strftime("%m/%d %H:%M"),
            "description": tx.description
        })

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
    월간 리포트 데이터를 생성합니다. (지난달 1일 ~ 말일)
    
    Args:
        db: 데이터베이스 세션
    
    Returns:
        dict: 리포트 데이터
    """
    # 실행 시점 (보통 1일 오전)
    today = datetime.now()
    
    # 이번 달 1일
    this_month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # 지난 달 1일 (start_of_month)
    if this_month_start.month == 1:
        start_of_month = this_month_start.replace(year=this_month_start.year - 1, month=12)
    else:
        start_of_month = this_month_start.replace(month=this_month_start.month - 1)
        
    # 지난 달의 다음 달 1일 == 이번 달 1일 (end_of_month)
    # 쿼리에서 < end_of_month 로 사용하여 지난 달 말일까지 포함
    end_of_month = this_month_start
    
    # 지지난 달 (증감율 비교용)
    if start_of_month.month == 1:
        last_month_start = start_of_month.replace(year=start_of_month.year - 1, month=12)
    else:
        last_month_start = start_of_month.replace(month=start_of_month.month - 1)
    last_month_end = start_of_month
    
    # 이번 달 거래 데이터 (이상 거래 제외)
    this_month_query = select(
        func.count(Transaction.id).label("count"),
        func.sum(Transaction.amount).label("total_amount")
    ).where(
        and_(
            Transaction.transaction_time >= start_of_month,
            Transaction.transaction_time < end_of_month,
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
        )
    )
    this_month_result = await db.execute(this_month_query)
    this_month_data = this_month_result.first()
    
    # 최대 지출 거래 조회 (이상 거래 제외)
    max_tx_query = select(Transaction, Category.name).join(
        Category, Transaction.category_id == Category.id
    ).where(
        and_(
            Transaction.transaction_time >= start_of_month,
            Transaction.transaction_time < end_of_month,
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
        )
    ).order_by(Transaction.amount.desc()).limit(1)
    max_tx_result = await db.execute(max_tx_query)
    max_tx_row = max_tx_result.first()
    
    max_transaction = max_tx_row[0] if max_tx_row else None
    max_cat_name = max_tx_row[1] if max_tx_row else None

    # 이상 거래 조회
    fraud_tx_query = select(Transaction).where(
        and_(
            Transaction.transaction_time >= start_of_month,
            Transaction.transaction_time < end_of_month,
            Transaction.is_fraudulent == True
        )
    ).order_by(Transaction.transaction_time.desc())
    fraud_tx_result = await db.execute(fraud_tx_query)
    fraud_transactions = fraud_tx_result.scalars().all()
    
    # 지난 달 거래 데이터 (이상 거래 제외)
    last_month_query = select(
        func.sum(Transaction.amount).label("total_amount")
    ).where(
        and_(
            Transaction.transaction_time >= last_month_start,
            Transaction.transaction_time < last_month_end,
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
        )
    )
    last_month_result = await db.execute(last_month_query)
    last_month_data = last_month_result.first()
    
    # 카테고리별 집계 (이상 거래 제외)
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
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
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
        "max_transaction": None,
        "fraud_transactions": []
    }
    
    # 카테고리 데이터 처리 (비율 계산)
    if categories and this_month_total > 0:
        for cat in categories:
            cat_amount = float(cat.amount)
            # 전체 지출액 대비 비중으로 계산
            percentage = (cat_amount / this_month_total) * 100
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
            "date": max_transaction.transaction_time.strftime("%m/%d"),
            "category": max_cat_name
        }

    # 이상 거래 데이터 처리
    for tx in fraud_transactions:
        report_data["fraud_transactions"].append({
            "merchant_name": tx.merchant_name,
            "amount": float(tx.amount),
            "date": tx.transaction_time.strftime("%m/%d %H:%M"),
            "description": tx.description
        })

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


async def generate_daily_report(db: AsyncSession) -> Dict[str, Any]:
    """
    일간 리포트 데이터를 생성합니다. (전날 데이터)
    
    Args:
        db: 데이터베이스 세션
    
    Returns:
        dict: 리포트 데이터
    """
    # 어제 (00:00:00 ~ 23:59:59)
    today = datetime.now()
    yesterday = today - timedelta(days=1)
    
    start_of_day = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 그저께 (증감율 비교용)
    day_before_yesterday_start = start_of_day - timedelta(days=1)
    day_before_yesterday_end = start_of_day

    # 어제 거래 데이터 (이상 거래 제외)
    yesterday_query = select(
        func.count(Transaction.id).label("count"),
        func.sum(Transaction.amount).label("total_amount")
    ).where(
        and_(
            Transaction.transaction_time >= start_of_day,
            Transaction.transaction_time < end_of_day,
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
        )
    )
    yesterday_result = await db.execute(yesterday_query)
    yesterday_data = yesterday_result.first()

    # 최대 지출 거래 조회 (카테고리명 포함)
    max_tx_query = select(Transaction, Category.name).join(
        Category, Transaction.category_id == Category.id
    ).where(
        and_(
            Transaction.transaction_time >= start_of_day,
            Transaction.transaction_time < end_of_day,
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
        )
    ).order_by(Transaction.amount.desc()).limit(1)
    max_tx_result = await db.execute(max_tx_query)
    max_tx_row = max_tx_result.first()
    
    max_transaction = max_tx_row[0] if max_tx_row else None
    max_cat_name = max_tx_row[1] if max_tx_row else None

    # 이상 거래 조회
    fraud_tx_query = select(Transaction).where(
        and_(
            Transaction.transaction_time >= start_of_day,
            Transaction.transaction_time < end_of_day,
            Transaction.is_fraudulent == True
        )
    ).order_by(Transaction.transaction_time.desc())
    fraud_tx_result = await db.execute(fraud_tx_query)
    fraud_transactions = fraud_tx_result.scalars().all()

    # 그저께 거래 데이터 (이상 거래 제외)
    day_before_query = select(
        func.sum(Transaction.amount).label("total_amount")
    ).where(
        and_(
            Transaction.transaction_time >= day_before_yesterday_start,
            Transaction.transaction_time < day_before_yesterday_end,
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
        )
    )
    day_before_result = await db.execute(day_before_query)
    day_before_data = day_before_result.first()

    # 카테고리별 집계 (이상 거래 제외)
    category_query = select(
        Category.name,
        func.sum(Transaction.amount).label("amount"),
        func.count(Transaction.id).label("count")
    ).join(
        Transaction, Transaction.category_id == Category.id
    ).where(
        and_(
            Transaction.transaction_time >= start_of_day,
            Transaction.transaction_time < end_of_day,
            Transaction.status == "completed",
            Transaction.is_fraudulent == False
        )
    ).group_by(Category.name).order_by(func.sum(Transaction.amount).desc()).limit(5)
    
    category_result = await db.execute(category_query)
    categories = category_result.all()

    # 전일 대비 증감율 계산
    yesterday_total = float(yesterday_data.total_amount or 0)
    day_before_total = float(day_before_data.total_amount or 0)
    
    if day_before_total > 0:
        change_rate = ((yesterday_total - day_before_total) / day_before_total) * 100
    else:
        change_rate = 0
    
    report_data = {
        "period_start": start_of_day.strftime("%Y-%m-%d"),
        "period_end": start_of_day.strftime("%Y-%m-%d"),
        "total_amount": yesterday_total,
        "transaction_count": yesterday_data.count or 0,
        "change_rate": round(change_rate, 1),
        "top_categories": [],
        "max_transaction": None,
        "fraud_transactions": []
    }

    # 카테고리 데이터 처리
    if categories and yesterday_total > 0:
        for cat in categories:
            cat_amount = float(cat.amount)
            # 전체 지출액 대비 비중으로 계산
            percentage = (cat_amount / yesterday_total) * 100
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
            "date": max_transaction.transaction_time.strftime("%H:%M"),
            "category": max_cat_name
        }

    # 이상 거래 데이터 처리
    for tx in fraud_transactions:
        report_data["fraud_transactions"].append({
            "merchant_name": tx.merchant_name,
            "amount": float(tx.amount),
            "date": tx.transaction_time.strftime("%H:%M"),
            "description": tx.description
        })

    # AI Insight 생성
    try:
        # 일간 리포트는 데이터 양이 적으므로 간략한 프롬프트 사용
        prompt = generate_report_prompt("일간 소비", report_data)
        ai_insight = await call_gemini_api(prompt)
        report_data["ai_insight"] = ai_insight
        logger.info(f"Generated AI Insight (Daily): {ai_insight}")
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
        change_color = "#e53e3e"  # Red-600
        change_icon = "↑"
    elif change_rate < 0:
        change_color = "#38a169"  # Green-600
        change_icon = "↓"
    else:
        change_color = "#718096"  # Gray-600
        change_icon = "="
    
    # 지표 데이터 구성
    stats = [
        ("총 소비 (정상 거래)", f"₩{report_data['total_amount']:,.0f}", ""),
        ("거래 건수", f"{report_data['transaction_count']}건", ""),
        ("전기 대비", f"{change_icon} {abs(change_rate):.1f}%", change_color)
    ]
    
    stats_html = ""
    for label, value, color in stats:
        color_style = f"color: {color};" if color else ""
        stats_html += f"""
        <div class="stat">
            <span class="stat-label">{label}</span>
            <span class="stat-value" style="{color_style}">{value}</span>
        </div>
        """
        
    # 상위 카테고리 HTML 생성
    categories_html = ""
    for cat in report_data["top_categories"][:3]:
        # 바 색상
        bar_color = "#667eea" if cat['percent'] > 90 else "#a3bffa"
        
        categories_html += f"""
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; align-items: flex-end;">
                <div>
                    <span style="font-size: 15px; font-weight: 700; color: #1a202c;">{cat['name']}</span>
                    <span style="font-size: 12px; color: #718096; margin-left: 6px;">({cat['count']}건)</span>
                </div>
                <span style="font-size: 15px; font-weight: 700; color: #2d3748;">₩{cat['amount']:,.0f}</span>
            </div>
            <div style="background-color: #edf2f7; height: 8px; border-radius: 4px; width: 100%; overflow: hidden;">
                <div style="background: {bar_color}; height: 8px; border-radius: 4px; width: {cat['percent']}%;"></div>
            </div>
        </div>
        """
        
    # 최대 지출 하이라이트
    max_spend_html = ""
    if report_data.get("max_transaction"):
        tx = report_data["max_transaction"]
        max_spend_html = f"""
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 800; color: #667eea; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">🏆 Highest Spending</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 800; color: #1a202c; font-size: 17px;">{tx['merchant_name']}</div>
                    <div style="font-size: 13px; color: #718096;">{tx['date']} 결제</div>
                </div>
                <div style="font-weight: 800; color: #e53e3e; font-size: 20px;">
                    ₩{tx['amount']:,.0f}
                </div>
            </div>
        </div>
        """
    
    # 이상 거래 섹션
    fraud_html = ""
    if report_data.get("fraud_transactions"):
        fraud_items = report_data["fraud_transactions"]
        fraud_count = len(fraud_items)
        fraud_total = sum(item["amount"] for item in fraud_items)
        
        fraud_list_html = ""
        for tx in fraud_items:
            fraud_list_html += f"""
            <div style="padding: 12px 0; border-bottom: 1px solid #fed7d7; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 700; color: #c53030; font-size: 14px;">{tx.get('merchant_name')}</div>
                    <div style="font-size: 12px; color: #e53e3e;">{tx.get('date')}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700; color: #c53030; font-size: 15px;">₩{tx.get('amount'):,.0f}</div>
                </div>
            </div>
            """
            
        fraud_html = f"""
        <div style="background-color: #fff5f5; border: 1px solid #feb7b7; border-radius: 12px; margin-bottom: 24px; overflow: hidden; padding: 16px;">
            <div style="font-weight: 800; color: #c53030; font-size: 15px; display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>🚨 이상 거래 탐지 ({fraud_count}건)</span>
                <span>총 ₩{fraud_total:,.0f}</span>
            </div>
            {fraud_list_html}
        </div>
        """

    # AI Insight Section
    ai_insight_html = ""
    if "ai_insight" in report_data and report_data["ai_insight"]:
        raw_insight = report_data['ai_insight']
        # Markdown 굵게 표시를 HTML로 변환
        formatted_insight = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', raw_insight)
        
        ai_insight_html = f"""
        <div class="ai-insight-box">
            <div class="ai-insight-title">
                <span style="margin-right: 10px;">💡</span> AI 수석 분석가 비즈니스 인사이트
            </div>
            <div class="ai-content">{formatted_insight}</div>
        </div>
        """

    # HTML 구조 조립
    html = f"""
    {max_spend_html}
    {fraud_html}
    
    {stats_html}

    <div style="margin-top: 40px; margin-bottom: 15px;">
        <h3 style="font-size: 18px; color: #1a202c; font-weight: 800; margin-bottom: 20px; border-left: 4px solid #667eea; padding-left: 12px;">📊 상위 지출 카테고리</h3>
        {categories_html}
    </div>

    {ai_insight_html}
    """
    
    return html
