# Caffeine - AI 기반 스마트 금융 관리 앱

## 프로젝트 개요

Caffeine은 AI/ML 기술을 활용한 개인 금융 관리 서비스입니다.
소비 패턴 분석, 다음 소비 예측, 맞춤 쿠폰 발급 등의 기능을 제공합니다.

## 주요 기능

- 소비 패턴 분석: 카테고리별 지출 분석 및 시각화
- 다음 소비 예측: ML 모델 기반 다음 소비 카테고리 예측
- 맞춤 쿠폰 발급: 예측 결과에 따른 자동 쿠폰 발급 (만료: 3일)
- AI 챗봇: Gemini API 기반 금융 상담
- 이상거래 탐지: 비정상 거래 패턴 감지

## 프로젝트 구조

caffeine/
 00_docs_core/          # 프로젝트 문서
 10_backend/            # FastAPI 백엔드 (메인 API)
 20_frontend_user/      # React Native 사용자 앱
 21_frontend_admin/     # Next.js 관리자 대시보드
 30_nginx/              # 웹 서버 설정
 40_ml_next/            # 다음 소비 예측 ML 서비스
 41_ml_fraud/           # 이상거래 탐지 서비스
 50_llm_category/       # LLM 카테고리 분류
 51_llm_analysis/       # LLM 소비 분석
 90_scripts/               # 개발 스크립트
 docker-compose.yml     # Docker 설정
 CONTRIBUTING.md        # 기여 가이드

## 빠른 시작

### 1. 환경 설정

    git clone <repository-url>
    cd caffeine
    cp .env.example .env
    cp 10_backend/.env.example 10_backend/.env
    # .env 파일에 실제 API 키 입력

### 2. 개발 환경 시작

    # 방법 1: 스크립트 사용
    ./90_scripts/start.sh

    # 방법 2: 수동 실행
    docker-compose up -d

### 3. 프론트엔드 실행

    cd 20_frontend_user
    npm install
    npm start
    # w 키를 눌러 웹 브라우저에서 실행

### 4. 종료

    ./90_scripts/stop.sh

## 개발 스크립트

| 스크립트 | 설명 |
|----------|------|
| 90_scripts/start.sh | Docker 백엔드 시작 |
| start-all.sh | 백엔드 + 프론트엔드 시작 |
| 90_scripts/stop.sh | Docker 컨테이너 종료 |
| 90_scripts/logs.sh | 백엔드 로그 확인 |

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| /health | GET | 서버 상태 확인 |
| /api/transactions | GET | 거래내역 조회 |
| /api/transactions | POST | 거래 추가 |
| /api/coupons | GET | 쿠폰 목록 |
| /api/coupons/generate-from-prediction | POST | 예측 기반 쿠폰 생성 |
| /api/chat/ | POST | AI 챗봇 대화 |
| /ml/predict | POST | ML 예측 |

## Docker 서비스

| 서비스 | 포트 | 설명 |
|--------|------|------|
| caf_backend | 8001 | 메인 백엔드 API |
| caf_db | 5434 | PostgreSQL |
| caf_ml_next | 9001 | ML 예측 서비스 |
| caf_ml_fraud | 9002 | 이상거래 탐지 |

## 문서

- 기여 가이드: CONTRIBUTING.md
- API 문서: http://localhost:8001/docs
- 트러블슈팅: TROUBLESHOOTING_BACKEND.md

## 기술 스택

Backend: FastAPI, SQLAlchemy, PostgreSQL, XGBoost, Gemini API
Frontend: React Native (Expo), Next.js
Infra: Docker, Docker Compose, Nginx, AWS RDS

## 라이선스

MIT License
