import asyncio
import sys
import os
from typing import Optional

# 상위 디렉토리 추가 (backend 폴더)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

from app.core.settings import settings
from app.db.model.group import UserGroup
from app.db.model.user import User
from app.core.security import hash_password


async def seed_groups_and_admin(
    admin_email: str = "admin@example.com",
    admin_password: str = "admin1234",
    admin_name: str = "Admin",
    admin_nickname: Optional[str] = None,
):
    """기본 그룹(USER/ADMIN)과 최초 관리자 계정을 생성합니다."""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(
        autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
    )
    
    async with async_session() as session:
        # 그룹 시드
        groups_def = {
            "USER": {"name": "User", "description": "일반 사용자", "is_admin": False, "is_default": True},
            "ADMIN": {"name": "Admin", "description": "관리자", "is_admin": True, "is_default": False},
        }
        seeded_groups = {}
        for key, meta in groups_def.items():
            result = await session.execute(select(UserGroup).where(UserGroup.key == key))
            group = result.scalars().first()
            if not group:
                group = UserGroup(key=key, **meta)
                session.add(group)
                await session.flush()  # id 확보
                print(f"[seed] user_groups 추가: {key}")
            else:
                print(f"[seed] user_groups 존재: {key}")
            seeded_groups[key] = group

        # 관리자 계정 시드
        admin_group = seeded_groups.get("ADMIN")
        result = await session.execute(select(User).where(User.email == admin_email))
        admin_user = result.scalars().first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                password_hash=hash_password(admin_password),
                name=admin_name,
                nickname=admin_nickname,
                role="ADMIN",
                group_id=admin_group.id if admin_group else None,
                status="ACTIVE",
            )
            session.add(admin_user)
            print(f"[seed] admin 계정 생성: {admin_email}")
        else:
            print(f"[seed] admin 계정 존재: {admin_email}")

        await session.commit()
        print("[seed] 완료")


if __name__ == "__main__":
    asyncio.run(seed_groups_and_admin())
