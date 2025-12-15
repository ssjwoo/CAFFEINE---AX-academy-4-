import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.settings import settings
from app.db.model.user import User

async def list_all_users():
    """모든 사용자 조회"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(
        autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
    )
    
    print(f"🔍 연결된 DB: {settings.database_url.split('@')[1]}")
    print("="*60)
    
    async with async_session() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        
        if not users:
            print("❌ 등록된 사용자가 없습니다!")
        else:
            print(f"✅ 총 {len(users)}명의 사용자 발견:")
            for user in users:
                print(f"\n  ID: {user.id}")
                print(f"  Email: {user.email}")
                print(f"  Name: {user.name}")
                print(f"  Role: {user.role}")
                print(f"  Active: {user.is_active}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_all_users())
