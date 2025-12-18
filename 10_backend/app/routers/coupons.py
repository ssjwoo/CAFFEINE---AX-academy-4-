# 쿠폰 API 라우터
# - GET /coupons: 사용자 쿠폰 목록
# - POST /coupons/issue: 쿠폰 발급
# - POST /coupons/{id}/use: 쿠폰 사용

import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from jose import JWTError

from app.db.database import get_db
from app.db.model.transaction import CouponTemplate, UserCoupon
from app.core.jwt import verify_access_token

router = APIRouter(prefix="/coupons", tags=["쿠폰"])

# DB 세션 의존성
DB_Dependency = Annotated[AsyncSession, Depends(get_db)]
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


# 현재 인증된 유저 ID 가져오기
async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = verify_access_token(token)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="인증 정보가 유효하지 않습니다.",
            )
        return int(user_id_str)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 토큰이 만료되었거나 유효하지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Pydantic 스키마
class CouponTemplateResponse(BaseModel):
    id: int
    merchant_name: Optional[str]
    title: str
    description: Optional[str]
    discount_type: str
    discount_value: int
    min_amount: Optional[int]

    class Config:
        from_attributes = True


class UserCouponResponse(BaseModel):
    id: int
    code: str
    status: str
    valid_until: datetime
    issued_at: datetime
    used_at: Optional[datetime]
    # 템플릿 정보 포함
    merchant_name: Optional[str]
    title: str
    description: Optional[str]
    discount_type: str
    discount_value: int
    min_amount: Optional[int]


class IssueCouponRequest(BaseModel):
    template_id: Optional[int] = None  # 특정 템플릿 지정 (없으면 merchant_name으로 자동 생성)
    merchant_name: Optional[str] = None  # AI 예측 기반 가맹점명
    discount_value: Optional[int] = None  # 할인 금액


class IssueCouponResponse(BaseModel):
    success: bool
    message: str
    coupon: Optional[UserCouponResponse]


class UseCouponResponse(BaseModel):
    success: bool
    message: str


