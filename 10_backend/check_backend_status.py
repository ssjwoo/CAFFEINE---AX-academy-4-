import requests

print("="*60)
print("🔍 백엔드 상태 확인")
print("="*60)

# 1. Root endpoint 테스트
try:
    response = requests.get("http://localhost:8081/")
    print(f"\n1. Root Endpoint (GET /)")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"\n❌ Root endpoint 에러: {e}")

# 2. Health check 테스트
try:
    response = requests.get("http://localhost:8081/health")
    print(f"\n2. Health Check (GET /health)")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"\n❌ Health check 에러: {e}")

# 3. CORS 헤더 확인
try:
    response = requests.options(
        "http://localhost:8081/users/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        }
    )
    print(f"\n3. CORS Preflight (OPTIONS /users/login)")
    print(f"   Status: {response.status_code}")
    print(f"   CORS Headers:")
    for key, value in response.headers.items():
        if "access-control" in key.lower():
            print(f"     {key}: {value}")
except Exception as e:
    print(f"\n❌ CORS preflight 에러: {e}")

print("\n" + "="*60)
