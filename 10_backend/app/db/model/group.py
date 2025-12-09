from sqlalchemy import BigInteger, Boolean, Column, DateTime, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class UserGroup(Base):
    __tablename__ = "user_groups"

    # 권한 그룹: USER / ADMIN 등
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    key = Column(String(50), unique=True, nullable=False)  # 예: USER, ADMIN
    name = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    users = relationship("User", back_populates="group")
