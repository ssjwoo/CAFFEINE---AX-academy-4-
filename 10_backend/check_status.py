
import os
from dotenv import load_dotenv
import asyncio
import sys

# 프로젝트 루트 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import get_db

async def get_db_session():
    async for session in get_db():
        return session
from app.routers.reports import get_report_recipient_email

# .env 로드 시도
load_dotenv(override=True)

async def check_status():
    print("🔍 상태 점검 시작...")
    
    # 1. 환경 변수 확인
    dev_mode = os.getenv("DEVELOPMENT_MODE")
    print(f"🔹 DEVELOPMENT_MODE: {dev_mode} (Type: {type(dev_mode)})")
    
    if str(dev_mode).lower() == "true":
        print("✅ 개발 모드가 활성화되어 있습니다.")
    else:
        print("❌ 개발 모드가 활성화되지 않았습니다. .env 파일을 확인해주세요.")

    # 2. 수신자 이메일 설정 확인
    db = await get_db_session()
    try:
        email = await get_report_recipient_email(db)
        print(f"🔹 DB 수신자 이메일 설정: {email}")
        
        if email:
            print(f"✅ 수신자 이메일이 설정되어 있습니다: {email}")
        else:
            print("❌ 수신자 이메일이 설정되어 있지 않습니다!")
            print("   -> 관리자 페이지 > Settings > Notification Settings에서 이메일을 저장해주세요.")
            
    except Exception as e:
        print(f"❌ DB 확인 중 오류 발생: {e}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(check_status())
