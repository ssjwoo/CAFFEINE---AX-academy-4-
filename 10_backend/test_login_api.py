import requests

# 로그인 API 테스트
url = "http://localhost:8081/users/login"
data = {
    "username": "admin@caffeine.com",
    "password": "secret"
}

print("="*60)
print("🔍 로그인 API 테스트")
print(f"URL: {url}")
print(f"Email: {data['username']}")
print(f"Password: {data['password']}")
print("="*60)

try:
    response = requests.post(
        url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    print(f"\n✅ Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"\nResponse Body:")
    print(response.text)
    
    if response.status_code == 200:
        print("\n✅ 로그인 성공!")
        json_data = response.json()
        print(f"Access Token: {json_data.get('access_token', 'N/A')[:50]}...")
        print(f"Token Type: {json_data.get('token_type', 'N/A')}")
    else:
        print(f"\n❌ 로그인 실패!")
        
except Exception as e:
    print(f"\n❌ 에러 발생: {e}")
    import traceback
    traceback.print_exc()
