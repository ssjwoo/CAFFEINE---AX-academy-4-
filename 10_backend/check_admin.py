"""
RDS에 슈퍼유저 계정이 있는지 확인하는 스크립트
"""
import asyncio
from sqlalchemy import select
from app.db.database import init_db, get_db
from app.db.model.user import User

async def check_admin():
    # DB 연결 초기화
    await init_db()
    
    # DB 세션 가져오기
    async for db in get_db():
        try:
            # admin@caffeine.com 계정 조회
            result = await db.execute(
                select(User).where(User.email == "admin@caffeine.com")
            )
            admin_user = result.scalar_one_or_none()
            
            if admin_user:
                print("✅ 슈퍼유저 계정 발견!")
                print(f"  - Email: {admin_user.email}")
                print(f"  - Name: {admin_user.name}")
                print(f"  - Role: {admin_user.role}")
                print(f"  - Is Superuser: {admin_user.is_superuser}")
                print(f"  - Is Active: {admin_user.is_active}")
                print(f"  - Password Hash: {admin_user.password_hash[:50]}...")
            else:
                print("❌ admin@caffeine.com 계정이 RDS에 없습니다!")
                print("   슈퍼유저 계정을 생성해야 합니다.")
                
            # 전체 사용자 수 확인
            result = await db.execute(select(User))
            all_users = result.scalars().all()
            print(f"\n📊 총 사용자 수: {len(all_users)}")
            for user in all_users:
                print(f"  - {user.email} ({user.role})")
                
        except Exception as e:
            print(f"❌ 오류 발생: {e}")
            import traceback
            traceback.print_exc()
        finally:
            break

if __name__ == "__main__":
    asyncio.run(check_admin())
