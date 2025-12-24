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
router = APIRouter(prefix="/auth", tags=["auth-kakao"])

DB_Dependency = Annotated[AsyncSession, Depends(get_db)]

# 카카오 API 설정
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY", "fa925a6646f9491a77eb9c8fd6537a21")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI", "http://localhost:8081/auth/kakao/callback")
KAKAO_SIGNUP_REDIRECT_URI = os.getenv("KAKAO_SIGNUP_REDIRECT_URI", "http://localhost:8081/auth/kakao/signup/callback")


# 요청/응답 스키마
class KakaoLoginRequest(BaseModel):
    code: str
    redirect_uri: str | None = None


class KakaoUserResponse(BaseModel):
    id: int
    nickname: str
    email: str | None = None
    profile_image: str | None = None
    provider: str = "kakao"
    birth_date: str | None = None


class KakaoLoginResponse(BaseModel):
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


# 카카오 유저 조회 (기존 회원만 로그인 가능)
async def get_kakao_user_if_exists(
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
    
    # 미가입 사용자는 로그인 불가
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="가입되지 않은 사용자입니다. 먼저 회원가입을 진행해주세요."
    )


# 카카오 로그인
@router.post("/kakao", response_model=KakaoLoginResponse)
async def kakao_login(payload: KakaoLoginRequest, db: DB_Dependency):
    try:
        # 1. Authorization code로 access_token 교환
        token_url = "https://kauth.kakao.com/oauth/token"
        token_data = {
            "grant_type": "authorization_code",
            "client_id": KAKAO_REST_API_KEY,
            "redirect_uri": payload.redirect_uri or KAKAO_REDIRECT_URI,
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
            
            # 3. DB에서 기존 회원 확인 (미가입자는 에러 반환)
            db_user = await get_kakao_user_if_exists(
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
                    provider="kakao",
                    birth_date=db_user.birth_date.strftime("%Y-%m-%d") if db_user.birth_date else None
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


# 카카오 회원가입 (신규 가입)
@router.post("/kakao/signup", response_model=KakaoLoginResponse)
async def kakao_signup(payload: KakaoLoginRequest, db: DB_Dependency):
    try:
        # 1. Authorization code로 access_token 교환
        token_url = "https://kauth.kakao.com/oauth/token"
        token_data = {
            "grant_type": "authorization_code",
            "client_id": KAKAO_REST_API_KEY,
            "redirect_uri": payload.redirect_uri or KAKAO_SIGNUP_REDIRECT_URI,
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
            
            # 3. 이미 가입된 사용자인지 확인
            existing_user = await get_user_by_social_id(db, "KAKAO", str(kakao_id))
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="이미 가입된 카카오 계정입니다. 로그인을 진행해주세요."
                )
            
            # 4. 신규 유저 생성
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
            
            logger.info(f"카카오 회원가입 완료: user_id={new_user.id}, kakao_id={kakao_id}")
            
            # 5. JWT 토큰 발급
            access_token = create_access_token(data={"sub": str(new_user.id)})
            refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
            
            return KakaoLoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                user=KakaoUserResponse(
                    id=new_user.id,
                    nickname=new_user.nickname or new_user.name,
                    email=new_user.email,
                    profile_image=profile_image,
                    provider="kakao",
                    birth_date=new_user.birth_date.strftime("%Y-%m-%d") if new_user.birth_date else None
                )
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"카카오 회원가입 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"카카오 회원가입 처리 중 오류 발생: {str(e)}"
        )


# 카카오 콜백 (테스트용)
@router.get("/kakao/callback")
async def kakao_callback(code: str):
    return {
        "message": "카카오 인증 코드 수신 완료",
        "code": code,
        "next_step": "이 코드를 POST /auth/kakao 엔드포인트로 전송하세요"
    }
