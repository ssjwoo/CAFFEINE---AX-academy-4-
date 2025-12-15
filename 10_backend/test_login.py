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
from app.core.security import verify_password

async def test_login(email: str, password: str):
    """로그인 테스트"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(
        autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
    )
    
    async with async_session() as session:
        # 사용자 조회
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user:
            print(f"❌ 사용자를 찾을 수 없습니다: {email}")
            return
        
        print(f"✅ 사용자 찾음: {user.email}")
        print(f"   - ID: {user.id}")
        print(f"   - Name: {user.name}")
        print(f"   - Role: {user.role}")
        print(f"   - Password Hash: {user.password_hash[:50]}...")
        
        # 비밀번호 검증
        is_valid = verify_password(password, user.password_hash)
        if is_valid:
            print(f"✅ 비밀번호 일치!")
        else:
            print(f"❌ 비밀번호 불일치!")
    
    await engine.dispose()

if __name__ == "__main__":
    # 여러 조합 시도
    print("="*60)
    print("테스트 1: admin@caffeine.com / admin1234")
    print("="*60)
    asyncio.run(test_login("admin@caffeine.com", "admin1234"))
    
    print("\n" + "="*60)
    print("테스트 2: admin@example.com / admin1234")
    print("="*60)
    asyncio.run(test_login("admin@example.com", "admin1234"))
