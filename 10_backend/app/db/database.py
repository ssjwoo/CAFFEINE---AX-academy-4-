from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.settings import settings


Base = declarative_base()

# 비동기 엔진 (lazy 생성 - DB 생성 후 사용)
_async_engine = None


def get_engine():
    global _async_engine
    if _async_engine is None:
        _async_engine = create_async_engine(settings.database_url, echo=False)
    return _async_engine


# 비동기 세션 의존성 주입용
async def get_db():
    engine = get_engine()
    async_session = sessionmaker(
        autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
    )
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# DB 연결 경로 확인 (개발용)
print("DB URL:", settings.database_url)
