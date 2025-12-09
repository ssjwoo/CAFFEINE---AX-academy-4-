from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# 로그인 요청
class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="로그인 이메일")
    password: str = Field(..., description="비밀번호(평문 입력)")
    device_info: Optional[str] = Field(None, description="디바이스 정보(선택)")

# 토큰 응답
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

    class Config:
        from_attributes = True

# 토큰 페어 응답
class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# 로그인 응답
class LoginResponse(BaseModel):
    user_id: int
    email: EmailStr
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
