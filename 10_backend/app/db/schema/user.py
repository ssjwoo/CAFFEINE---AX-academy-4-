from datetime import datetime
from typing import Optional, Any, Union
from pydantic import BaseModel, EmailStr, Field, field_validator


# 사용자 기본 스키마
class UserBase(BaseModel):
    email: EmailStr = Field(..., description="로그인 ID(이메일)")
    name: str = Field(..., max_length=100, description="이름")
    nickname: Optional[str] = Field(None, max_length=50, description="닉네임")
    phone: Optional[str] = Field(None, max_length=20, description="전화번호")
    birth_date: Optional[datetime] = Field(None, description="생년월일")
    last_login_at: Optional[datetime] = None

    @field_validator('birth_date', mode='before')
    @classmethod
    def parse_birth_date(cls, v):
        if isinstance(v, str):
            if not v:
                return None
            try:
                # 20020202 형식 처리
                if len(v) == 8 and v.isdigit():
                    return datetime.strptime(v, '%Y%m%d')
                # YYYY-MM-DD 형식 처리
                return datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                raise ValueError("생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD 또는 YYYYMMDD)")
        return v

    class Config:
        from_attributes = True


# 생성
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="비밀번호(평문 입력, 서버에서 해싱)")
    social_provider: Optional[str] = Field(None, description="소셜 로그인 제공자")
    social_id: Optional[str] = Field(None, description="소셜 로그인 ID")
    group_id: Optional[int] = Field(None, description="권한 그룹 ID")
    status: Optional[str] = Field("ACTIVE", description="계정 상태(ACTIVE/AWAY/BUSY 등)")
    push_token: Optional[str] = Field(None, description="푸시 토큰")
    is_active: Optional[bool] = Field(True, description="계정 활성화 여부")
    is_superuser: Optional[bool] = Field(False, description="슈퍼유저 여부")

# 업데이트
class UserUpdate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[datetime] = None
    password: Optional[str] = None  # 평문 입력, 서버에서 해싱 처리
    status: Optional[str] = None
    group_id: Optional[int] = None
    push_token: Optional[str] = None
    budget_limit: Optional[int] = None
    budget_alert_enabled: Optional[bool] = None
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
    push_token: Optional[str]
    budget_limit: Optional[int]
    budget_alert_enabled: bool = False
    has_recent_activity: Optional[bool] = Field(None, description="최근 30일 내 거래 여부 (동적 계산)")

    class Config:
        from_attributes = True
    
    @field_validator('birth_date', mode='before')
    @classmethod
    def convert_birth_date(cls, value):
        if value is None:
            return None
        if hasattr(value, 'strftime'):
            return value.strftime('%Y-%m-%d')
        return str(value) if value else None


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
