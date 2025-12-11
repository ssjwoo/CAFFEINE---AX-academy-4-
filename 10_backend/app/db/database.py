from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import text
import asyncio
import logging

from app.core.settings import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# 비동기 엔진 (lazy 생성 - DB 생성 후 사용)
_async_engine = None
_current_db_type = None  # "rds" or "local"


async def test_connection(engine) -> bool:
    """DB 연결 테스트"""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning(f"DB 연결 실패: {e}")
        return False


async def create_engine_with_fallback():
    """AWS RDS 우선 연결, 실패 시 로컬 DB 폴백"""
    global _async_engine, _current_db_type
    
    # 1. AWS RDS 연결 시도
    logger.info(f"🔄 AWS RDS 연결 시도: {settings.db_host}")
    rds_engine = create_async_engine(
        settings.database_url, 
        echo=False,
        pool_pre_ping=True,
        connect_args={"timeout": 5}
    )
    
    if await test_connection(rds_engine):
        logger.info(f"✅ AWS RDS 연결 성공: {settings.db_host}")
        _async_engine = rds_engine
        _current_db_type = "rds"
        return _async_engine
    
    # 2. RDS 실패 시 로컬 DB 폴백
    await rds_engine.dispose()
    logger.warning(f"⚠️ AWS RDS 연결 실패, 로컬 DB로 폴백 시도: {settings.local_db_host}")
    
    local_engine = create_async_engine(
        settings.local_database_url,
        echo=False,
        pool_pre_ping=True,
        connect_args={"timeout": 5}
    )
    
    if await test_connection(local_engine):
        logger.info(f"✅ 로컬 DB 연결 성공: {settings.local_db_host}")
        _async_engine = local_engine
        _current_db_type = "local"
        return _async_engine
    
    # 3. 둘 다 실패
    await local_engine.dispose()
    raise Exception("❌ AWS RDS와 로컬 DB 모두 연결 실패!")


def get_engine():
    """동기 엔진 getter (초기 연결은 비동기로 해야 함)"""
    global _async_engine
    if _async_engine is None:
        # 동기 컨텍스트에서 호출 시 - 기본적으로 RDS 시도
        _async_engine = create_async_engine(settings.database_url, echo=False)
    return _async_engine


async def init_db():
    """앱 시작 시 DB 연결 초기화 (폴백 로직 포함)"""
    global _async_engine
    if _async_engine is None:
        await create_engine_with_fallback()
    return _async_engine


def get_current_db_type() -> str:
    """현재 연결된 DB 타입 반환"""
    return _current_db_type or "unknown"


# 비동기 세션 의존성 주입용
async def get_db():
    # 엔진이 없으면 초기화 (폴백 포함)
    if _async_engine is None:
        await init_db()
    
    async_session = sessionmaker(
        autocommit=False, autoflush=False, bind=_async_engine, class_=AsyncSession
    )
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# DB 연결 정보 출력 (개발용)
print(f"🔹 Primary DB (AWS RDS): {settings.db_host}")
print(f"🔹 Fallback DB (Local): {settings.local_db_host}")
