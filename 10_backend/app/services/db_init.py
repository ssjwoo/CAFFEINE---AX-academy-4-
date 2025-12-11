# 2025-12-10: AWS RDS PostgreSQL 연동
# - RDS에서는 DB가 이미 존재하므로 CREATE DATABASE 불필요
# - 테이블 자동 생성 (CREATE TABLE IF NOT EXISTS)

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.settings import settings
from app.db.database import Base

# 모델들을 명시적으로 import (Base.metadata에 등록하기 위해 필수)
# 이 import가 없으면 create_all()이 실행되어도 테이블이 생성되지 않음
from app.db.model.user import User, LoginHistory
from app.db.model.group import UserGroup
from app.db.model.transaction import Transaction, Coupon  # 2025-12-10 추가


async def ensure_database_and_tables():
    """
    RDS 데이터베이스에 테이블 생성
    
    AWS RDS에서는 DB가 이미 생성되어 있으므로,
    테이블만 생성합니다 (CREATE TABLE IF NOT EXISTS)
    """
    try:
        # 테이블 생성 (DB 포함된 URL로 엔진 생성)
        full_engine = create_async_engine(settings.database_url, echo=False)
        async with full_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await full_engine.dispose()
        
        print("✅ RDS 테이블 생성/확인 완료")
        
    except Exception as e:
        print(f"❌ DB 초기화 실패: {e}")
        raise


async def test_db_connection():
    """
    RDS 데이터베이스 연결 테스트
    """
    try:
        engine = create_async_engine(settings.database_url, echo=False)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"✅ RDS 연결 성공: {settings.db_host}")
        await engine.dispose()
        return True
    except Exception as e:
        print(f"❌ RDS 연결 실패: {e}")
        return False