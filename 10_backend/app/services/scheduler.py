"""
스케줄러 서비스

APScheduler를 사용하여 주간/월간 리포트를 자동으로 생성하고 발송합니다.
"""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.db.database import get_engine
from app.services.report_service import (
    generate_weekly_report,
    generate_monthly_report,
    format_report_html
)
from app.services.email_service import send_report_email
from sqlalchemy import select
from app.db.model.admin_settings import AdminSettings
import json

logger = logging.getLogger(__name__)

# 전역 스케줄러 인스턴스
scheduler: AsyncIOScheduler = None


async def get_db_session() -> AsyncSession:
    """
    스케줄러 작업에서 사용할 DB 세션을 가져옵니다.
    """
    engine = get_engine()
    async_session_local = sessionmaker(
        autocommit=False, 
        autoflush=False, 
        bind=engine, 
        class_=AsyncSession,
        expire_on_commit=False
    )
    return async_session_local()


async def get_report_settings(db: AsyncSession) -> dict:
    """
    데이터베이스에서 리포트 설정을 가져옵니다.
    
    Returns:
        dict: 설정 딕셔너리
    """
    settings = {}
    
    # 리포트 발송 여부
    reports_enabled_query = await db.execute(
        select(AdminSettings).where(AdminSettings.key == "notification.reports")
    )
    reports_setting = reports_enabled_query.scalar_one_or_none()
    settings["reports_enabled"] = (
        json.loads(reports_setting.value) if reports_setting and reports_setting.value else True
    )
    
    # 수신자 이메일
    email_query = await db.execute(
        select(AdminSettings).where(AdminSettings.key == "notification.recipient_email")
    )
    email_setting = email_query.scalar_one_or_none()
    settings["recipient_email"] = (
        json.loads(email_setting.value) if email_setting and email_setting.value else None
    )
    
    return settings


async def send_weekly_report_job():
    """
    주간 리포트를 생성하고 발송하는 스케줄 작업입니다.
    매주 월요일 오전 9시에 실행됩니다.
    """
    logger.info("Weekly report generation started")
    
    db = await get_db_session()
    try:
        # 설정 확인
        settings = await get_report_settings(db)
        
        if not settings["reports_enabled"]:
            logger.info("Weekly report is disabled.")
            return
        
        if not settings["recipient_email"]:
            logger.warning("Recipient email is not configured.")
            return
        
        # 리포트 데이터 생성
        report_data = await generate_weekly_report(db)
        summary_html = format_report_html(report_data)
        
        # 이메일 발송
        period = f"{report_data['period_start']} ~ {report_data['period_end']}"
        await send_report_email(
            recipient_email=settings["recipient_email"],
            subject=f"[Caffeine] Weeky Report ({period})",
            report_type="Weekly",
            period=period,
            summary_html=summary_html
        )
        
        logger.info("Weekly report sent successfully")
        
    except Exception as e:
        logger.error(f"Failed to send weekly report: {str(e)}", exc_info=True)
    finally:
        await db.close()


async def send_monthly_report_job():
    """
    월간 리포트를 생성하고 발송하는 스케줄 작업입니다.
    매월 1일 오전 9시에 실행됩니다.
    """
    logger.info("Monthly report generation started")
    
    db = await get_db_session()
    try:
        # 설정 확인
        settings = await get_report_settings(db)
        
        if not settings["reports_enabled"]:
            logger.info("Monthly report is disabled.")
            return
        
        if not settings["recipient_email"]:
            logger.warning("Recipient email is not configured.")
            return
        
        # 리포트 데이터 생성
        report_data = await generate_monthly_report(db)
        summary_html = format_report_html(report_data)
        
        # 이메일 발송
        period = f"{report_data['period_start']} ~ {report_data['period_end']}"
        await send_report_email(
            recipient_email=settings["recipient_email"],
            subject=f"[Caffeine] Monthly Report ({period})",
            report_type="Monthly",
            period=period,
            summary_html=summary_html
        )
        
        logger.info("Monthly report sent successfully")
        
    except Exception as e:
        logger.error(f"Failed to send monthly report: {str(e)}", exc_info=True)
    finally:
        await db.close()


def start_scheduler():
    """
    스케줄러를 시작합니다.
    애플리케이션 시작 시 한 번만 호출되어야 합니다.
    """
    global scheduler
    
    if scheduler is not None:
        logger.warning("Scheduler is already running.")
        return
    
    # AsyncIOScheduler 생성
    scheduler = AsyncIOScheduler()
    
    # 주간 리포트: 매주 월요일 오전 9시
    scheduler.add_job(
        send_weekly_report_job,
        trigger=CronTrigger(day_of_week="mon", hour=9, minute=0),
        id="weekly_report",
        name="Send Weekly Report",
        replace_existing=True
    )
    
    # 월간 리포트: 매월 1일 오전 9시
    scheduler.add_job(
        send_monthly_report_job,
        trigger=CronTrigger(day=1, hour=9, minute=0),
        id="monthly_report",
        name="Send Monthly Report",
        replace_existing=True
    )
    
    # 스케줄러 시작
    scheduler.start()
    
    logger.info("=" * 60)
    logger.info("Scheduler started")
    logger.info("  - Weekly Report: Every Monday 09:00")
    logger.info("  - Monthly Report: Every 1st day of month 09:00")
    logger.info("=" * 60)


def shutdown_scheduler():
    """
    스케줄러를 종료합니다.
    애플리케이션 종료 시 호출됩니다.
    """
    global scheduler
    
    if scheduler is not None:
        scheduler.shutdown()
        scheduler = None
        logger.info("Scheduler stopped")
