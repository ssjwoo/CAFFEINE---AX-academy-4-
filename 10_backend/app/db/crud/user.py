from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.sql import func
from typing import Optional, List
from app.db.model.user import LoginHistory, User
from app.db.schema.user import LoginHistoryCreate, UserCreate, UserUpdate
from app.core.security import hash_password, verify_password


#이메일로 유저 조회
async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


#아이디로 유저 조회
async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


#모든 유저 조회
async def get_all_users(db: AsyncSession) -> List[User]:
    result = await db.execute(select(User))
    return result.scalars().all()


#이메일+비밀번호 인증
async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


#유저 생성
async def create_user(db: AsyncSession, user: UserCreate) -> User:
    existing = await get_user_by_email(db, user.email)
    if existing:
        raise ValueError("EMAIL_ALREADY_EXISTS")

    hashed_pw = hash_password(user.password)
    db_user = User(
        email=user.email,
        password_hash=hashed_pw,
        name=user.name,
        nickname=user.nickname,
        phone=user.phone,
        role="USER",
        group_id=user.group_id,
        status=user.status or "ACTIVE",
        social_provider=user.social_provider,
        social_id=user.social_id,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


#유저 업데이트
async def update_user(
    db: AsyncSession,
    user_id: int,
    name: Optional[str] = None,
    nickname: Optional[str] = None,
    phone: Optional[str] = None,
    hashed_password: Optional[str] = None,
    status: Optional[str] = None,
    group_id: Optional[int] = None,
) -> Optional[User]:
    
    #유저ID로 유저 조회
    result = await db.execute(select(User).where(User.id == user_id))
    user_obj = result.scalar_one_or_none()

    if user_obj is None:
        return None  # 해당 ID의 유저를 찾지 못한 경우
    if name is not None:
        user_obj.name = name
    if nickname is not None:
        user_obj.nickname = nickname
    if phone is not None:
        user_obj.phone = phone
    if hashed_password is not None:
        user_obj.password_hash = hashed_password
    if status is not None:
        user_obj.status = status
    if group_id is not None:
        user_obj.group_id = group_id

    await db.commit()
    await db.refresh(user_obj)
    return user_obj


#유저 삭제
async def delete_user(db: AsyncSession, user_id: int) -> bool:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        return False

    await db.delete(user)
    await db.commit()
    return True


#로그인 성공 시각 업데이트
async def update_user_login_timestamp(db: AsyncSession, user_id: int):
    stmt = update(User).where(User.id == user_id).values(last_login_at=func.now())
    await db.execute(stmt)
    await db.commit()


#로그인 이력 기록
async def create_login_history(db: AsyncSession, history: LoginHistoryCreate) -> LoginHistory:
    db_history = LoginHistory(
        user_id=history.user_id,
        ip_address=history.ip_address,
        user_agent=history.user_agent,
        device_info=history.device_info,
        is_success=history.is_success,
    )
    db.add(db_history)
    await db.commit()
    await db.refresh(db_history)
    return db_history
