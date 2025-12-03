# 10_backend/README.md
# Caffeine Backend API (v1.0)

## 📋 개요

FastAPI 기반 백엔드 API 서버입니다.

### 실제 구현 보안 기능 (v1.0)

✅ **인증 & 권한**
- JWT 인증 시스템
- Role 기반 라이트 RBAC (user/admin)
- 비밀번호 해싱 (bcrypt)

✅ **보안 강화**
- HTTPS + 보안 헤더 (Nginx + FastAPI middleware)
- slowapi Rate Limiting
- 부분적 PII 암호화 (카드번호, 전화번호)

✅ **모니터링**
- 라이트 Audit 로그 (파일/콘솔)
- 요청/응답 기본 로깅

### 추후 확장 예정 (v2.0+)

📋 **고급 기능**
- JWT 블랙리스트 (토큰 리보크)
- 풀스펙 Audit 시스템 (DB 기반)
- 복잡한 보안 정책 문서

---

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Windows)
.\venv\Scripts\activate

# 가상환경 활성화 (Mac/Linux)
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt
```

### 2. 환경 변수 설정

```bash
# .env.example을 .env로 복사
cp .env.example .env

# .env 파일 수정 (SECRET_KEY, ENCRYPTION_KEY, DATABASE_URL 등)
```

**암호화 키 생성**:
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```

### 3. 서버 실행

```bash
# 개발 모드 (자동 리로드)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 프로덕션 모드
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. API 문서 확인

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 📁 프로젝트 구조

```
10_backend/
├── app/
│   ├── main.py              # 메인 애플리케이션
│   ├── core/                # 핵심 기능
│   │   ├── security.py      # 보안 (JWT, 암호화, RBAC)
│   │   └── dependencies.py  # FastAPI 의존성
│   ├── routes/              # API 라우터 (추후 추가)
│   ├── models/              # DB 모델 (추후 추가)
│   └── schemas/             # Pydantic 스키마 (추후 추가)
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md
```

---

## 🔒 보안 기능 사용법

### JWT 인증

```python
from app.core.dependencies import get_current_user, get_current_admin

# 로그인 필요
@app.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}

# 관리자 권한 필요
@app.get("/admin/dashboard")
async def admin_dashboard(admin: dict = Depends(get_current_admin)):
    return {"message": "관리자 페이지"}
```

### Rate Limiting

```python
from slowapi import Limiter
from fastapi import Request

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/data")
@limiter.limit("10/minute")  # 분당 10회 제한
async def get_data(request: Request):
    return {"data": "..."}
```

### PII 암호화

```python
from app.core.security import encrypt_card_number, encrypt_phone_number

# 카드번호 암호화
card_data = encrypt_card_number("1234567812345678")
# {"masked": "****-****-****-5678", "encrypted": "..."}

# 전화번호 암호화
encrypted_phone = encrypt_phone_number("010-1234-5678")
```

---

## 🔧 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | - |
| `SECRET_KEY` | JWT 서명 키 | - |
| `ENCRYPTION_KEY` | Fernet 암호화 키 | - |
| `ALLOWED_ORIGINS` | CORS 허용 도메인 | localhost |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT 만료 시간 | 30 |
| `ENVIRONMENT` | 환경 (development/production) | development |

---

## 📝 다음 단계

1. **데이터베이스 연결**
   - SQLAlchemy 모델 정의
   - Alembic 마이그레이션 설정

2. **API 라우터 구현**
   - 인증 (로그인/회원가입)
   - 거래 내역
   - 이상 거래
   - 쿠폰

3. **ML 모델 통합**
   - 다음 구매 예측
   - 사기 탐지

4. **테스트 작성**
   - pytest 단위 테스트
   - API 통합 테스트

---

**작성일**: 2025-12-03  
**버전**: 1.0.0
