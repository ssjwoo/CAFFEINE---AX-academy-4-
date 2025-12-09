<<<<<<< HEAD
<<<<<<< HEAD
# 01_backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 설정 ----------------------------------------------------
# 개발 단계에서는 * 로 열어두고, 배포 후에는 도메인만 허용하는 게 좋음.
origins = [
    "http://localhost:5173",  # 04_app_front Vite dev 서버
    "http://localhost:5174",  # 05_admin_front Vite dev 서버 (포트는 팀에서 통일하기)
    "http://localhost",       # nginx 경유 접근 (로컬)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # 필요하다면 ["*"] 로 개발 중 전체 허용해도 됨
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------------------------------------------------

# ---------------- DUMMY DATA!! 나중에 삭제 --------------------
dummy_users = [
    {"id": 1, "name": "홍길동", "email": "test1@example.com"},
    {"id": 2, "name": "김철수", "email": "test2@example.com"},
]

dummy_transactions = [
    {"id": 1, "user_id": 1, "category": "식비", "amount": 12000},
    {"id": 2, "user_id": 2, "category": "쇼핑", "amount": 50000},
]
# -------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/users")
def get_users():
    # 🚨 DUMMY DATA!! 나중에 DB 연동되면 교체
    return dummy_users


@app.get("/transactions")
def get_transactions():
    # 🚨 DUMMY DATA!! 나중에 DB 연동되면 교체
    return dummy_transactions
=======
# 10_backend/app/main.py
"""
Caffeine Backend API (v1.0)

이 파일은 FastAPI 애플리케이션의 메인 진입점입니다.

✅ 실제 구현 보안 기능 (v1.0):
- JWT 인증 + 라이트 RBAC (user/admin 역할 구분)
- slowapi Rate Limiting (API 요청 속도 제한)
- 부분적 PII 암호화 (카드번호, 전화번호만)
- 라이트 Audit 로그 (파일/콘솔 기반 간단한 로깅)
- HTTPS + 보안 헤더 (Nginx와 함께 사용)

📋 추후 확장 예정 (v2.0+):
- JWT 블랙리스트 (로그아웃 시 토큰 무효화)
- 풀스펙 Audit 시스템 (데이터베이스 기반 영구 로그)
- 복잡한 보안 정책 문서

작성일: 2025-12-03
버전: 1.0.0
"""

from fastapi import FastAPI, Request
=======
# 01_backend/app/main.py
from fastapi import FastAPI
>>>>>>> origin/front-sjw
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

<<<<<<< HEAD
# ============================================================
# 로거 설정 (라이트 Audit 로그)
# ============================================================
# v1.0에서는 파일과 콘솔에 간단히 로깅만 수행합니다.
# 모든 HTTP 요청/응답이 audit.log 파일과 콘솔에 기록됩니다.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('audit.log'),  # 파일 로깅
        logging.StreamHandler()             # 콘솔 로깅
    ]
)
logger = logging.getLogger(__name__)
audit_logger = logging.getLogger('audit')  # Audit 전용 로거

# ============================================================
# Rate Limiter 초기화 (slowapi)
# ============================================================
# slowapi를 사용하여 API 엔드포인트별 요청 속도를 제한합니다.
# 기본적으로 클라이언트 IP 주소를 기준으로 제한합니다.
limiter = Limiter(key_func=get_remote_address)

# ============================================================
# FastAPI 앱 생성
# ============================================================
app = FastAPI(
    title="Caffeine API",
    description="AI 기반 스마트 금융 관리 앱 백엔드 API",
    version="1.0.0",
    docs_url="/docs",      # Swagger UI
    redoc_url="/redoc"     # ReDoc
)

# Rate Limiter를 앱 상태에 연결
app.state.limiter = limiter
# Rate Limit 초과 시 에러 핸들러 등록
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================================
# CORS 설정 (Cross-Origin Resource Sharing)
# ============================================================
# 프론트엔드 도메인에서 API에 접근할 수 있도록 허용합니다.
# .env 파일의 ALLOWED_ORIGINS에서 쉼표로 구분된 도메인 목록을 읽습니다.
# 예: ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:8081
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8081,http://localhost:8080,http://localhost:19000,http://localhost:19006").split(",")
=======
# CORS 설정 ----------------------------------------------------
# 개발 단계에서는 * 로 열어두고, 배포 후에는 도메인만 허용하는 게 좋음.
origins = [
    "http://localhost:5173",  # 04_app_front Vite dev 서버
    "http://localhost:5174",  # 05_admin_front Vite dev 서버 (포트는 팀에서 통일하기)
    "http://localhost",       # nginx 경유 접근 (로컬)
]
>>>>>>> origin/front-sjw

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # 필요하다면 ["*"] 로 개발 중 전체 허용해도 됨
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------------------------------------------------

# ---------------- DUMMY DATA!! 나중에 삭제 --------------------
dummy_users = [
    {"id": 1, "name": "홍길동", "email": "test1@example.com"},
    {"id": 2, "name": "김철수", "email": "test2@example.com"},
]

dummy_transactions = [
    {"id": 1, "user_id": 1, "category": "식비", "amount": 12000},
    {"id": 2, "user_id": 2, "category": "쇼핑", "amount": 50000},
]
# -------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok"}

<<<<<<< HEAD
# ============================================================
# 라우터 등록
# ============================================================
from app.routers import ml
app.include_router(ml.router)
=======
>>>>>>> origin/front-sjw

@app.get("/users")
def get_users():
    # 🚨 DUMMY DATA!! 나중에 DB 연동되면 교체
    return dummy_users

<<<<<<< HEAD
@app.on_event("startup")
async def startup_event():
    """
    애플리케이션 시작 시 실행되는 이벤트 핸들러
    """
    logger.info("=" * 60)
    logger.info("🚀 Caffeine API 시작됨")
    logger.info(f"환경: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"CORS 허용 도메인: {allowed_origins}")
    
    # ML 모델 로드
    ml.load_model()
    
    logger.info("=" * 60)

@app.on_event("shutdown")
async def shutdown_event():
    """
    애플리케이션 종료 시 실행되는 이벤트 핸들러
    
    주요 작업:
    - 종료 로그 기록
    - 데이터베이스 연결 종료 (추후 추가)
    - 리소스 정리 (추후 추가)
    """
    logger.info("=" * 60)
    logger.info("🛑 Caffeine API 종료됨")
    logger.info("=" * 60)

# ============================================================
# 추후 확장 예정 (v2.0+)
# ============================================================
# 다음 기능들은 v2.0 이후 버전에서 구현될 예정입니다:
#
# 1. JWT 블랙리스트 (토큰 리보크)
#    - 로그아웃 시 토큰을 블랙리스트에 추가
#    - Redis 또는 DB 기반 블랙리스트 관리
#    - 토큰 검증 시 블랙리스트 확인
#
# 2. 풀스펙 Audit 시스템 (DB 기반)
#    - audit_logs 테이블에 모든 작업 영구 저장
#    - 상세한 변경 이력 추적 (Before/After 값)
#    - 관리자 대시보드에서 로그 조회/검색
#
# 3. 복잡한 보안 정책 문서
#    - 데이터 분류 체계 (Public/Internal/Confidential/Restricted)
#    - 접근 제어 매트릭스 (Role별 권한 상세 정의)
#    - 사고 대응 절차 (Incident Response Plan)
>>>>>>> origin/develop-psh
=======

@app.get("/transactions")
def get_transactions():
    # 🚨 DUMMY DATA!! 나중에 DB 연동되면 교체
    return dummy_transactions
>>>>>>> origin/front-sjw
