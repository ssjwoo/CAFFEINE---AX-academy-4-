from datetime import datetime, timedelta
from typing import Any, Dict
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from fastapi import HTTPException, status
from app.core.settings import settings


#액세스 토큰 생성
def create_access_token(data: Dict[str, Any], expires_minutes: int | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes or settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


#리프레시 토큰 생성
def create_refresh_token(data: Dict[str, Any], expires_days: int | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=expires_days or settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


#토큰 디코드
def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


#토큰 검증
def verify_access_token(token: str) -> Dict[str, Any]:
    try:
        # JWT 디코딩
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except (ExpiredSignatureError, JWTError):
        # JWT 관련 오류만 401로 처리
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


#리프레시 토큰 여부 확인
def is_refresh_token(token_payload: Dict[str, Any]) -> bool:
    return token_payload.get("type") == "refresh"
