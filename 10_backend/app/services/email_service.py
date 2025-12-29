# -*- coding: utf-8 -*-
"""
이메일 발송 서비스

주간/월간 리포트를 이메일로 발송하는 서비스입니다.
SMTP를 사용하여 비동기로 이메일을 전송합니다.
"""

import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from jinja2 import Template
from datetime import datetime

logger = logging.getLogger(__name__)


# HTML 이메일 템플릿
EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .summary-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .summary-box h2 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
        }
        .stat {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .stat:last-child {
            border-bottom: none;
        }
        .stat-label {
            color: #6c757d;
            font-size: 14px;
        }
        .stat-value {
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
        .button {
            display: inline-block;
            margin: 20px 0;
            padding: 12px 30px;
            background-color: #667eea;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Caffeine 소비 분석 리포트</h1>
            <p>{{ report_type }} 리포트 ({{ period }})</p>
        </div>
        <div class="content">
            <div class="summary-box">
                <h2>Summary</h2>
                {{ summary_html }}
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
                더 자세한 분석은 관리자 대시보드에서 확인하실 수 있습니다.
            </p>
            
            <center>
                <a href="{{ dashboard_url }}" class="button">대시보드 열기</a>
            </center>
        </div>
        <div class="footer">
            <p>이 이메일은 Caffeine 시스템에서 자동으로 발송되었습니다.</p>
            <p>© 2025 Caffeine. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""


async def send_report_email(
    recipient_email: str,
    subject: str,
    report_type: str,
    period: str,
    summary_html: str,
    dashboard_url: str = "http://localhost:3000"
):
    """
    리포트 이메일을 발송합니다.
    
    Args:
        recipient_email: 수신자 이메일 주소
        subject: 이메일 제목
        report_type: 리포트 종류 ("주간" 또는 "월간")
        period: 기간 (예: "2025-12-09 ~ 2025-12-15")
        summary_html: 요약 HTML 내용
        dashboard_url: 대시보드 URL
    
    Returns:
        tuple[bool, str]: (성공 여부, 결과 메시지)
    """
    # 개발 모드 확인 (기본값: False)
    is_dev_mode = os.getenv("DEVELOPMENT_MODE", "false").lower() == "true"
    
    try:
        # Jinja2 템플릿으로 HTML 생성
        template = Template(EMAIL_TEMPLATE)
        html_content = template.render(
            report_type=report_type,
            period=period,
            summary_html=summary_html,
            dashboard_url=dashboard_url
        )

        # 개발 모드인 경우 파일로 저장
        if is_dev_mode:
            # reports 디렉토리 생성
            reports_dir = os.path.join(os.getcwd(), "reports")
            os.makedirs(reports_dir, exist_ok=True)
            
            # 파일명 생성 (예: weekly_report_20251215_143000.html)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{report_type}_report_{timestamp}.html"
            file_path = os.path.join(reports_dir, filename)
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(html_content)
                
            logger.info(f"saved report to file (dev mode): {file_path}")
            return True, f"Dev mode: Report saved to server. ({filename})"

        # SMTP 설정 확인
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("GMAIL_ADDRESS", "")
        smtp_password = os.getenv("GMAIL_APP_PASSWORD", "")
        smtp_from = os.getenv("SMTP_FROM", smtp_user)

        if not smtp_user or not smtp_password:
            error_msg = "SMTP 설정이 누락되었습니다. .env 파일에 SMTP 설정을 추가하거나 DEVELOPMENT_MODE=true를 설정하세요."
            logger.warning(f"{error_msg} 수신자: {recipient_email}")
            raise ValueError(error_msg)
        
        # 이메일 메시지 생성
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = smtp_from
        message["To"] = recipient_email
        
        # HTML 파트 추가
        html_part = MIMEText(html_content, "html", "utf-8")
        message.attach(html_part)
        
        # SMTP 서버로 전송
        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_password,
            start_tls=True
        )
        
        logger.info(f"Report email sent successfully: {recipient_email}")
        return True, f"Email sent to {recipient_email}."
        
    except ValueError as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to send email: {recipient_email}, Error: {str(e)}")
        raise e


async def send_test_email(recipient_email: str):
    """
    테스트 이메일을 발송합니다.
    
    Args:
        recipient_email: 수신자 이메일 주소
    
    Returns:
        tuple[bool, str]: (성공 여부, 결과 메시지)
    """
    summary_html = """
    <div class="stat">
        <span class="stat-label">Total Spend</span>
        <span class="stat-value">KRW 1,234,567</span>
    </div>
    <div class="stat">
        <span class="stat-label">Transactions</span>
        <span class="stat-value">42 txns</span>
    </div>
    <div class="stat">
        <span class="stat-label">vs Last Week</span>
        <span class="stat-value" style="color: #28a745;">-15.3%</span>
    </div>
    """
    
    return await send_report_email(
        recipient_email=recipient_email,
        subject="[Test] Caffeine Weekly Report",
        report_type="weekly",
        period="2025-12-09 ~ 2025-12-15",
        summary_html=summary_html
    )
