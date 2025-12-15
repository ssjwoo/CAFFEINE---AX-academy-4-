
import os
import asyncio
import sys

# 프로젝트 루트 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.email_service import send_test_email

async def main():
    print("🧪 개발 모드 이메일 테스트 시작...")
    
    # 개발 모드 활성화
    os.environ["DEVELOPMENT_MODE"] = "true"
    print("✅ DEVELOPMENT_MODE=true 설정됨")
    
    try:
        # 테스트 이메일 발송
        success, message = await send_test_email("test@example.com")
        
        if success:
            print(f"✅ 성공: {message}")
        else:
            print(f"❌ 실패: {message}")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    asyncio.run(main())
