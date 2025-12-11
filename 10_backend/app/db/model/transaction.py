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


class Coupon(Base):
    """
    쿠폰 테이블 (RDS 스키마)
    """
    __tablename__ = "coupons"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    category_id = Column(BigInteger, ForeignKey("categories.id"), nullable=True)
    
    # 쿠폰 정보
    merchant_name = Column(String(255), nullable=True)
    code = Column(String(50), unique=True, nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    discount_type = Column(String(20), default="rate", nullable=False)  # rate/amount
    discount_value = Column(BigInteger, default=0, nullable=False)
    min_amount = Column(BigInteger, nullable=True)
    
    # 유효기간
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Coupon(id={self.id}, code='{self.code}', title='{self.title}')>"


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
