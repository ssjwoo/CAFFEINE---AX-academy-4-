"""
쿠폰 API 라우터

ML 예측 기반 쿠폰 자동 생성 및 관리
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime, timedelta
import random
import logging

from app.db.database import get_db
from app.db.model.transaction import Coupon
from app.db.model.user import User

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/coupons",
    tags=["coupons"],
    responses={404: {"description": "Not found"}},
)


# ============================================================
# Pydantic 스키마
# ============================================================

class CouponCreate(BaseModel):
    """쿠폰 생성 요청"""
    predicted_category: str  # ML 예측 카테고리
    confidence: Optional[float] = 0.8


class CouponResponse(BaseModel):
    """쿠폰 응답"""
    id: int
    user_id: int
    merchant_name: str
    title: str
    discount_value: int
    is_active: bool
    valid_until: str
    created_at: str
    
    class Config:
        from_attributes = True


# ============================================================
# 쿠폰 템플릿 (ML 카테고리 기준)
# ============================================================

COUPON_TEMPLATES = {
    "교통": [
        {"merchant": "카카오택시", "discount": 3000},
        {"merchant": "타다", "discount": 3000},
        {"merchant": "티머니", "discount": 2000}
    ],
    "생활": [
        {"merchant": "다이소", "discount": 3000},
        {"merchant": "올리브영", "discount": 3000},
        {"merchant": "CU", "discount": 2000},
        {"merchant": "GS25", "discount": 2000},
        {"merchant": "한국전력", "discount": 10000},
        {"merchant": "세탁소", "discount": 5000},
        {"merchant": "미용실", "discount": 10000}
    ],
    "쇼핑": [
        {"merchant": "무신사", "discount": 5000},
        {"merchant": "29CM", "discount": 4000},
        {"merchant": "쿠팡", "discount": 3000}
    ],
    "식료품": [
        {"merchant": "이마트", "discount": 5000},
        {"merchant": "홈플러스", "discount": 4000},
        {"merchant": "롯데마트", "discount": 4000}
    ],
    "외식": [
        {"merchant": "스타벅스", "discount": 3000},
        {"merchant": "맘스터치", "discount": 3000},
        {"merchant": "서브웨이", "discount": 2500},
        {"merchant": "이디야", "discount": 2000}
    ],
    "주유": [
        {"merchant": "SK에너지", "discount": 5000},
        {"merchant": "GS칼텍스", "discount": 5000},
        {"merchant": "현대오일뱅크", "discount": 5000}
    ]
}


# ============================================================
# API 엔드포인트
# ============================================================

@router.get("", response_model=List[CouponResponse])
async def get_coupons(
    user_id: int = 1,  # TODO: 실제로는 JWT 토큰에서 추출
    show_used: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    사용자의 쿠폰 목록 조회
    
    Args:
        user_id: 사용자 ID (추후 JWT 인증으로 대체)
        show_used: True면 사용된 쿠폰도 포함, False면 미사용만
        db: 데이터베이스 세션
    
    Returns:
        쿠폰 목록
    """
    try:
        # 쿠폰 조회
        query = select(Coupon).where(Coupon.user_id == user_id)
        
        if not show_used:
            query = query.where(Coupon.is_active == True)
        
        # 만료일 기준 정렬 (만료 임박 순)
        query = query.order_by(Coupon.valid_until.asc())
        
        result = await db.execute(query)
        coupons = result.scalars().all()
        
        logger.info(f"Retrieved {len(coupons)} coupons for user {user_id}")
        
        return [
            CouponResponse(
                id=c.id,
                user_id=c.user_id,
                merchant_name=c.merchant_name or "가맹점",
                title=c.title,
                discount_value=c.discount_value,
                is_active=c.is_active,
                valid_until=c.valid_until.strftime("%Y-%m-%d %H:%M") if c.valid_until else "무제한",
                created_at=c.created_at.strftime("%Y-%m-%d %H:%M")
            )
            for c in coupons
        ]
        
    except Exception as e:
        logger.error(f"Failed to fetch coupons: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"쿠폰 조회 실패: {str(e)}"
        )


