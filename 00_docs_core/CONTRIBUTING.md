# 기여 가이드 (Contributing Guide)

## 개발 환경 설정

### 필수 요구사항
- Docker, Docker Compose
- Node.js 18+
- Python 3.10+
- Git

### 초기 설정

    # 1. 저장소 클론
    git clone <repository-url>
    cd caffeine

    # 2. 환경 변수 설정
    cp .env.example .env
    cp 10_backend/.env.example 10_backend/.env

    # 3. 개발 환경 시작
    ./scripts/start.sh

    # 4. 프론트엔드 개발 서버
    cd 20_frontend_user
    npm install
    npm start

## 프로젝트 구조

| 폴더 | 설명 | 기술 스택 |
|------|------|----------|
| 10_backend | 메인 백엔드 API | FastAPI, SQLAlchemy |
| 20_frontend_user | 사용자 앱 | React Native (Expo) |
| 21_frontend_admin | 관리자 대시보드 | Next.js |
| 40_ml_next | 소비 예측 ML | Python, XGBoost |
| 41_ml_fraud | 이상거래 탐지 | Python |
| 50_llm_category | LLM 카테고리 분류 | Python, Gemini |
| 51_llm_analysis | LLM 분석 | Python, Gemini |

## 브랜치 전략

    main          # 프로덕션 브랜치
     develop   # 개발 브랜치
         feature/기능명   # 새 기능
         fix/버그명       # 버그 수정
         refactor/대상    # 리팩토링

## 커밋 메시지 규칙

    feat: 새로운 기능 추가
    fix: 버그 수정
    docs: 문서 변경
    style: 코드 포맷팅 (동작 변경 없음)
    refactor: 코드 리팩토링
    test: 테스트 추가/수정
    chore: 빌드, 설정 변경

예시:
    feat: 쿠폰 자동 발급 기능 추가
    fix: 거래내역 페이지네이션 오류 수정

## 코드 스타일

### Python (백엔드)
- PEP 8 준수
- 함수/메서드에 타입 힌트 사용
- Docstring 작성

### JavaScript/TypeScript (프론트엔드)
- ESLint + Prettier 사용
- 컴포넌트명: PascalCase
- 함수명: camelCase

## Pull Request 가이드

### PR 체크리스트
- [ ] 코드 스타일 준수
- [ ] 테스트 통과
- [ ] 문서 업데이트 (필요시)
- [ ] 충돌 해결

## 주요 API 엔드포인트

| 엔드포인트 | 설명 |
|------------|------|
| GET /health | 헬스체크 |
| GET /api/transactions | 거래내역 조회 |
| POST /api/transactions | 거래 추가 |
| GET /api/coupons | 쿠폰 목록 |
| POST /api/coupons/generate-from-prediction | 예측 기반 쿠폰 생성 |
| POST /api/chat/ | 챗봇 대화 |
| POST /ml/predict | ML 예측 |

## 문의

문제가 있으면 이슈를 생성하거나 팀 채널에 문의해주세요.
