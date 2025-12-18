#!/usr/bin/env python3
"""
관리자 계정 생성 스크립트
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.db.model.user import User
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    # Database URL
    database_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./caffeine.db")
    
    # Create async engine
    engine = create_async_engine(database_url, echo=True)
    
    # Create session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Check if admin already exists
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.email == "admin@caffeine.com")
        )
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("✅ 관리자 계정이 이미 존재합니다.")
            print(f"   Email: {existing_admin.email}")
            print(f"   Superuser: {existing_admin.is_superuser}")
            return
        
        # Create new admin user
        hashed_password = pwd_context.hash("admin123")
        
        admin_user = User(
            email="admin@caffeine.com",
            fullname="Admin User",
            phone="010-1234-5678",
            hashed_password=hashed_password,
            is_superuser=True,
            is_active=True
        )
        
        session.add(admin_user)
        await session.commit()
        await session.refresh(admin_user)
        
        print("✅ 관리자 계정이 생성되었습니다!")
        print(f"   Email: admin@caffeine.com")
        print(f"   Password: admin123")
        print(f"   Superuser: True")
        print(f"   User ID: {admin_user.id}")

if __name__ == "__main__":
    asyncio.run(create_admin())