@router.post("/generate-from-prediction", response_model=CouponResponse)
async def generate_coupon_from_prediction(
    data: CouponCreate,
    user_id: int = 1,  # TODO: JWT에서 추출
    db: AsyncSession = Depends(get_db)
):
    """
    ML 예측 기반 쿠폰 자동 생성
    
    Args:
        data: 예측 카테고리 정보
        user_id: 사용자 ID
        db: 데이터베이스 세션
    
    Returns:
        생성된 쿠폰 정보
    """
    try:
        category = data.predicted_category
        
        # 카테고리 검증
        if category not in COUPON_TEMPLATES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"지원하지 않는 카테고리: {category}"
            )
        
        # 랜덤 선택
        templates = COUPON_TEMPLATES[category]
        selected = random.choice(templates)
        
        # 만료일 계산 (3일)
        valid_until = datetime.now() + timedelta(days=3)
        
        # 고유 코드 생성
        import uuid
        coupon_code = f"ML-{category[:2].upper()}-{uuid.uuid4().hex[:8].upper()}"
        
        # 쿠폰 생성
        new_coupon = Coupon(
            user_id=user_id,
            merchant_name=selected["merchant"],
            code=coupon_code,
            title=f"{selected['merchant']} {selected['discount']//1000}천원 할인",
            description=f"ML 예측 기반 {category} 카테고리 쿠폰",
            discount_type="amount",
            discount_value=selected["discount"],
            valid_until=valid_until,
            is_active=True
        )
        
        db.add(new_coupon)
        await db.commit()
        await db.refresh(new_coupon)
        
        logger.info(f"Generated coupon {new_coupon.id} for user {user_id} (category: {category})")
        
        return CouponResponse(
            id=new_coupon.id,
            user_id=new_coupon.user_id,
            merchant_name=new_coupon.merchant_name,
            title=new_coupon.title,
            discount_value=new_coupon.discount_value,
            is_active=new_coupon.is_active,
            valid_until=new_coupon.valid_until.strftime("%Y-%m-%d %H:%M"),
            created_at=new_coupon.created_at.strftime("%Y-%m-%d %H:%M")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate coupon: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"쿠폰 생성 실패: {str(e)}"
        )


@router.post("/{coupon_id}/use", response_model=CouponResponse)
async def use_coupon(
    coupon_id: int,
    user_id: int = 1,  # TODO: JWT
    db: AsyncSession = Depends(get_db)
):
    """
    쿠폰 사용
    
    Args:
        coupon_id: 쿠폰 ID
        user_id: 사용자 ID
        db: 데이터베이스 세션
    
    Returns:
        사용 처리된 쿠폰
    """
    try:
        # 쿠폰 조회
        result = await db.execute(
            select(Coupon).where(
                and_(
                    Coupon.id == coupon_id,
                    Coupon.user_id == user_id
                )
            )
        )
        coupon = result.scalar_one_or_none()
        
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="쿠폰을 찾을 수 없습니다"
            )
        
        if not coupon.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용된 쿠폰입니다"
            )
        
        if coupon.valid_until and coupon.valid_until < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="만료된 쿠폰입니다"
            )
        
        # 사용 처리
        coupon.is_active = False
        coupon.used_at = datetime.now()
        
        await db.commit()
        await db.refresh(coupon)
        
        logger.info(f"Coupon {coupon_id} used by user {user_id}")
        
        return CouponResponse(
            id=coupon.id,
            user_id=coupon.user_id,
            merchant_name=coupon.merchant_name or "가맹점",
            title=coupon.title,
            discount_value=coupon.discount_value,
            is_active=coupon.is_active,
            valid_until=coupon.valid_until.strftime("%Y-%m-%d %H:%M") if coupon.valid_until else "무제한",
            created_at=coupon.created_at.strftime("%Y-%m-%d %H:%M")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to use coupon: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"쿠폰 사용 실패: {str(e)}"
        )


@router.delete("/{coupon_id}")
async def delete_coupon(
    coupon_id: int,
    user_id: int = 1,  # TODO: JWT
    db: AsyncSession = Depends(get_db)
):
    """
    쿠폰 삭제
    
    Args:
        coupon_id: 쿠폰 ID
        user_id: 사용자 ID
        db: 데이터베이스 세션
    
    Returns:
        삭제 확인 메시지
    """
    try:
        result = await db.execute(
            select(Coupon).where(
                and_(
                    Coupon.id == coupon_id,
                    Coupon.user_id == user_id
                )
            )
        )
        coupon = result.scalar_one_or_none()
        
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="쿠폰을 찾을 수 없습니다"
            )
        
        await db.delete(coupon)
        await db.commit()
        
        logger.info(f"Coupon {coupon_id} deleted by user {user_id}")
        
        return {"message": "쿠폰이 삭제되었습니다", "id": coupon_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete coupon: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"쿠폰 삭제 실패: {str(e)}"
        )
