#!/bin/bash
# Caffeine 프로젝트 종료 스크립트

echo '=== Caffeine 개발 환경 종료 ==='

cd /root/caffeine
docker-compose down

echo '=== 종료 완료 ==='
