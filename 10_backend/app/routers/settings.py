"""
관리자 설정 API 라우터

설정 조회 및 저장 엔드포인트를 제공합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
import json
import logging

from app.db.database import get_db
from app.db.model.admin_settings import AdminSettings
from app.db.model.user import User
from app.routers.user import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin/settings",
    tags=["Admin Settings"]
)


# ============================================================
# Pydantic 스키마
# ============================================================

class NotificationSettings(BaseModel):
    """알림 설정"""
    anomalyDetection: bool = True
    reports: bool = True
    threshold: int = 1000000
    recipientEmail: Optional[EmailStr] = None


class SettingsResponse(BaseModel):
    """설정 응답"""
    notifications: NotificationSettings


class SettingsUpdateRequest(BaseModel):
    """설정 업데이트 요청"""
    notifications: NotificationSettings


# ============================================================
# 헬퍼 함수
# ============================================================

async def get_setting_value(db: AsyncSession, key: str) -> Optional[str]:
    """
    데이터베이스에서 설정 값을 가져옵니다.
    
    Args:
        db: 데이터베이스 세션
        key: 설정 키
    
    Returns:
        설정 값 (JSON 문자열) 또는 None
    """
    result = await db.execute(
        select(AdminSettings).where(AdminSettings.key == key)
    )
    setting = result.scalar_one_or_none()
    return setting.value if setting else None


async def set_setting_value(db: AsyncSession, key: str, value: any):
    """
    데이터베이스에 설정 값을 저장합니다.
    
    Args:
        db: 데이터베이스 세션
        key: 설정 키
        value: 설정 값 (JSON 직렬화 가능한 값)
    """
    # 기존 설정 확인
    result = await db.execute(
        select(AdminSettings).where(AdminSettings.key == key)
    )
    setting = result.scalar_one_or_none()
    
    # JSON 변환
    json_value = json.dumps(value, ensure_ascii=False)
    
    if setting:
        # 업데이트
        setting.value = json_value
    else:
        # 새로 생성
        new_setting = AdminSettings(key=key, value=json_value)
        db.add(new_setting)
    
    await db.commit()


# ============================================================
# API 엔드포인트
# ============================================================

@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    현재 설정을 조회합니다.
    
    **권한 필요**: 관리자 (슈퍼유저)
    
    Returns:
        SettingsResponse: 현재 설정
    """
    # 슈퍼유저만 접근 가능
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다."
        )
    
    # 설정 값 조회
    anomaly_detection = await get_setting_value(db, "notification.anomaly_detection")
    reports = await get_setting_value(db, "notification.reports")
    threshold = await get_setting_value(db, "notification.threshold")
    recipient_email = await get_setting_value(db, "notification.recipient_email")
    
    # 기본값 설정
    notifications = NotificationSettings(
        anomalyDetection=json.loads(anomaly_detection) if anomaly_detection else True,
        reports=json.loads(reports) if reports else True,
        threshold=json.loads(threshold) if threshold else 1000000,
        recipientEmail=json.loads(recipient_email) if recipient_email else None
    )
    
    return SettingsResponse(notifications=notifications)


@router.put("", response_model=SettingsResponse)
async def update_settings(
    request: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    설정을 업데이트합니다.
    
    **권한 필요**: 관리자 (슈퍼유저)
    
    Args:
        request: 업데이트할 설정 값
    
    Returns:
        SettingsResponse: 업데이트된 설정
    """
    # 슈퍼유저만 접근 가능
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다."
        )
    
    # 설정 값 저장
    notifications = request.notifications
    
    await set_setting_value(db, "notification.anomaly_detection", notifications.anomalyDetection)
    await set_setting_value(db, "notification.reports", notifications.reports)
    await set_setting_value(db, "notification.threshold", notifications.threshold)
    await set_setting_value(db, "notification.recipient_email", notifications.recipientEmail)
    
    logger.info(
        f"Settings updated (User: {current_user.email}): "
        f"reports={notifications.reports}, email={notifications.recipientEmail}"
    )
    
    return SettingsResponse(notifications=notifications)
