import requests
import json

url = "http://127.0.0.1:8001/users/login"
data = {
    "email": "admin@caffeine.com",
    "password": "admin123"
}

try:
    response = requests.post(url, json=data, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
