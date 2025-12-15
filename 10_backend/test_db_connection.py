import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.settings import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_connection(engine, db_name):
    """DB 연결 테스트"""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info(f"✅ {db_name} 연결 성공!")
        return True
    except Exception as e:
        logger.error(f"❌ {db_name} 연결 실패: {e}")
        return False

async def main():
    # RDS 연결 테스트
    logger.info(f"🔄 AWS RDS 연결 테스트: {settings.db_host}")
    rds_engine = create_async_engine(
        settings.database_url, 
        echo=False,
        pool_pre_ping=False,
        connect_args={"timeout": 5}
    )
    rds_ok = await test_connection(rds_engine, "AWS RDS")
    await rds_engine.dispose()
    
    # 로컬 DB 연결 테스트
    logger.info(f"🔄 로컬 DB 연결 테스트: {settings.local_db_host}")
    local_engine = create_async_engine(
        settings.local_database_url,
        echo=False,
        pool_pre_ping=False,
        connect_args={"timeout": 5}
    )
    local_ok = await test_connection(local_engine, "로컬 DB")
    await local_engine.dispose()
    
    logger.info("\n" + "="*50)
    logger.info(f"AWS RDS: {'✅ 성공' if rds_ok else '❌ 실패'}")
    logger.info(f"로컬 DB: {'✅ 성공' if local_ok else '❌ 실패'}")
    logger.info("="*50)

if __name__ == "__main__":
    asyncio.run(main())
