#!/bin/bash

# Caffeine 백엔드 실행 스크립트

echo "======================================"
echo "  Caffeine 백엔드 서버 시작"
echo "======================================"

# 백엔드 디렉토리로 이동
cd /root/caffeine/10_backend

# Python 가상환경 활성화 (있는 경우)
if [ -d "venv" ]; then
    echo "✅ Python 가상환경 활성화 중..."
    source venv/bin/activate
fi

# 필요한 패키지 설치 여부 확인
if [ ! -d ".venv_installed" ]; then
    echo "📦 필요한 패키지 설치 중..."
    pip install -r requirements.txt
    mkdir -p .venv_installed
fi

# FastAPI 서버 실행
echo "🚀 FastAPI 서버 시작 중..."
echo "   URL: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo ""

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
