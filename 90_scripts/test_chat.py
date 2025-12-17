import requests
import json

url = "http://localhost:8001/api/chat/"
headers = {"Content-Type": "application/json"}
data = {
    "message": "커피를 너무 많이 마셨어", 
    "naggingLevel": "상"
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print("Response:", response.text)
except Exception as e:
    print(f"Error: {e}")
