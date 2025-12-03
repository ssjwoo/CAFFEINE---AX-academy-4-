# 10_backend/app/core/dependencies.py
"""
FastAPI 의존성 주입 (Dependency Injection) 모듈

이 모듈은 FastAPI의 Depends 시스템을 사용하여
인증 및 권한 확인을 수행하는 재사용 가능한 의존성 함수들을 제공합니다.

주요 의존성:
- get_current_user: JWT 토큰 검증 후 사용자 정보 반환
- get_current_admin: 관리자 권한 확인
- require_role: 특정 역할 요구 (데코레이터)

사용 예시:
    @app.get("/protected")
    async def protected_route(user = Depends(get_current_user)):
        return {"user": user}
    
    @app.get("/admin/dashboard")
    async def admin_dashboard(admin = Depends(get_current_admin)):
        return {"message": "관리자 페이지"}

작성일: 2025-12-03
버전: 1.0.0
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from .security import verify_token, check_role

# ============================================================
# HTTP Bearer 인증 스키마
# ============================================================
# FastAPI가 자동으로 Authorization 헤더에서 Bearer 토큰을 추출합니다.
# 예: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
security = HTTPBearer()

# ============================================================
# 현재 사용자 정보 가져오기 (JWT 검증)
# ============================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    JWT 토큰을 검증하고 현재 로그인한 사용자 정보를 반환합니다.
    
    이 함수는 FastAPI의 Depends로 사용되어 보호된 엔드포인트에서
    자동으로 사용자 인증을 수행합니다.
    
    동작 과정:
    1. Authorization 헤더에서 Bearer 토큰 추출
    2. JWT 토큰 검증 (서명, 만료 시간 확인)
    3. 토큰이 유효하면 페이로드(사용자 정보) 반환
    4. 토큰이 무효하면 401 Unauthorized 에러
    
    Args:
        credentials: FastAPI가 자동으로 주입하는 Bearer 토큰
    
    Returns:
        dict: 사용자 정보 (예: {"sub": "user@example.com", "role": "user"})
    
    Raises:
        HTTPException: 토큰이 유효하지 않으면 401 에러
    
    사용 예시:
        @app.get("/me")
        async def get_me(current_user: dict = Depends(get_current_user)):
            return {"email": current_user["sub"], "role": current_user["role"]}
    """
    # Bearer 토큰 추출
    token = credentials.credentials
    
    # JWT 토큰 검증
    payload = verify_token(token)
    
    # 토큰이 유효하지 않은 경우
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다",
            headers={"WWW-Authenticate": "Bearer"},  # 클라이언트에게 인증 방법 힌트
        )
    
    # 토큰이 유효하면 페이로드 반환
    return payload

# ============================================================
# 관리자 권한 확인 (라이트 RBAC)
# ============================================================

async def get_current_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    관리자 권한을 확인하는 의존성 함수입니다.
    
    이 함수는 먼저 get_current_user를 호출하여 사용자 인증을 수행하고,
    그 다음 사용자의 역할(role)이 'admin'인지 확인합니다.
    
    동작 과정:
    1. get_current_user로 JWT 검증 (사용자 인증)
    2. 사용자의 role 확인
    3. role이 'admin'이 아니면 403 Forbidden 에러
    4. 'admin'이면 사용자 정보 반환
    
    Args:
        current_user: get_current_user가 반환한 사용자 정보
    
    Returns:
        dict: 관리자 사용자 정보
    
    Raises:
        HTTPException: 관리자가 아니면 403 에러
    
    사용 예시:
        @app.get("/admin/users")
        async def list_all_users(admin: dict = Depends(get_current_admin)):
            # 관리자만 모든 사용자 목록 조회 가능
            return {"users": [...]}
    """
    # 사용자의 역할 가져오기 (기본값: "user")
    user_role = current_user.get("role", "user")
    
    # 라이트 RBAC로 admin 권한 확인
    if not check_role(user_role, "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다"
        )
    
    # 관리자 권한이 있으면 사용자 정보 반환
    return current_user

# ============================================================
# 특정 역할 요구 (선택적 고급 기능)
# ============================================================

def require_role(required_role: str):
    """
    특정 역할을 요구하는 의존성 함수를 생성하는 팩토리 함수입니다.
    
    이 함수는 다양한 역할 수준에 대해 재사용 가능한 의존성을 만들 수 있습니다.
    v1.0에서는 user/admin만 있지만, v2.0+에서 역할이 늘어나면 유용합니다.
    
    (예: manager, supervisor, analyst 등)
    
    Args:
        required_role: 요구되는 최소 역할 ("user", "admin" 등)
    
    Returns:
        function: FastAPI Depends에서 사용할 수 있는 의존성 함수
    
    사용 예시:
        # v2.0+에서 manager 역할이 추가된 경우
        @app.get("/reports")
        async def get_reports(user = Depends(require_role("manager"))):
            # manager 이상만 접근 가능
            return {"reports": [...]}
        
        # v1.0에서는 get_current_admin과 동일하게 사용
        @app.get("/admin/settings")
        async def admin_settings(user = Depends(require_role("admin"))):
            return {"settings": {...}}
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        """
        내부 역할 검사 함수
        
        JWT 인증 후 사용자의 역할이 요구 역할을 만족하는지 확인합니다.
        
        Args:
            current_user: get_current_user가 반환한 사용자 정보
        
        Returns:
            dict: 권한이 충분한 사용자 정보
        
        Raises:
            HTTPException: 권한이 부족하면 403 에러
        """
        user_role = current_user.get("role", "user")
        
        # check_role 함수로 권한 확인
        if not check_role(user_role, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{required_role} 권한이 필요합니다"
            )
        
        return current_user
    
    return role_checker

# ============================================================
# 추가 의존성 (추후 구현 예정)
# ============================================================
# v2.0+에서 추가할 수 있는 의존성 함수들:
#
# 1. get_db(): 데이터베이스 세션 제공
#    - SQLAlchemy 세션을 요청마다 생성/종료
#
# 2. check_rate_limit(): 사용자별 Rate Limiting
#    - get_current_user와 결합하여 사용자별 요청 제한
#
# 3. verify_refresh_token(): Refresh 토큰 검증
#    - Access 토큰 재발급을 위한 Refresh 토큰 검증
#
# 4. get_current_active_user(): 활성 사용자만 허용
#    - is_active = False인 사용자 차단
