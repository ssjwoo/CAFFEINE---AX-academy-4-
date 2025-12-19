from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.core.security import hash_password, verify_password
from app.core.jwt import create_access_token, create_refresh_token
from app.db.crud import user as user_crud
from app.db.schema.user import UserCreate, UserUpdate, LoginHistoryCreate

#회원가입
async def register_user(db: AsyncSession, user_data: UserCreate):
    existing_email = await user_crud.get_user_by_email(db, user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    return await user_crud.create_user(db, user_data)

#로그인
async def login_user(
    db: AsyncSession,
    email: str,
    password: str,
    ip_address: str | None = None,
    user_agent: str | None = None,
    device_info: str | None = None,
) -> dict | None:
    user = await user_crud.authenticate_user(db, email, password)
    if not user:
        return None

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token({"sub": str(user.id), "email": user.email})

    await user_crud.update_user_login_timestamp(db, user.id)
    await user_crud.create_login_history(
        db,
        LoginHistoryCreate(
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info,
            is_success=True,
        ),
    )

    return {
        "user": user,
        "access_token": access_token,
        "refresh_token": refresh_token,
    }

#유저 정보 조회
async def get_user(db: AsyncSession, email: str):
    user = await user_crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

#모든 유저 정보 조회
async def get_all_users(db: AsyncSession):
    return await user_crud.get_all_users(db)

#유저 업데이트
async def update_user(db: AsyncSession, user_id: int, user_data: UserUpdate):
    hashed_password = None
    if user_data.password:
        hashed_password = hash_password(user_data.password)

    updated_user = await user_crud.update_user(
        db,
        user_id=user_id,
        name=user_data.name,
        nickname=user_data.nickname,
        phone=user_data.phone,
        hashed_password=hashed_password,
        status=user_data.status,
        group_id=user_data.group_id,
        push_token=user_data.push_token,
        budget_limit=user_data.budget_limit,
        budget_alert_enabled=user_data.budget_alert_enabled,
        birth_date=user_data.birth_date,
        is_active=user_data.is_active,
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return updated_user

#유저 삭제
async def delete_user(db: AsyncSession, user_id: int):
    is_deleted = await user_crud.delete_user(db, user_id)
    if not is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return {"message": "User deleted successfully"}
