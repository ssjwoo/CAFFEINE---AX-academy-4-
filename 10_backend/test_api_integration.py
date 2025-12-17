"""
통합 테스트: 주요 API 엔드포인트 검증
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_endpoint():
    """Health 엔드포인트 테스트"""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    print("✅ Health 엔드포인트 정상")

def test_chatbot_endpoint():
    """챗봇 API 테스트"""
    payload = {
        "message": "커피를 너무 많이 마셨어",
        "naggingLevel": "상"
    }
    response = requests.post(f"{BASE_URL}/api/chat/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    print(f"✅ 챗봇 API 정상: {data['reply'][:50]}...")

def test_docs_endpoint():
    """API 문서 접근 테스트"""
    response = requests.get(f"{BASE_URL}/docs")
    assert response.status_code == 200
    assert "swagger" in response.text.lower()
    print("✅ API 문서 접근 정상")

if __name__ == "__main__":
    print("=== 백엔드 API 통합 테스트 시작 ===\n")
    
    try:
        test_health_endpoint()
        test_chatbot_endpoint()
        test_docs_endpoint()
        print("\n🎉 모든 테스트 통과!")
    except AssertionError as e:
        print(f"\n❌ 테스트 실패: {e}")
    except Exception as e:
        print(f"\n❌ 에러 발생: {e}")
