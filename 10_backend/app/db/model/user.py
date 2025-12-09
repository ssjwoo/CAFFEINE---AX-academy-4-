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

    # 권한/상태
    role = Column(String(20), default="USER", nullable=False)  # USER/ADMIN 등
    group_id = Column(BigInteger, ForeignKey("user_groups.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE/AWAY/BUSY 등 상태값

    # 소셜 로그인
    social_provider = Column(String(20), nullable=True)  # LOCAL/GOOGLE/KAKAO/NAVER
    social_id = Column(String(255), nullable=True)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    group = relationship("UserGroup", back_populates="users")
    login_histories = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")

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
