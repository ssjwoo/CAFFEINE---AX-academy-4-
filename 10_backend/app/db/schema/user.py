from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# 사용자 기본 스키마
class UserBase(BaseModel):
    email: EmailStr = Field(..., description="로그인 ID(이메일)")
    name: str = Field(..., max_length=100, description="이름")
    nickname: Optional[str] = Field(None, max_length=50, description="닉네임")
    phone: Optional[str] = Field(None, max_length=20, description="전화번호")
    birth_date: Optional[datetime] = Field(None, description="생년월일")
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# 생성
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="비밀번호(평문 입력, 서버에서 해싱)")
    social_provider: Optional[str] = Field(None, description="소셜 로그인 제공자")
    social_id: Optional[str] = Field(None, description="소셜 로그인 ID")
    is_active: Optional[bool] = Field(True, description="계정 활성화 여부")
    is_superuser: Optional[bool] = Field(False, description="슈퍼유저 여부")

# 업데이트
class UserUpdate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[datetime] = None
    password: Optional[str] = None  # 평문 입력, 서버에서 해싱 처리
    is_active: Optional[bool] = None

# 응답
class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    is_superuser: bool
    social_provider: Optional[str]
    social_id: Optional[str]
    birth_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime]

    class Config:
        from_attributes = True


# 로그인 이력 스키마
class LoginHistoryBase(BaseModel):
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_info: Optional[str] = None
    is_success: bool

class LoginHistoryCreate(LoginHistoryBase):
    user_id: int

class LoginHistoryResponse(LoginHistoryBase):
    id: int
    user_id: int
    login_at: datetime

    class Config:
        from_attributes = True
