"""
AdminSettings 테이블을 RDS에 생성하는 스크립트
"""
import asyncio
from app.db.database import init_db, get_engine
from app.db.model.admin_settings import AdminSettings
from app.db.database import Base

async def create_admin_settings_table():
    # DB 연결 초기화
    await init_db()
    engine = get_engine()
    
    try:
        print("📊 AdminSettings 테이블 생성 중...")
        
        # AdminSettings 모델만 테이블 생성
        async with engine.begin() as conn:
            # AdminSettings 테이블만 생성
            await conn.run_sync(AdminSettings.__table__.create, checkfirst=True)
        
        print("✅ AdminSettings 테이블 생성 완료!")
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_admin_settings_table())
