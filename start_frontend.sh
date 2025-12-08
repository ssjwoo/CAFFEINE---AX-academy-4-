#!/bin/bash

# Caffeine 프론트엔드 실행 스크립트

echo "======================================"
echo "  Caffeine 프론트엔드 앱 시작"
echo "======================================"

# 프론트엔드 디렉토리로 이동
cd /root/caffeine/20_frontend_user

# Node 모듈 설치 여부 확인
if [ ! -d "node_modules" ]; then
    echo "📦 Node 패키지 설치 중..."
    npm install
fi

# Expo 서버 실행
echo "🚀 Expo 개발 서버 시작 중..."
echo "   Metro Bundler가 실행됩니다."
echo "   QR 코드를 스캔하거나 웹 브라우저로 접속하세요."
echo ""

npm start
