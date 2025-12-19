from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
from datetime import datetime
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 로거 설정 (라이트 Audit 로그)
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

# Rate Limiter 초기화 (slowapi)
limiter = Limiter(key_func=get_remote_address)

# FastAPI 앱 생성
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

# CORS 설정 (Cross-Origin Resource Sharing)
CLOUDFRONT_URL = "https://d26uyg5darllja.cloudfront.net"

LOCAL_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8001",
    "http://localhost:8082",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:19000",
    "http://localhost:19006",
    # 127.0.0.1 variants
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8082",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:19000",
    "http://127.0.0.1:19006"
]

allowed_origins = LOCAL_ORIGINS + [CLOUDFRONT_URL]


# 보안 헤더 미들웨어
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """
    모든 응답에 보안 헤더를 추가하는 미들웨어
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# 라이트 Audit 로그 미들웨어
@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    """
    모든 HTTP 요청/응답을 로깅하는 미들웨어
    """
    start_time = datetime.utcnow()
    
    # 요청 로깅
    audit_logger.info(
        f"Request: {request.method} {request.url.path} | "
        f"Client: {request.client.host if request.client else 'unknown'}"
    )
    
    # 실제 요청 처리
    response = await call_next(request)
    
    # 응답 로깅
    duration = (datetime.utcnow() - start_time).total_seconds()
    audit_logger.info(
        f"Response: {response.status_code} | Duration: {duration:.3f}s"
    )
    
    return response

# 기본 엔드포인트
@app.get("/")
async def root():
    return {
        "message": "Caffeine API v1.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
@limiter.limit("10/minute")
async def health(request: Request):
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat()
    }

# 라우터 등록
from app.routers import ml, analysis, transactions, user, auth, coupons, settings, reports, anomalies, user_analytics, analytics_demographics

# 라우터 포함
app.include_router(ml.router)
app.include_router(analysis.router)
app.include_router(transactions.router)
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(coupons.router)

# 관리자/분석 라우터 추가
app.include_router(user_analytics.router)
app.include_router(analytics_demographics.router)
app.include_router(settings.router)
app.include_router(reports.router)
app.include_router(anomalies.router)

# CORS 설정을 가장 마지막에 추가하여 outermost 레이어로 만듦
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 시작 / 종료 이벤트
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("Caffeine API started")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"CORS Allowed Origins: {allowed_origins}")
    
    # 데이터베이스 테이블 생성
    from app.services.db_init import ensure_database_and_tables
    await ensure_database_and_tables()
    
    # ML 모델 로드
    ml.load_model()
    
    # 스케줄러 시작 (reports용)
    from app.services.scheduler import start_scheduler
    start_scheduler()


@app.on_event("shutdown")
async def shutdown_event():
    # 스케줄러 종료
    from app.services.scheduler import shutdown_scheduler
    shutdown_scheduler()
    
    logger.info("Caffeine API stopped")
    logger.info("=" * 60)