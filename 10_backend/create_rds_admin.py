import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.settings import settings
from app.db.model.user import User
from passlib.context import CryptContext

# bcrypt 직접 사용
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    """AWS RDS에 관리자 계정 생성"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(
        autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
    )
    
    print(f"🔍 연결된 DB: {settings.database_url.split('@')[1]}")
    print("="*60)
    
    admin_email = "admin@caffeine.com"
    admin_password = "admin1234"
    
    # 비밀번호 해시 생성
    password_hash = pwd_context.hash(admin_password)
    print(f"✅ 비밀번호 해시 생성 완료")
    
    async with async_session() as session:
        # 관리자 계정 생성
        admin_user = User(
            email=admin_email,
            password_hash=password_hash,
            name="Admin",
            nickname="관리자",
            role="ADMIN",
            is_superuser=True,
            is_active=True,
            status="ACTIVE",
            social_provider="LOCAL",
        )
        
        session.add(admin_user)
        await session.commit()
        
        print(f"✅ 관리자 계정 생성 완료!")
        print(f"   Email: {admin_email}")
        print(f"   Password: {admin_password}")
        print(f"   Role: ADMIN")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_admin())
