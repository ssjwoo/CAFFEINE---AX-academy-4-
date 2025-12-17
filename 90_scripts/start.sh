#!/bin/bash
# Caffeine 프로젝트 시작 스크립트

echo '=== Caffeine 개발 환경 시작 ==='

# 1. Docker 컨테이너 시작
echo '[1/3] Docker 컨테이너 시작...'
cd /root/caffeine
docker-compose up -d

# 2. 컨테이너 상태 확인
echo '[2/3] 컨테이너 상태 확인...'
sleep 5
docker-compose ps

# 3. 백엔드 헬스체크
echo '[3/3] 백엔드 헬스체크...'
sleep 3
curl -s http://localhost:8001/health && echo ''

echo ''
echo '=== 시작 완료 ==='
echo 'Backend API: http://localhost:8001'
echo 'API Docs: http://localhost:8001/docs'
echo ''
echo '프론트엔드 실행: cd 20_frontend_user && npm start'
