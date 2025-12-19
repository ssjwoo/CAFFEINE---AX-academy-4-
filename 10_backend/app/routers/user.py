from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, List
from jose import JWTError
from app.db.database import get_db
from app.db.model.user import User as UserModel
from app.db.crud import user as user_crud
from app.db.schema.auth import LoginRequest, LoginResponse, Token
from app.db.schema.user import UserCreate, UserResponse, UserUpdate
from app.services.user import (register_user, login_user, update_user, delete_user, get_all_users,)
from app.core.jwt import verify_access_token

# 라우터 설정
router = APIRouter(prefix="/users", tags=["users"])

DB_Dependency = Annotated[AsyncSession, Depends(get_db)]
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# 현재 인증된 유저 정보 가져오기
async def get_current_user(db: DB_Dependency, token: str = Depends(oauth2_scheme)) -> UserModel:
    try:
        payload = verify_access_token(token)
        user_id_str: str = payload.get("sub")  # 토큰에서 사용자 ID(sub) 추출
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials (No user ID)",
            )
        user_id = int(user_id_str)

    except JWTError:
        # 토큰 디코딩 실패 (만료되었거나 서명이 유효하지 않음)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials (JWTError)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        # verify_access_token에서 발생한 기타 예외 처리
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await user_crud.get_user_by_id(db, user_id)

    if user is None:
        # 토큰은 유효하지만 DB에 해당 유저가 없는 경우 (삭제된 계정)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

# 인증된 유저 의존성 타입
Auth_Dependency = Annotated[UserModel, Depends(get_current_user)]

# 로그인
@router.post("/login", response_model=Token)
async def login_for_user(
    user: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
    user_agent: str | None = Header(default=None),
):
    try:
        email = user.username
        result = await login_user(
            db,
            email=email,
            password=user.password,
            user_agent=user_agent,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {"access_token": result["access_token"], "refresh_token": result["refresh_token"], "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"\n\n=== LOGIN ERROR ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {str(e)}")
        print(f"Traceback:")
        traceback.print_exc()
        print(f"===================\n\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


#유저 생성
@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate, db: DB_Dependency):
    new_user = await register_user(db, payload)
    return new_user


#사용자 조회
@router.get("/me", response_model=UserResponse)
async def get_authenticated_user(current_user: Auth_Dependency):
    return current_user


# Admin: Get all users (requires superuser)
@router.get("/", response_model=List[UserResponse])
async def read_all_users_route(
    db: DB_Dependency, 
    current_user: Auth_Dependency,
    skip: int = 0,
    limit: int = 100
):
    """Get all users (Admin only - requires authentication)"""
    # Note: This endpoint is for admin purposes
    # For production, consider adding superuser check:
    # if not current_user.is_superuser:
    #     raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await get_all_users(db)
    return users[skip:skip + limit]


#유저 삭제
@router.delete("/me", status_code=status.HTTP_200_OK)
async def del_user(db: DB_Dependency, current_user: Auth_Dependency):
    msg = await delete_user(db, current_user.id)
    return msg


#유저 업데이트
@router.patch("/me", response_model=UserResponse)
async def upd_user(
    user_data: UserUpdate,  # 클라이언트가 보낸 수정 데이터
    db: DB_Dependency,
    current_user: Auth_Dependency,  # 현재 로그인된 사용자 정보 (UserModel 인스턴스)
):
    mod_user = await update_user(
        db,
        current_user.id,
        user_data,
    )
    return mod_user
