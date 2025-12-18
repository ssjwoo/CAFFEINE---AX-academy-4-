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
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
from datetime import datetime
import os
from dotenv import load_dotenv

# ============================================================
# 환경 변수 로드
# ============================================================
# .env 파일에서 환경 변수를 읽어옵니다.
# DATABASE_URL, SECRET_KEY, ENCRYPTION_KEY 등이 포함되어야 합니다.
load_dotenv()

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

CLOUDFRONT_URL = "https://d26uyg5darllja.cloudfront.net"

LOCAL_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8001",
    "http://localhost:8081",  # Expo Web
    "http://localhost:8082",
    "http://localhost:8080",
    "http://localhost:19000",
    "http://localhost:19006",
    # 127.0.0.1 variants (same as localhost but treated as different origin by browsers)
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8081",  # Expo Web
    "http://127.0.0.1:8082",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:19000",
    "http://127.0.0.1:19006"
]

allowed_origins = LOCAL_ORIGINS + [CLOUDFRONT_URL]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 보안 헤더 미들웨어
# ============================================================
# 주로 Nginx에서 처리하지만, FastAPI 레벨에서도 백업으로 추가합니다.
# 이 헤더들은 XSS, Clickjacking 등의 공격을 방어하는 데 도움이 됩니다.
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """
    모든 응답에 보안 헤더를 추가하는 미들웨어
    
    추가되는 헤더:
    - X-Content-Type-Options: MIME 타입 스니핑 방지
    - X-Frame-Options: 클릭재킹 공격 방지 (iframe 차단)
    - X-XSS-Protection: XSS 공격 방지 (구형 브라우저용)
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# ============================================================
# 라이트 Audit 로그 미들웨어
# ============================================================
# 모든 HTTP 요청과 응답을 로깅하여 감사 추적을 가능하게 합니다.
# v1.0에서는 파일/콘솔에만 기록하고, v2.0+에서는 DB에 저장할 예정입니다.
@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    """
    모든 HTTP 요청/응답을 로깅하는 미들웨어
    
    로깅 내용:
    - 요청: HTTP 메서드, URL 경로, 클라이언트 IP
    - 응답: HTTP 상태 코드, 처리 시간
    
    로그 파일: audit.log (프로젝트 루트에 생성됨)
    """
    start_time = datetime.utcnow()
    
    # 요청 로깅 (요청이 들어올 때)
    audit_logger.info(
        f"Request: {request.method} {request.url.path} | "
        f"Client: {request.client.host if request.client else 'unknown'}"
    )
    
    # 실제 요청 처리
    response = await call_next(request)
    
    # 응답 로깅 (응답을 보낼 때)
    duration = (datetime.utcnow() - start_time).total_seconds()
    audit_logger.info(
        f"Response: {response.status_code} | Duration: {duration:.3f}s"
    )
    
    return response

# ============================================================
# 기본 엔드포인트
# ============================================================

@app.get("/")
async def root():
    """
    API 루트 엔드포인트
    
    API가 정상 작동 중인지 확인하고 문서 링크를 제공합니다.
    
    Returns:
        dict: API 상태 및 문서 링크
    """
    return {
        "message": "Caffeine API v1.0",
        "status": "running",
        "docs": "/docs",      # Swagger UI 문서
        "redoc": "/redoc"     # ReDoc 문서
    }

@app.get("/health")
@limiter.limit("10/minute")  # 분당 10회로 제한
async def health(request: Request):
    """
    헬스체크 엔드포인트 (Rate Limiting 적용 예시)
    
    이 엔드포인트는 slowapi Rate Limiting이 적용되어 있어
    동일 IP에서 분당 10회까지만 호출할 수 있습니다.
    
    모니터링 도구(Kubernetes, Docker 등)에서 주기적으로 호출하여
    API 서버의 정상 작동 여부를 확인하는 데 사용됩니다.
    
    Args:
        request: FastAPI Request 객체 (Rate Limiting에 필요)
    
    Returns:
        dict: 상태 및 현재 타임스탬프
    """
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================
# 라우터 등록
# ============================================================
from app.routers import ml, analysis, transactions, user, settings, reports, anomalies, user_analytics, analytics_demographics, coupons
from app.routers.chatbot import router as chatbot_router

# ML 예측 API (/ml/*)
app.include_router(ml.router)

# 소비 분석 API (/api/analysis/*)
app.include_router(analysis.router)

# 거래 내역 API (/api/transactions/*)
app.include_router(transactions.router)

# 사용자/인증 API (/users/*)
app.include_router(user.router)

# 관리자 사용자 분석 API (/api/admin/users/*)
app.include_router(user_analytics.router)

# 인구통계 분석 API (/api/analytics/demographics/*)
app.include_router(analytics_demographics.router)

# 관리자 설정 API (/api/admin/settings/*)
app.include_router(settings.router)

# 관리자 리포트 API (/api/admin/reports/*)
app.include_router(reports.router)

# 이상 거래 탐지 API (/api/anomalies/*)
app.include_router(anomalies.router)

# 챗봇 API (/api/chat/*)
app.include_router(chatbot_router)

# 쿠폰 API (/api/coupons/*)
app.include_router(coupons.router)


# ============================================================
# 시작 / 종료 이벤트
# ============================================================

@app.on_event("startup")
async def startup_event():
    """
    Application startup event handler
    """
    logger.info("=" * 60)
    logger.info("Caffeine API started")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"CORS Allowed Origins: {allowed_origins}")
    
    # ML 모델 로드
    ml.load_model()
    
    # 스케줄러 시작
    from app.services.scheduler import start_scheduler
    start_scheduler()
    
    # DB 연결 초기화
    from app.services.db_init import ensure_database_and_tables
    await ensure_database_and_tables()


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event handler
    """
    # 스케줄러 종료
    from app.services.scheduler import shutdown_scheduler
    shutdown_scheduler()
    
    logger.info("Caffeine API stopped")
    logger.info("=" * 60)