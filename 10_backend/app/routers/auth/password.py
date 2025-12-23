from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import Annotated
import random
import string
import logging
from datetime import datetime, timedelta
from pydantic import BaseModel
from passlib.context import CryptContext

from app.db.database import get_db
from app.db.model.user import User as UserModel
from app.db.model.transaction import Transaction, UserCoupon
from app.core.email import send_verification_email, send_email_found_notification
from app.core.jwt import verify_access_token

logger = logging.getLogger(__name__)

# 라우터 설정
router = APIRouter(prefix="/auth", tags=["auth-password"])

DB_Dependency = Annotated[AsyncSession, Depends(get_db)]

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 인증 코드 저장소 (메모리 - 프로덕션에서는 Redis 권장)
# 형식: { "email": {"code": "123456", "expires": datetime} }
verification_codes: dict = {}

# 인증 코드 생성
def generate_verification_code() -> str:
    return ''.join(random.choices(string.digits, k=6))

# 이메일 마스킹
def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return email
    
    local, domain = email.split("@")
    if len(local) <= 2:
        masked_local = local[0] + "***"
    else:
        masked_local = local[:2] + "***"
    
    return f"{masked_local}@{domain}"


# 요청/응답 스키마
class FindEmailRequest(BaseModel):
    name: str
    birth_date: str  # YYYY-MM-DD 형식


class FindEmailResponse(BaseModel):
    found: bool
    masked_email: str | None = None
    message: str


class RequestPasswordResetRequest(BaseModel):
    email: str


class VerifyCodeRequest(BaseModel):
    email: str
    code: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class DeleteAccountResponse(BaseModel):
    success: bool
    message: str


# 비밀번호 변경 (로그인 상태에서)
@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    db: DB_Dependency,
    authorization: str = Header(None, alias="Authorization")
):
    # 토큰 검증
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 토큰이 필요합니다."
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = verify_access_token(token)
    except HTTPException as e:
        raise e
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다."
        )
    
    user_id = int(payload.get("sub"))
    
    # 사용자 조회
    query = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )
    
    # 소셜 로그인 사용자는 비밀번호 변경 불가
    if user.social_provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다."
        )
    
    # 현재 비밀번호 확인
    if not pwd_context.verify(request.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 일치하지 않습니다."
        )
    
    # 새 비밀번호 저장
    user.password_hash = pwd_context.hash(request.new_password)
    user.updated_at = datetime.utcnow()
    await db.commit()
    
    logger.info(f"비밀번호 변경 완료: user_id={user_id}")
    return {"success": True, "message": "비밀번호가 성공적으로 변경되었습니다."}


# 아이디(이메일) 찾기
@router.post("/find-email", response_model=FindEmailResponse)
async def find_email(request: FindEmailRequest, db: DB_Dependency):
    # 생년월일 문자열을 date 객체로 변환
    try:
        birth_date_obj = datetime.strptime(request.birth_date, "%Y-%m-%d").date()
    except ValueError:
        return FindEmailResponse(
            found=False,
            masked_email=None,
            message="생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD)"
        )
    
    # 이름 + 생년월일로 사용자 조회
    query = select(UserModel).where(
        UserModel.name == request.name,
        UserModel.birth_date == birth_date_obj
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        return FindEmailResponse(
            found=False,
            masked_email=None,
            message="일치하는 계정을 찾을 수 없습니다."
        )
    
    # 전체 이메일 반환
    return FindEmailResponse(
        found=True,
        masked_email=user.email,  # 전체 이메일 표시
        message="가입된 이메일을 찾았습니다."
    )

# 비밀번호 재설정 요청
@router.post("/request-password-reset")
async def request_password_reset(request: RequestPasswordResetRequest, db: DB_Dependency):
    # 이메일로 사용자 조회
    query = select(UserModel).where(UserModel.email == request.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        # 보안상 이메일 존재 여부를 노출하지 않음
        return {"success": True, "message": "이메일이 존재하면 인증 코드가 발송됩니다."}
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

# 인증 코드 확인
@router.post("/verify-reset-code")
async def verify_reset_code(request: VerifyCodeRequest):
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

# 비밀번호 재설정
@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: DB_Dependency):
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

# 회원 탈퇴
@router.delete("/delete-account", response_model=DeleteAccountResponse)
async def delete_account(
    db: DB_Dependency,
    authorization: str = Header(None, alias="Authorization")
):
    logger.info(f"회원탈퇴 요청 - Authorization 헤더: {authorization[:50] if authorization else 'None'}...")
    
    # 토큰에서 사용자 ID 추출
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("회원탈퇴 실패 - 인증 토큰 없음")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 토큰이 필요합니다."
        )
    
    token = authorization.replace("Bearer ", "")
    logger.info(f"회원탈퇴 - 토큰 추출 완료: {token[:20]}...")
    
    try:
        payload = verify_access_token(token)
    except HTTPException as e:
        logger.warning(f"회원탈퇴 실패 - 토큰 검증 실패: {e.detail}")
        raise
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다."
        )
    
    user_id = int(payload.get("sub"))
    
    # 사용자 조회
    query = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )
    
    # 관련 데이터 먼저 삭제 (NOT NULL 제약 문제 해결)
    # 1. 거래내역 삭제
    await db.execute(delete(Transaction).where(Transaction.user_id == user_id))
    logger.info(f"회원탈퇴 - 거래내역 삭제 완료: user_id={user_id}")
    
    # 2. 사용자 쿠폰 삭제
    await db.execute(delete(UserCoupon).where(UserCoupon.user_id == user_id))
    logger.info(f"회원탈퇴 - 쿠폰 삭제 완료: user_id={user_id}")
    
    # 3. 사용자 삭제
    await db.delete(user)
    await db.commit()
    
    logger.info(f"회원 탈퇴 완료: user_id={user_id}, email={user.email}")
    
    return DeleteAccountResponse(
        success=True,
        message="회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다."
    )
