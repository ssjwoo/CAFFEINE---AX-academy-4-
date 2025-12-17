#!/bin/bash
# Caffeine 전체 시스템 시작 (백엔드 + 프론트엔드)

echo '=== Caffeine 전체 시스템 시작 ==='

# 1. Docker 시작
cd /root/caffeine
docker-compose up -d

# 2. 상태 확인
sleep 5
docker-compose ps

# 3. 프론트엔드 시작
echo ''
echo '[프론트엔드 시작] http://localhost:8081'
cd /root/caffeine/20_frontend_user
npm start
