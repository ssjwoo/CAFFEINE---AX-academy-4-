"""
Settings API 테스트 스크립트
"""
import asyncio
from sqlalchemy import select, text
from app.db.database import init_db, get_db
from app.db.model.admin_settings import AdminSettings

async def test_settings():
    # DB 연결 초기화
    await init_db()
    
    async for db in get_db():
        try:
            # AdminSettings 테이블 확인
            print("📊 AdminSettings 테이블 확인")
            result = await db.execute(
                select(AdminSettings)
            )
            all_settings = result.scalars().all()
            
            if all_settings:
                print(f"✅ 설정 항목 수: {len(all_settings)}")
                for setting in all_settings:
                    print(f"  - {setting.key}: {setting.value}")
            else:
                print("⚠️ AdminSettings 테이블이 비어있습니다.")
                print("   기본 설정을 생성해야 합니다.")
                
        except Exception as e:
            print(f"❌ 오류 발생: {e}")
            import traceback
            traceback.print_exc()
        finally:
            break

if __name__ == "__main__":
    asyncio.run(test_settings())
