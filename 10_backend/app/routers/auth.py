from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Annotated
import httpx
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

from app.db.database import get_db
from app.db.model.user import User as UserModel
from app.db.schema.auth import Token
from app.core.jwt import create_access_token, create_refresh_token
from pydantic import BaseModel

# 라우터 설정
router = APIRouter(prefix="/auth", tags=["auth"])

DB_Dependency = Annotated[AsyncSession, Depends(get_db)]

# 카카오 API 설정
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY", "fa925a6646f9491a77eb9c8fd6537a21")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI", "http://localhost:8081/auth/kakao/callback")


# 요청/응답 스키마
class KakaoLoginRequest(BaseModel):
    """카카오 로그인 요청"""
    code: str


class KakaoUserResponse(BaseModel):
    """카카오 로그인 응답 - 사용자 정보"""
    id: int
    nickname: str
    email: str | None = None
    profile_image: str | None = None
    provider: str = "kakao"


class KakaoLoginResponse(BaseModel):
    """카카오 로그인 응답"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: KakaoUserResponse


# 소셜 ID로 유저 조회
async def get_user_by_social_id(db: AsyncSession, social_provider: str, social_id: str) -> UserModel | None:
    result = await db.execute(
        select(UserModel).where(
            UserModel.social_provider == social_provider,
            UserModel.social_id == social_id
        )
    )
    return result.scalar_one_or_none()


# 카카오 유저 생성 또는 조회
async def get_or_create_kakao_user(
    db: AsyncSession,
    kakao_id: int,
    nickname: str,
    email: str | None,
    profile_image: str | None
) -> UserModel:
    # 기존 유저 확인
    existing_user = await get_user_by_social_id(db, "KAKAO", str(kakao_id))
    
    if existing_user:
        # 마지막 로그인 시간 업데이트
        existing_user.last_login_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing_user)
        return existing_user
    
    # 신규 유저 생성
    new_user = UserModel(
        email=email or f"kakao_{kakao_id}@caffeine.app",
        password_hash="SOCIAL_LOGIN",  # 소셜 로그인은 비밀번호 없음
        name=nickname,
        nickname=nickname,
        role="USER",
        status="ACTIVE",
        social_provider="KAKAO",
        social_id=str(kakao_id),
        last_login_at=datetime.utcnow(),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


# 카카오 로그인
@router.post("/kakao", response_model=KakaoLoginResponse)
async def kakao_login(payload: KakaoLoginRequest, db: DB_Dependency):
    """
    카카오 소셜 로그인
    
    1. Authorization code로 access_token 교환
    2. 카카오 사용자 정보 조회
    3. DB에 사용자 저장/조회
    4. JWT 토큰 발급
    """
    try:
        # 1. Authorization code로 access_token 교환
        token_url = "https://kauth.kakao.com/oauth/token"
        token_data = {
            "grant_type": "authorization_code",
            "client_id": KAKAO_REST_API_KEY,
            "redirect_uri": KAKAO_REDIRECT_URI,
            "code": payload.code,
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                token_url,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"카카오 토큰 교환 실패: {token_response.text}"
                )
            
            token_json = token_response.json()
            kakao_access_token = token_json.get("access_token")
            
            # 2. Access token으로 사용자 정보 조회
            user_url = "https://kapi.kakao.com/v2/user/me"
            user_response = await client.get(
                user_url,
                headers={"Authorization": f"Bearer {kakao_access_token}"}
            )
            
            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="카카오 사용자 정보 조회 실패"
                )
            
            kakao_user = user_response.json()
            
            # 사용자 정보 추출
            kakao_account = kakao_user.get("kakao_account", {})
            profile = kakao_account.get("profile", {})
            
            kakao_id = kakao_user.get("id")
            nickname = profile.get("nickname", "카카오 사용자")
            email = kakao_account.get("email")
            profile_image = profile.get("profile_image_url")
            
            # 3. DB에 사용자 저장/조회
            db_user = await get_or_create_kakao_user(
                db=db,
                kakao_id=kakao_id,
                nickname=nickname,
                email=email,
                profile_image=profile_image
            )
            
            # 4. JWT 토큰 발급
            access_token = create_access_token(data={"sub": str(db_user.id)})
            refresh_token = create_refresh_token(data={"sub": str(db_user.id)})
            
            return KakaoLoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                user=KakaoUserResponse(
                    id=db_user.id,
                    nickname=db_user.nickname or db_user.name,
                    email=db_user.email,
                    profile_image=profile_image,
                    provider="kakao"
                )
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"카카오 로그인 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"카카오 로그인 처리 중 오류 발생: {str(e)}"
        )


# 카카오 콜백 (테스트용)
@router.get("/kakao/callback")
async def kakao_callback(code: str):
    """
    카카오 OAuth 콜백 (테스트용)
    
    브라우저에서 직접 접근 시 code를 확인할 수 있습니다.
    실제로는 프론트엔드에서 code를 받아 POST /auth/kakao로 전송합니다.
    """
    return {
        "message": "카카오 인증 코드 수신 완료",
        "code": code,
        "next_step": "이 코드를 POST /auth/kakao 엔드포인트로 전송하세요"
    }


# 아이디 찾기 / 비밀번호 재설정 API

import random
import string
from datetime import timedelta
from passlib.context import CryptContext
from app.core.email import send_verification_email, send_email_found_notification

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 인증 코드 저장소 (메모리 - 프로덕션에서는 Redis 권장)
# 형식: { "email": {"code": "123456", "expires": datetime} }
verification_codes: dict = {}


def generate_verification_code() -> str:
    """6자리 인증 코드 생성"""
    return ''.join(random.choices(string.digits, k=6))


def mask_email(email: str) -> str:
    """이메일 마스킹 (ex: te***@gmail.com)"""
    if not email or "@" not in email:
        return email
    
    local, domain = email.split("@")
    if len(local) <= 2:
        masked_local = local[0] + "***"
    else:
        masked_local = local[:2] + "***"
    
    return f"{masked_local}@{domain}"


# 요청 스키마
class FindEmailRequest(BaseModel):
    """아이디(이메일) 찾기 요청"""
    name: str
    phone: str


class FindEmailResponse(BaseModel):
    """아이디(이메일) 찾기 응답"""
    found: bool
    masked_email: str | None = None
    message: str


class RequestPasswordResetRequest(BaseModel):
    """비밀번호 재설정 요청 (인증 코드 발송)"""
    email: str


class VerifyCodeRequest(BaseModel):
    """인증 코드 확인 요청"""
    email: str
    code: str


class ResetPasswordRequest(BaseModel):
    """비밀번호 재설정 요청"""
    email: str
    code: str
    new_password: str


# 아이디(이메일) 찾기
@router.post("/find-email", response_model=FindEmailResponse)
async def find_email(request: FindEmailRequest, db: DB_Dependency):
    """
    아이디(이메일) 찾기
    
    이름과 전화번호로 가입된 이메일을 찾습니다.
    보안을 위해 마스킹된 이메일을 반환합니다.
    """
    # 이름 + 전화번호로 사용자 조회
    query = select(UserModel).where(
        UserModel.name == request.name,
        UserModel.phone == request.phone
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        return FindEmailResponse(
            found=False,
            masked_email=None,
            message="일치하는 계정을 찾을 수 없습니다."
        )
    
    masked = mask_email(user.email)
    
    return FindEmailResponse(
        found=True,
        masked_email=masked,
        message="가입된 이메일을 찾았습니다."
    )


# 비밀번호 재설정

@router.post("/request-password-reset")
async def request_password_reset(request: RequestPasswordResetRequest, db: DB_Dependency):
    """
    비밀번호 재설정 요청 (인증 코드 이메일 발송)
    
    입력된 이메일로 6자리 인증 코드를 발송합니다.
    코드는 5분간 유효합니다.
    """
    # 이메일로 사용자 조회
    query = select(UserModel).where(UserModel.email == request.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        # 보안상 이메일 존재 여부를 노출하지 않음
        return {"success": True, "message": "이메일이 존재하면 인증 코드가 발송됩니다."}
    
    # 인증 코드 생성
    code = generate_verification_code()
    expires = datetime.utcnow() + timedelta(minutes=5)
    
    # 저장
    verification_codes[request.email] = {
        "code": code,
        "expires": expires
    }
    
    # 이메일 발송
    success = send_verification_email(request.email, code)
    
    if not success:
        logger.error(f"인증 코드 이메일 발송 실패: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요."
        )
    
    logger.info(f"인증 코드 발송 완료: {request.email}")
    return {"success": True, "message": "인증 코드가 이메일로 발송되었습니다."}


@router.post("/verify-reset-code")
async def verify_reset_code(request: VerifyCodeRequest):
    """
    인증 코드 확인
    
    이메일로 발송된 인증 코드가 올바른지 확인합니다.
    """
    stored = verification_codes.get(request.email)
    
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증 코드가 만료되었거나 존재하지 않습니다."
        )
    
    # 만료 확인
    if datetime.utcnow() > stored["expires"]:
        del verification_codes[request.email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증 코드가 만료되었습니다. 다시 요청해주세요."
        )
    
    # 코드 확인
    if stored["code"] != request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증 코드가 일치하지 않습니다."
        )
    
    return {"success": True, "message": "인증 코드가 확인되었습니다."}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: DB_Dependency):
    """
    비밀번호 재설정
    
    인증 코드 확인 후 새 비밀번호로 변경합니다.
    """
    stored = verification_codes.get(request.email)
    
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증 코드가 만료되었거나 존재하지 않습니다."
        )
    
    # 만료 확인
    if datetime.utcnow() > stored["expires"]:
        del verification_codes[request.email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증 코드가 만료되었습니다. 다시 요청해주세요."
        )
    
    # 코드 확인
    if stored["code"] != request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증 코드가 일치하지 않습니다."
        )
    
    # 사용자 조회
    query = select(UserModel).where(UserModel.email == request.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )
    
    # 비밀번호 변경
    hashed_password = pwd_context.hash(request.new_password)
    user.password_hash = hashed_password
    user.updated_at = datetime.utcnow()
    
    await db.commit()
    
    # 사용한 인증 코드 삭제
    del verification_codes[request.email]
    
    logger.info(f"비밀번호 재설정 완료: {request.email}")
    return {"success": True, "message": "비밀번호가 성공적으로 변경되었습니다."}
