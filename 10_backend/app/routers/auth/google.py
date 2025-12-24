#구글 소셜 로그인 라우터
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Annotated
import httpx
import os
import logging
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.db.model.user import User as UserModel
from app.core.jwt import create_access_token, create_refresh_token

logger = logging.getLogger(__name__)

# 라우터 설정
router = APIRouter(prefix="/auth", tags=["auth-google"])

DB_Dependency = Annotated[AsyncSession, Depends(get_db)]

# 구글 API 설정
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8081/auth/google/callback")
GOOGLE_SIGNUP_REDIRECT_URI = os.getenv("GOOGLE_SIGNUP_REDIRECT_URI", "http://localhost:8081/auth/google/signup/callback")


# 요청/응답 스키마
class GoogleLoginRequest(BaseModel):
    code: str
    redirect_uri: str | None = None


class GoogleUserResponse(BaseModel):
    id: int
    nickname: str
    email: str | None = None
    profile_image: str | None = None
    provider: str = "google"
    birth_date: str | None = None


class GoogleLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: GoogleUserResponse


# 소셜 ID로 유저 조회
async def get_user_by_social_id(db: AsyncSession, social_provider: str, social_id: str) -> UserModel | None:
    result = await db.execute(
        select(UserModel).where(
            UserModel.social_provider == social_provider,
            UserModel.social_id == social_id
        )
    )
    return result.scalar_one_or_none()


# 구글 유저 조회 (기존 회원만 로그인 가능)
async def get_google_user_if_exists(
    db: AsyncSession,
    google_id: str,
    nickname: str,
    email: str | None,
    profile_image: str | None
) -> UserModel:
    # 기존 유저 확인
    existing_user = await get_user_by_social_id(db, "GOOGLE", google_id)
    
    if existing_user:
        # 마지막 로그인 시간 업데이트
        existing_user.last_login_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing_user)
        return existing_user
    
    # 미가입 사용자는 로그인 불가
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="가입되지 않은 사용자입니다. 먼저 회원가입을 진행해주세요."
    )


# 구글 로그인
@router.post("/google", response_model=GoogleLoginResponse)
async def google_login(payload: GoogleLoginRequest, db: DB_Dependency):
    async with httpx.AsyncClient() as client:
        # 1. code -> access_token 교환
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": payload.code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": payload.redirect_uri or GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        token_response = await client.post(token_url, data=token_data)
        
        if token_response.status_code != 200:
            logger.error(f"구글 토큰 교환 실패: {token_response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"구글 토큰 교환 실패: {token_response.text}"
            )
        
        token_json = token_response.json()
        google_access_token = token_json.get("access_token")
        
        # 2. 사용자 정보 조회
        user_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        user_response = await client.get(
            user_url,
            headers={"Authorization": f"Bearer {google_access_token}"}
        )
        
        if user_response.status_code != 200:
            logger.error(f"구글 사용자 정보 조회 실패: {user_response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="구글 사용자 정보 조회 실패"
            )
        
        google_user = user_response.json()
        
        google_id = google_user.get("id")
        email = google_user.get("email")
        nickname = google_user.get("name", "사용자")
        profile_image = google_user.get("picture")
        
        # 3. 기존 회원 확인 (없으면 에러)
        db_user = await get_google_user_if_exists(
            db,
            google_id=google_id,
            nickname=nickname,
            email=email,
            profile_image=profile_image
        )
        
        # 4. JWT 토큰 발급
        access_token = create_access_token({"sub": str(db_user.id)})
        refresh_token = create_refresh_token({"sub": str(db_user.id)})
        
        logger.info(f"구글 로그인 성공: user_id={db_user.id}, google_id={google_id}")
        
        return GoogleLoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=GoogleUserResponse(
                id=db_user.id,
                nickname=db_user.name,
                email=db_user.email,
                profile_image=profile_image,
                provider="google",
                birth_date=db_user.birth_date.strftime("%Y-%m-%d") if db_user.birth_date else None
            )
        )


# 구글 회원가입
@router.post("/google/signup", response_model=GoogleLoginResponse)
async def google_signup(payload: GoogleLoginRequest, db: DB_Dependency):
    async with httpx.AsyncClient() as client:
        # 1. code -> access_token 교환
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": payload.code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": payload.redirect_uri or GOOGLE_SIGNUP_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        token_response = await client.post(token_url, data=token_data)
        
        if token_response.status_code != 200:
            logger.error(f"구글 토큰 교환 실패: {token_response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"구글 토큰 교환 실패: {token_response.text}"
            )
        
        token_json = token_response.json()
        google_access_token = token_json.get("access_token")
        
        # 2. 사용자 정보 조회
        user_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        user_response = await client.get(
            user_url,
            headers={"Authorization": f"Bearer {google_access_token}"}
        )
        
        if user_response.status_code != 200:
            logger.error(f"구글 사용자 정보 조회 실패: {user_response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="구글 사용자 정보 조회 실패"
            )
        
        google_user = user_response.json()
        
        google_id = google_user.get("id")
        email = google_user.get("email")
        nickname = google_user.get("name", "사용자")
        profile_image = google_user.get("picture")
        
        # 3. 이미 가입된 사용자인지 확인
        existing_user = await get_user_by_social_id(db, "GOOGLE", google_id)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 가입된 계정입니다. 로그인을 이용해주세요."
            )
        
        # 4. 신규 사용자 생성
        new_user = UserModel(
            email=email or f"google_{google_id}@caffeine.app",
            name=nickname,
            password_hash="",  # 소셜 로그인은 비밀번호 없음
            social_provider="GOOGLE",
            social_id=google_id,
            last_login_at=datetime.utcnow()
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        logger.info(f"구글 회원가입 완료: user_id={new_user.id}, google_id={google_id}")
        
        # 5. JWT 토큰 발급
        access_token = create_access_token({"sub": str(new_user.id)})
        refresh_token = create_refresh_token({"sub": str(new_user.id)})
        
        return GoogleLoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=GoogleUserResponse(
                id=new_user.id,
                nickname=new_user.name,
                email=new_user.email,
                profile_image=profile_image,
                provider="google",
                birth_date=new_user.birth_date.strftime("%Y-%m-%d") if new_user.birth_date else None
            )
        )


# 구글 콜백 (테스트용)
@router.get("/google/callback")
async def google_callback(code: str):
    return {
        "message": "구글 인증 코드 수신 완료",
        "code": code,
        "next_step": "이 코드를 POST /auth/google 엔드포인트로 전송하세요"
    }
