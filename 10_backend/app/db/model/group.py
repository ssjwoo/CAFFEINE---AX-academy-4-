from sqlalchemy import BigInteger, Boolean, Column, String, Text
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.db.database import Base


class UserGroup(Base):
    __tablename__ = "user_groups"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    key = Column(String(50), unique=True, nullable=False)  # USER, ADMIN 등
    name = Column(String(100), nullable=False)  # 그룹명
    description = Column(Text, nullable=True)  # 설명
    is_admin = Column(Boolean, default=False, nullable=False)  # 관리자 그룹 여부
    is_default = Column(Boolean, default=False, nullable=False)  # 기본 그룹 여부
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<UserGroup(id={self.id}, key='{self.key}', name='{self.name}')>"
