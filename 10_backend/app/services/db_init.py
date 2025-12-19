# 2025-12-10: AWS RDS PostgreSQL 연동
# - RDS에서는 DB가 이미 존재하므로 CREATE DATABASE 불필요
# - 테이블 자동 생성 (CREATE TABLE IF NOT EXISTS)

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.settings import settings
from app.db.database import Base

# 모델들을 명시적으로 import (Base.metadata에 등록하기 위해 필수)
from app.db.model.user import User, LoginHistory
from app.db.model.group import UserGroup
from app.db.model.transaction import Transaction, Category, CouponTemplate, UserCoupon, Anomaly

async def ensure_database_and_tables():
    """
    RDS 데이터베이스에 테이블 생성
    """
    try:
        # 테이블 생성
        full_engine = create_async_engine(settings.database_url, echo=False)
        async with full_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await full_engine.dispose()
        print("RDS table verification/creation completed")
    except Exception as e:
        print(f"DB initialization failed: {e}")
        raise

async def test_db_connection():
    """
    RDS 데이터베이스 연결 테스트
    """
    try:
        engine = create_async_engine(settings.database_url, echo=False)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"RDS connection successful: {settings.db_host}")
        await engine.dispose()
        return True
    except Exception as e:
        print(f"RDS connection failed: {e}")
        return False