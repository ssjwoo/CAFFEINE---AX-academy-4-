"""
리포트 수동 발송 API 라우터

Settings 페이지에서 주간/월간 리포트를 즉시 발송할 수 있는 엔드포인트를 제공합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
import json

from app.db.database import get_db
from app.db.model.user import User
from app.db.model.admin_settings import AdminSettings
from app.routers.user import get_current_user
from app.services.report_service import (
    generate_weekly_report,
    generate_monthly_report,
    format_report_html
)
from app.services.email_service import send_report_email

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/admin/reports",
    tags=["Admin Reports"]
)


async def get_report_recipient_email(db: AsyncSession) -> str | None:
    """
    데이터베이스에서 리포트 수신자 이메일을 가져옵니다.
    
    Returns:
        str | None: 수신자 이메일 주소 또는 None
    """
    result = await db.execute(
        select(AdminSettings).where(AdminSettings.key == "notification.recipient_email")
    )
    setting = result.scalar_one_or_none()
    
    if setting and setting.value:
        try:
            return json.loads(setting.value)
        except:
            return None
    return None


@router.post("/send-weekly")
async def send_weekly_report_now(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    주간 리포트를 즉시 생성하고 발송합니다.
    
    **권한 필요**: 슈퍼유저
    
    Returns:
        dict: 발송 결과
    """
    # 슈퍼유저만 접근 가능
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다."
        )
    
    logger.info(f"Manual weekly report requested (User: {current_user.email})")
    
    try:
        # 수신자 이메일 확인
        recipient_email = await get_report_recipient_email(db)
        if not recipient_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="수신자 이메일이 설정되지 않았습니다. Settings에서 이메일을 설정해주세요."
            )
        
        # 리포트 데이터 생성
        report_data = await generate_weekly_report(db)
        summary_html = format_report_html(report_data)
        
        # 이메일 발송
        period = f"{report_data['period_start']} ~ {report_data['period_end']}"
        success, message = await send_report_email(
            recipient_email=recipient_email,
            subject=f"[Caffeine] Weeky Report ({period})",
            report_type="Weekly",
            period=period,
            summary_html=summary_html
        )
        
        logger.info(f"Weekly report processing completed: {message}")
        
        return {
            "success": success,
            "message": message,
            "period": period,
            "recipient": recipient_email
        }
        
    except ValueError as e:
        # SMTP 설정 누락 등 구성 오류
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Weekly report failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send report: {str(e)}"
        )


@router.post("/send-monthly")
async def send_monthly_report_now(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    월간 리포트를 즉시 생성하고 발송합니다.
    
    **권한 필요**: 슈퍼유저
    
    Returns:
        dict: 발송 결과
    """
    # 슈퍼유저만 접근 가능
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다."
        )
    
    logger.info(f"Manual monthly report requested (User: {current_user.email})")
    
    try:
        # 수신자 이메일 확인
        recipient_email = await get_report_recipient_email(db)
        if not recipient_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="수신자 이메일이 설정되지 않았습니다. Settings에서 이메일을 설정해주세요."
            )
        
        # 리포트 데이터 생성
        report_data = await generate_monthly_report(db)
        summary_html = format_report_html(report_data)
        
        # 이메일 발송
        period = f"{report_data['period_start']} ~ {report_data['period_end']}"
        success, message = await send_report_email(
            recipient_email=recipient_email,
            subject=f"[Caffeine] Monthly Report ({period})",
            report_type="Monthly",
            period=period,
            summary_html=summary_html
        )
        
        logger.info(f"Monthly report processing completed: {message}")
        
        return {
            "success": success,
            "message": message,
            "period": period,
            "recipient": recipient_email
        }
    
    except ValueError as e:
        # SMTP 설정 누락 등 구성 오류
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Monthly report failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send report: {str(e)}"
        )
