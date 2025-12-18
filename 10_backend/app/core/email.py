
# 설정 (.env):
# GMAIL_ADDRESS=your-email@gmail.com
# GMAIL_APP_PASSWORD=your-app-password


import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header

logger = logging.getLogger(__name__)

# Gmail SMTP 설정
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

# 환경 변수에서 Gmail 정보 가져오기
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")


def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    이메일 발송 (동기 함수)
    
    Args:
        to_email: 수신자 이메일
        subject: 메일 제목
        body: 메일 본문 (HTML)
        
    Returns:
        bool: 발송 성공 여부
    """
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        logger.error("Gmail 설정이 없습니다. .env 파일을 확인하세요.")
        logger.error(f"GMAIL_ADDRESS: {'설정됨' if GMAIL_ADDRESS else '없음'}")
        logger.error(f"GMAIL_APP_PASSWORD: {'설정됨' if GMAIL_APP_PASSWORD else '없음'}")
        return False
    
    try:
        # 메일 구성
        msg = MIMEMultipart("alternative")
        # 한글 제목 인코딩 처리
        msg["Subject"] = Header(subject, "utf-8")
        msg["From"] = f"Caffeine <{GMAIL_ADDRESS}>"
        msg["To"] = to_email
        
        # HTML 본문
        html_part = MIMEText(body, "html", "utf-8")
        msg.attach(html_part)
        
        # SMTP 연결 및 발송
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()  # TLS 암호화
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, to_email, msg.as_string())
        
        logger.info(f"이메일 발송 성공: {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError:
        logger.error("Gmail 인증 실패. 앱 비밀번호를 확인하세요.")
        return False
    except Exception as e:
        logger.error(f"이메일 발송 실패: {str(e)}")
        return False


def send_verification_email(to_email: str, code: str) -> bool:
    """
    인증 코드 이메일 발송
    
    Args:
        to_email: 수신자 이메일
        code: 6자리 인증 코드
        
    Returns:
        bool: 발송 성공 여부
    """
    subject = "[Caffeine] 비밀번호 재설정 인증 코드"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Apple SD Gothic Neo', sans-serif; }}
            .container {{ max-width: 480px; margin: 0 auto; padding: 40px 20px; }}
            .header {{ text-align: center; margin-bottom: 30px; }}
            .logo {{ font-size: 28px; font-weight: bold; color: #2563EB; }}
            .code-box {{ 
                background: linear-gradient(135deg, #2563EB, #60A5FA);
                color: white;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                text-align: center;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
            }}
            .info {{ color: #6B7280; font-size: 14px; text-align: center; }}
            .warning {{ color: #DC2626; font-size: 12px; text-align: center; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Caffeine</div>
                <p>비밀번호 재설정 인증 코드</p>
            </div>
            
            <div class="code-box">{code}</div>
            
            <p class="info">
                위 인증 코드를 앱에 입력해주세요.<br>
                코드는 <strong>5분간</strong> 유효합니다.
            </p>
            
            <p class="warning">
                ⚠️ 본인이 요청하지 않은 경우 이 메일을 무시하세요.
            </p>
        </div>
    </body>
    </html>
    """
    
    return send_email(to_email, subject, body)


def send_email_found_notification(to_email: str, masked_email: str) -> bool:
    """
    아이디(이메일) 찾기 결과 알림 발송
    
    Args:
        to_email: 수신자 이메일 (찾은 이메일)
        masked_email: 마스킹된 이메일 (ex***@gmail.com)
        
    Returns:
        bool: 발송 성공 여부
    """
    subject = "[Caffeine] 가입된 이메일 안내"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Apple SD Gothic Neo', sans-serif; }}
            .container {{ max-width: 480px; margin: 0 auto; padding: 40px 20px; }}
            .header {{ text-align: center; margin-bottom: 30px; }}
            .logo {{ font-size: 28px; font-weight: bold; color: #2563EB; }}
            .email-box {{ 
                background: #F3F4F6;
                color: #1F2937;
                font-size: 20px;
                font-weight: bold;
                text-align: center;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
            }}
            .info {{ color: #6B7280; font-size: 14px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Caffeine</div>
                <p>가입된 이메일 안내</p>
            </div>
            
            <div class="email-box">{masked_email}</div>
            
            <p class="info">
                위 이메일로 가입되어 있습니다.<br>
                로그인 페이지에서 로그인해주세요.
            </p>
        </div>
    </body>
    </html>
    """
    
    return send_email(to_email, subject, body)
