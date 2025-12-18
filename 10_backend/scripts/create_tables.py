import asyncio
import sys
import os

# 상위 디렉토리 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine
from app.core.settings import settings
from app.db.database import Base
from app.db.model.user import User, LoginHistory
from app.db.model.group import UserGroup


async def create_tables():
    """모든 테이블을 생성합니다."""
    engine = create_async_engine(settings.database_url, echo=True)
    
    async with engine.begin() as conn:
        # 모든 테이블 삭제 후 재생성 (주의: 기존 데이터 모두 삭제됨!)
        print("⚠️  기존 테이블 삭제 중...")
        await conn.run_sync(Base.metadata.drop_all)
        print("✅ 테이블 생성 중...")
        await conn.run_sync(Base.metadata.create_all)
    
    await engine.dispose()
    print("✅ 테이블 생성 완료!")


if __name__ == "__main__":
    asyncio.run(create_tables())
