"""
관리자 설정 모델 - 알림 및 시스템 설정 저장

이 모델은 관리자 대시보드의 설정을 데이터베이스에 저장합니다.
"""

from sqlalchemy import BigInteger, Column, DateTime, String, Text
from sqlalchemy.sql import func
from app.db.database import Base


class AdminSettings(Base):
    """
    관리자 설정 테이블
    
    Key-Value 구조로 다양한 설정을 유연하게 저장합니다.
    예시 키:
    - notification.reports: 주간/월간 리포트 발송 여부
    - notification.anomaly_detection: 이상 거래 탐지 알림 여부
    - notification.recipient_email: 리포트 수신 이메일 주소
    - notification.threshold: 알림 임계값
    """
    __tablename__ = "admin_settings"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    key = Column(String(255), unique=True, nullable=False, index=True)  # 설정 키
    value = Column(Text, nullable=True)  # JSON 형태의 설정 값
    
    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<AdminSettings(key='{self.key}', value='{self.value}')>"
