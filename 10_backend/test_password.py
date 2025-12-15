"""
비밀번호 검증 테스트
"""
import asyncio
from passlib.context import CryptContext
from sqlalchemy import select
from app.db.database import init_db, get_db
from app.db.model.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def test_password():
    # DB 연결 초기화
    await init_db()
    
    async for db in get_db():
        try:
            # admin@caffeine.com 계정 조회
            result = await db.execute(
                select(User).where(User.email == "admin@caffeine.com")
            )
            admin_user = result.scalar_one_or_none()
            
            if admin_user:
                print("🔐 비밀번호 검증 테스트")
                print(f"Hash in DB: {admin_user.password_hash}")
                
                # 'secret' 비밀번호 테스트
                test_password = "secret"
                is_valid = pwd_context.verify(test_password, admin_user.password_hash)
                
                if is_valid:
                    print(f"✅ 비밀번호 '{test_password}' 일치!")
                else:
                    print(f"❌ 비밀번호 '{test_password}' 불일치!")
                    print("\n🔍 다른 비밀번호를 테스트해보세요:")
                    print("   - 비밀번호가 다를 수 있습니다.")
                    
                    # init_db_reset.sql의 해시로 테스트
                    sql_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"
                    print(f"\n   init_db_reset.sql 해시: {sql_hash}")
                    print(f"   RDS 실제 해시:          {admin_user.password_hash}")
                    print(f"\n   해시 일치 여부: {sql_hash == admin_user.password_hash}")
            else:
                print("❌ admin@caffeine.com 계정 없음")
                
        except Exception as e:
            print(f"❌ 오류: {e}")
            import traceback
            traceback.print_exc()
        finally:
            break

if __name__ == "__main__":
    asyncio.run(test_password())
