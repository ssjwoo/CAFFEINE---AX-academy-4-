 README.md (팀원 실행 가이드 완성본)

<<<<<<< HEAD
복사 → 프로젝트 루트에 README.md 로 저장하면 끝!
=======
복사  프로젝트 루트에 README.md 로 저장하면 끝
>>>>>>> develop-psh

 CAF_FI 프로젝트 개발 환경 구성 가이드

(팀원용 · 로컬에서 전체 시스템 실행 가능)

 1. 현재 프로젝트 구조
```
CAF_FI/
├── 00_docs_core/              # 문서, ERD, API 명세 등
│   └── .gitkeep
│
├── 10_backend/                # FastAPI 백엔드
│   ├── app/
│   │   ├── core/              # 환경설정, 보안, 미들웨어
│   │   ├── db/
│   │   │   ├── crud/          # CRUD 로직
│   │   │   ├── model/         # SQLAlchemy 모델
│   │   │   └── schema/        # Pydantic 스키마
│   │   ├── routers/           # API 라우터
│   │   ├── services/          # 비즈니스 로직
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── 20_frontend_user/          # 사용자용 React 웹
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── 21_frontend_admin/         # 관리자용 React 웹
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── 30_nginx/                  # Reverse Proxy + API Gateway
│   ├── default.conf
│   └── Dockerfile
│
├── 40_ml_next/                # 다음 소비 예측 모델 서버
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── 41_ml_fraud/               # 이상거래 탐지 모델 서버
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── 50_llm_category/           # LLM 카테고리 자동 분류 서버 (외부 LLM 호출)
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── 51_llm_analysis/           # LLM 소비 분석/요약 API
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── 52_llm_cleo/               # (옵션) Cleo-like 대화형 LLM 서버
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
│
└── docker-compose.yml         # 전체 서비스 로컬 실행 orchestration
```
 2. 팀원이 따라할 전체 실행 절차
 Step 1. 프로젝트 클론

팀원 PC에서:

git clone https://github.com/your-team-repo/caffeine.git
cd caffeine


 개인 깃허브에서 팀 레포로 옮기면 여기 URL만 변경하면 됨

 Step 2. (선택) Node / Python 설치

팀 전체가 버전 통일하도록 권장:

NodeJS 20.x

React 프런트엔드 실행용

Python 3.10.x

FastAPI + ML 서버 실행용

 Step 3. Docker Desktop 설치

프로젝트는 무조건 Docker 기반으로 실행됨.

설치 후 실행:
https://www.docker.com/products/docker-desktop/

Docker 엔진이 꺼져 있으면 docker-compose 실행 불가

 Step 4. 전체 서비스 실행

프로젝트 루트(caffeine/)에서:

docker-compose up --build


 실행되면 자동으로 아래 서버가 생성됨:

| 서비스 이름 | URL | 설명 |
|------------|-----|------|
| **Backend (FastAPI)** | http://localhost:8000/docs | 백엔드 API |
| **User Front (React)** | http://localhost:3000 | 사용자 웹앱 |
| **Admin Front (React)** | http://localhost:3001 | 관리자 웹앱 |
| **ML Next** | http://localhost:9001/docs | 다음 소비 예측 모델 |
| **ML Fraud** | http://localhost:9002/docs | 이상 결제 탐지 모델 |
| **LLM Category** | http://localhost:9011/docs | LLM 기반 MCC/카테고리 분류 |
| **LLM Analysis** | http://localhost:9012/docs | 소비 분석 LLM |
| **LLM Cleo (옵션)** | http://localhost:9013/docs | 대화형 챗봇/LLM |

---
 Step 5. 첫 실행 시 필요한 도커 이미지 자동 설치

docker-compose up --build 실행 시 자동으로:

python:3.10.18-slim 이미지 pull

node:20 이미지 pull

nginx:latest 이미지 pull

requirements.txt 패키지 설치

팀원이 따로 pip install 할 필요 없음.

 3. 서비스별 local.env (선택)

LLM 서버에서 실제 API 필요하면 추가:

파일 생성:

50_llm_category/.env
51_llm_analysis/.env
52_llm_cleo/.env


내용 예:

OPENAI_API_KEY=여기에키

 4. 개발 시 변경된 파일 반영 방법

코드를 수정하면:

1) 백엔드 / ML / LLM 서비스

 자동 reload 없음
 새로 빌드 필요:

docker-compose up --build

2) 프론트엔드 (React)

 수정 후 자동 반영됨 (vite hot reload)

 5. 팀 개발 워크플로우 (중요)
 Branch 전략
main   운영(Production)
develop  통합 개발 브랜치
feature/*  개인 작업 브랜치


예:

feature/login
feature/analysis-llm
feature/user-page


PR은 반드시 develop 으로 보내기.

 6. 더미 데이터 추가 (개발용)
백엔드에서만 사용되는 더미는

dummy_data/ 폴더를 만들어 두면 좋음:

예:

10_backend/app/dummy_data/users.json
10_backend/app/dummy_data/transactions.json


그리고 코드에는 반드시 주석 붙이기:

# TODO: [DUMMY_DATA] 개발용 더미 데이터. 실제 배포 시 제거 예정.

 7. 팀원이 반드시 지켜야 할 규칙

 Docker Desktop 켠 상태에서만 서버 구동
 docker-compose 로만 실행할 것
 각 서비스는 절대 개별 실행 금지
 LLM API 키는 절대 커밋 금지
 Git branch 전략 준수
 모델 파일(.pkl)은 S3 업로드 후 경로로 불러오기 (Git에 올리지 않음)
