from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    # 기본 정보
    id = Column(BigInteger, primary_key=True, autoincrement=True)  # 사용자 고유 ID
    email = Column(String(255), unique=True, nullable=False)  # 로그인 이메일 ID
    password_hash = Column(String(255), nullable=False)  # bcrypt 해시 비밀번호
    name = Column(String(100), nullable=False)  # 이름
    nickname = Column(String(50), nullable=True)  # 닉네임(선택)
    phone = Column(String(20), nullable=True)  # 전화번호(선택)
    birth_date = Column(DateTime, nullable=True)  # 생년월일 (연령대별 분석용)

    # 권한/상태
    role = Column(String(20), default="USER", nullable=False)  # USER/ADMIN 등
    is_superuser = Column(Boolean, default=False, nullable=False) # 슈퍼유저 여부
    is_active = Column(Boolean, default=True, nullable=False) # 계정 활성화 여부
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE/INACTIVE/SUSPENDED
    group_id = Column(BigInteger, ForeignKey("user_groups.id", ondelete="SET NULL"), nullable=True)
    
    # 앱 관련
    push_token = Column(String(255), nullable=True)  # 앱 푸시 토큰 (Expo)
    budget_limit = Column(BigInteger, default=0, nullable=True)  # 월 예산 설정액
    budget_alert_enabled = Column(Boolean, default=True, nullable=False)  # 예산 초과 알림 활성화

    # 소셜 로그인
    social_provider = Column(String(20), nullable=True)  # LOCAL/GOOGLE/KAKAO/NAVER
    social_id = Column(String(255), nullable=True)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    login_histories = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    # transactions는 Transaction 모델의 backref="transactions"로 자동 생성됨

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}')>"

# 로그인 이력 모델
class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)  # 로그인 이력 ID
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # 사용자 FK
    login_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)  # 로그인 시도 시각
    is_success = Column(Boolean, nullable=False, default=False)  # 성공 여부
    ip_address = Column(String(45), nullable=True)  # 접속 IP(IPv6 포함)
    user_agent = Column(Text, nullable=True)  # 브라우저/클라이언트 정보
    device_info = Column(String(255), nullable=True)  # 디바이스 정보

    user = relationship("User", back_populates="login_histories")
