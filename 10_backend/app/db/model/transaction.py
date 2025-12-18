"""
RDS Transaction 모델 - AWS RDS PostgreSQL 스키마에 맞춤

2025-12-10: AWS RDS 스키마와 동기화
- category_id FK 방식 사용
- merchant_name 컬럼명 사용
"""

from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, ForeignKey, 
    String, Text, Numeric, Integer
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Category(Base):
    """
    카테고리 테이블 (RDS 스키마)
    """
    __tablename__ = "categories"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False)  # FOOD, TRANSPORT 등
    name = Column(String(100), nullable=False)  # 외식, 교통 등
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # 관계
    transactions = relationship("Transaction", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, code='{self.code}', name='{self.name}')>"


class Transaction(Base):
    """
    거래 내역 테이블 (RDS 스키마)
    """
    __tablename__ = "transactions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(BigInteger, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    # 거래 정보
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="KRW", nullable=False)
    merchant_name = Column(String(255), nullable=True)  # 가맹점명
    description = Column(Text, nullable=True)  # 메모/설명
    status = Column(String(50), default="completed", nullable=False)
    
    # 시간
    transaction_time = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # 관계
    category = relationship("Category", back_populates="transactions")
    user = relationship("User", backref="transactions")

    def __repr__(self):
        return f"<Transaction(id={self.id}, merchant='{self.merchant_name}', amount={self.amount})>"


class CouponTemplate(Base):
    """
    쿠폰 템플릿 테이블 (정규화)
    - 쿠폰의 기본 정보를 저장
    - 여러 사용자에게 발급되어도 중복 저장 방지
    """
    __tablename__ = "coupon_templates"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    category_id = Column(BigInteger, ForeignKey("categories.id"), nullable=True)
    
    # 쿠폰 정보
    merchant_name = Column(String(255), nullable=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    discount_type = Column(String(20), default="amount", nullable=False)  # rate(%) / amount(원)
    discount_value = Column(BigInteger, default=0, nullable=False)
    min_amount = Column(BigInteger, nullable=True)  # 최소 결제 금액
    
    # 유효기간 (일 수)
    validity_days = Column(Integer, default=30, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 관계
    user_coupons = relationship("UserCoupon", back_populates="template")

    def __repr__(self):
        return f"<CouponTemplate(id={self.id}, title='{self.title}')>"


class UserCoupon(Base):
    """
    사용자 쿠폰 테이블 (정규화)
    - 사용자별 발급 기록
    - template_id로 쿠폰 정보 참조 (중복 저장 방지)
    """
    __tablename__ = "user_coupons"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(BigInteger, ForeignKey("coupon_templates.id", ondelete="CASCADE"), nullable=False)
    
    # 발급 정보
    code = Column(String(50), unique=True, nullable=False)  # 고유 쿠폰 코드
    status = Column(String(20), default="available", nullable=False)  # available/used/expired
    
    # 유효기간
    valid_until = Column(DateTime(timezone=True), nullable=False)
    
    # 타임스탬프
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    used_at = Column(DateTime(timezone=True), nullable=True)

    # 관계
    template = relationship("CouponTemplate", back_populates="user_coupons")
    user = relationship("User", backref="coupons")

    def __repr__(self):
        return f"<UserCoupon(id={self.id}, code='{self.code}', status='{self.status}')>"


class Anomaly(Base):
    """
    이상 탐지 테이블 (RDS 스키마)
    """
    __tablename__ = "anomalies"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    transaction_id = Column(BigInteger, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    severity = Column(String(20), nullable=True)  # low/medium/high
    reason = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Anomaly(id={self.id}, transaction_id={self.transaction_id}, severity='{self.severity}')>"