# 쿠폰 코드 생성
def generate_coupon_code(length: int = 12) -> str:
    """고유한 쿠폰 코드 생성 (영문 대문자 + 숫자)"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))


# GET /coupons - 사용자 쿠폰 목록 조회
@router.get("", response_model=List[UserCouponResponse])
async def get_user_coupons(
    status: Optional[str] = Query(None, description="쿠폰 상태 필터 (available/used/expired)"),
    db: DB_Dependency = None,
    user_id: int = Depends(get_current_user_id)
):
    """
    현재 로그인한 사용자의 쿠폰 목록 조회
    """
    
    # 쿠폰 조회 (템플릿 정보 포함)
    query = select(UserCoupon).options(
        selectinload(UserCoupon.template)
    ).where(UserCoupon.user_id == user_id)
    
    # 상태 필터
    if status:
        query = query.where(UserCoupon.status == status)
    
    # 최신순 정렬
    query = query.order_by(UserCoupon.issued_at.desc())
    
    result = await db.execute(query)
    user_coupons = result.scalars().all()
    
    # 만료된 쿠폰 상태 자동 업데이트
    now = datetime.now(timezone.utc)
    for coupon in user_coupons:
        if coupon.status == "available" and coupon.valid_until < now:
            coupon.status = "expired"
            await db.commit()
    
    # 응답 변환
    response = []
    for uc in user_coupons:
        template = uc.template
        response.append(UserCouponResponse(
            id=uc.id,
            code=uc.code,
            status=uc.status,
            valid_until=uc.valid_until,
            issued_at=uc.issued_at,
            used_at=uc.used_at,
            merchant_name=template.merchant_name if template else None,
            title=template.title if template else "쿠폰",
            description=template.description if template else None,
            discount_type=template.discount_type if template else "amount",
            discount_value=template.discount_value if template else 0,
            min_amount=template.min_amount if template else None
        ))
    
    return response


# POST /coupons/issue - 쿠폰 발급
@router.post("/issue", response_model=IssueCouponResponse)
async def issue_coupon(
    request: IssueCouponRequest,
    db: DB_Dependency = None,
    user_id: int = Depends(get_current_user_id)
):
    """
    쿠폰 발급 (AI 예측 기반 또는 템플릿 지정)
    """
    template = None
    
    # 1. 템플릿 ID로 발급
    if request.template_id:
        result = await db.execute(
            select(CouponTemplate).where(
                and_(CouponTemplate.id == request.template_id, CouponTemplate.is_active == True)
            )
        )
        template = result.scalar_one_or_none()
        if not template:
            raise HTTPException(status_code=404, detail="쿠폰 템플릿을 찾을 수 없습니다.")
    
    # 2. 가맹점명으로 자동 생성 (AI 예측 기반)
    elif request.merchant_name:
        # 기존 템플릿 찾기
        result = await db.execute(
            select(CouponTemplate).where(
                and_(
                    CouponTemplate.merchant_name == request.merchant_name,
                    CouponTemplate.is_active == True
                )
            )
        )
        template = result.scalar_one_or_none()
        
        # 없으면 새 템플릿 생성
        if not template:
            discount = request.discount_value or 1000  # 기본 1000원
            template = CouponTemplate(
                merchant_name=request.merchant_name,
                title=f"{request.merchant_name} 할인 쿠폰",
                description="AI 예측 기반 자동 발급 쿠폰",
                discount_type="amount",
                discount_value=discount,
                min_amount=5000,
                validity_days=30,
                is_active=True
            )
            db.add(template)
            await db.flush()  # ID 생성
    else:
        raise HTTPException(status_code=400, detail="template_id 또는 merchant_name이 필요합니다.")
    
    # 중복 발급 체크 (같은 템플릿, 미사용 쿠폰)
    existing = await db.execute(
        select(UserCoupon).where(
            and_(
                UserCoupon.user_id == user_id,
                UserCoupon.template_id == template.id,
                UserCoupon.status == "available"
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 동일한 쿠폰을 보유하고 있습니다.")
    
    # 쿠폰 발급
    valid_until = datetime.now(timezone.utc) + timedelta(days=template.validity_days)
    user_coupon = UserCoupon(
        user_id=user_id,
        template_id=template.id,
        code=generate_coupon_code(),
        status="available",
        valid_until=valid_until
    )
    db.add(user_coupon)
    await db.commit()
    await db.refresh(user_coupon)
    
    return IssueCouponResponse(
        success=True,
        message=f"{template.title} 쿠폰이 발급되었습니다!",
        coupon=UserCouponResponse(
            id=user_coupon.id,
            code=user_coupon.code,
            status=user_coupon.status,
            valid_until=user_coupon.valid_until,
            issued_at=user_coupon.issued_at,
            used_at=None,
            merchant_name=template.merchant_name,
            title=template.title,
            description=template.description,
            discount_type=template.discount_type,
            discount_value=template.discount_value,
            min_amount=template.min_amount
        )
    )


# POST /coupons/{coupon_id}/use - 쿠폰 사용
@router.post("/{coupon_id}/use", response_model=UseCouponResponse)
async def use_coupon(
    coupon_id: int,
    db: DB_Dependency = None,
    user_id: int = Depends(get_current_user_id)
):
    """
    쿠폰 사용 처리
    """
    
    # 쿠폰 조회
    result = await db.execute(
        select(UserCoupon).options(
            selectinload(UserCoupon.template)
        ).where(
            and_(UserCoupon.id == coupon_id, UserCoupon.user_id == user_id)
        )
    )
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="쿠폰을 찾을 수 없습니다.")
    
    if coupon.status == "used":
        raise HTTPException(status_code=400, detail="이미 사용된 쿠폰입니다.")
    
    if coupon.status == "expired" or coupon.valid_until < datetime.now(timezone.utc):
        coupon.status = "expired"
        await db.commit()
        raise HTTPException(status_code=400, detail="만료된 쿠폰입니다.")
    
    # 쿠폰 사용 처리
    coupon.status = "used"
    coupon.used_at = datetime.now(timezone.utc)
    await db.commit()
    
    return UseCouponResponse(
        success=True,
        message=f"{coupon.template.title} 쿠폰이 사용되었습니다!"
    )
