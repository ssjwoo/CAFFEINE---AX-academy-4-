# 2025-12-05: PostgreSQL 전환
# - URL 스키마: mysql+aiomysql → postgresql+asyncpg
# - CREATE DATABASE 문법: MySQL의 백틱(`) 제거 (PostgreSQL에서는 불필요)

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.settings import settings
from app.db.database import Base

# 모델들을 명시적으로 import (Base.metadata에 등록하기 위해 필수)
# 이 import가 없으면 create_all()이 실행되어도 테이블이 생성되지 않음
from app.db.model.user import User, LoginHistory
from app.db.model.group import UserGroup


# DB 및 테이블 생성 함수
async def ensure_database_and_tables():
    # DB 이름 추출
    db_name = settings.db_name
    
    # DB 없이 연결하는 URL (DB 생성용)
    # 2025-12-05: mysql+aiomysql → postgresql+asyncpg로 변경
    base_url = f"postgresql+asyncpg://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}"

    # 1) DB 생성 (없으면)
    tmp_engine = create_async_engine(base_url, isolation_level="AUTOCOMMIT")
    async with tmp_engine.connect() as conn:
        # 2025-12-05: PostgreSQL은 백틱(`) 불필요 (MySQL과 달리 식별자에 백틱 안 씀)
        await conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))
    await tmp_engine.dispose()

    # 2) 테이블 생성 (DB 포함된 URL로 새 엔진 생성)
    full_engine = create_async_engine(settings.database_url, echo=False)
    async with full_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await full_engine.dispose()

    print("DB & 테이블 생성 완료")