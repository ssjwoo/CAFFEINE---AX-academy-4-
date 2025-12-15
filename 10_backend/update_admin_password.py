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
from passlib.context import CryptContext

# bcrypt 직접 사용
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def update_admin_password():
    """관리자 계정 비밀번호 변경"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(
        autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
    )
    
    print(f"🔍 연결된 DB: {settings.database_url.split('@')[1]}")
    print("="*60)
    
    admin_email = "admin@caffeine.com"
    new_password = "secret"
    
    async with async_session() as session:
        # 관리자 계정 조회
        result = await session.execute(select(User).where(User.email == admin_email))
        admin_user = result.scalars().first()
        
        if not admin_user:
            print(f"❌ 관리자 계정을 찾을 수 없습니다: {admin_email}")
            return
        
        # 비밀번호 해시 생성
        password_hash = pwd_context.hash(new_password)
        print(f"✅ 새 비밀번호 해시 생성 완료")
        
        # 비밀번호 업데이트
        admin_user.password_hash = password_hash
        await session.commit()
        
        print(f"✅ 관리자 계정 비밀번호 변경 완료!")
        print(f"   Email: {admin_email}")
        print(f"   New Password: {new_password}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_admin_password())
