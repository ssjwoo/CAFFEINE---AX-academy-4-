# 10_backend/app/core/security.py
"""
보안 유틸리티 모듈 (v1.0 실제 구현)

이 모듈은 Caffeine 프로젝트의 핵심 보안 기능을 제공합니다.

주요 기능:
- JWT 토큰 생성 및 검증 (python-jose 사용)
- 비밀번호 해싱 및 검증 (bcrypt 사용)
- 부분적 PII 암호화 (Fernet 대칭키 암호화)
- 라이트 RBAC (Role-Based Access Control)

작성일: 2025-12-03
버전: 1.0.0
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import os

# ============================================================
# JWT (JSON Web Token) 설정
# ============================================================
# JWT는 사용자 인증을 위해 사용됩니다.
# 로그인 성공 시 토큰을 발급하고, 이후 요청에서 토큰을 검증합니다.

# 비밀 키: JWT 서명에 사용 (반드시 환경 변수로 관리)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
# 알고리즘: HS256 (HMAC with SHA-256) 사용
ALGORITHM = os.getenv("ALGORITHM", "HS256")
# 토큰 만료 시간: 기본 30분
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# ============================================================
# 비밀번호 해싱 (bcrypt)
# ============================================================
# 사용자 비밀번호를 안전하게 저장하기 위해 bcrypt 해시 알고리즘을 사용합니다.
# 비밀번호를 절대 평문으로 저장하지 않습니다.

# bcrypt Context 생성 (deprecated 옵션으로 구버전 알고리즘 제외)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    사용자가 입력한 비밀번호가 저장된 해시와 일치하는지 검증합니다.
    
    로그인 시 사용:
    1. 사용자가 비밀번호 입력
    2. DB에서 저장된 해시 가져오기
    3. 이 함수로 검증
    
    Args:
        plain_password: 사용자가 입력한 평문 비밀번호
        hashed_password: DB에 저장된 해시된 비밀번호
    
    Returns:
        bool: 일치하면 True, 불일치하면 False
    
    예시:
        >>> verify_password("password123", "$2b$12$...")
        True
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    비밀번호를 해싱하여 안전하게 저장할 수 있는 형태로 변환합니다.
    
    회원가입 시 사용:
    1. 사용자가 비밀번호 입력
    2. 이 함수로 해싱
    3. 해시값을 DB에 저장
    
    Args:
        password: 사용자의 평문 비밀번호
    
    Returns:
        str: bcrypt로 해시된 비밀번호 (약 60자)
    
    예시:
        >>> get_password_hash("password123")
        "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p..."
    """
    return pwd_context.hash(password)

# ============================================================
# JWT 토큰 생성 및 검증
# ============================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    사용자 정보를 담은 JWT 액세스 토큰을 생성합니다.
    
    로그인 성공 시 호출하여 토큰을 발급합니다.
    토큰에는 사용자 ID, 이메일, 역할(role) 등의 정보를 포함할 수 있습니다.
    
    Args:
        data: 토큰에 포함할 데이터 (예: {"sub": "user@example.com", "role": "user"})
        expires_delta: 토큰 만료 시간 (None이면 기본값 30분 사용)
    
    Returns:
        str: JWT 토큰 문자열
    
    예시:
        >>> token = create_access_token({"sub": "user@example.com", "role": "admin"})
        >>> print(token)
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    """
    # 원본 데이터 복사 (원본 수정 방지)
    to_encode = data.copy()
    
    # 만료 시간 설정
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 토큰에 만료 시간 추가
    to_encode.update({"exp": expire})
    
    # JWT 토큰 생성 (data + SECRET_KEY로 서명)
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """
    JWT 토큰을 검증하고 페이로드를 반환합니다.
    
    API 요청 시 Authorization 헤더의 토큰을 검증하는 데 사용합니다.
    토큰이 유효하지 않거나 만료되었으면 None을 반환합니다.
    
    Args:
        token: 검증할 JWT 토큰 문자열
    
    Returns:
        dict: 토큰이 유효하면 페이로드 반환, 무효하면 None
    
    예시:
        >>> payload = verify_token("eyJhbGciOiJIUzI1NiIs...")
        >>> print(payload)
        {"sub": "user@example.com", "role": "admin", "exp": 1234567890}
    """
    try:
        # 토큰 디코딩 및 서명 검증
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # 토큰이 잘못되었거나 만료된 경우
        return None

# ============================================================
# 라이트 RBAC (Role-Based Access Control)
# ============================================================
# v1.0에서는 간단한 2단계 역할 시스템만 구현합니다:
# - user: 일반 사용자 (자신의 데이터만 조회/수정 가능)
# - admin: 관리자 (모든 데이터 조회/수정 가능)

def check_role(user_role: str, required_role: str) -> bool:
    """
    사용자의 역할이 요구되는 역할을 만족하는지 확인합니다.
    
    역할 계층 구조:
    - admin (레벨 2): 최고 권한, 모든 작업 가능
    - user (레벨 1): 일반 사용자, 자신의 데이터만 접근
    
    Args:
        user_role: 사용자의 현재 역할 ("user" 또는 "admin")
        required_role: 엔드포인트가 요구하는 최소 역할
    
    Returns:
        bool: 권한이 충분하면 True, 부족하면 False
    
    예시:
        >>> check_role("admin", "user")  # admin은 user 역할 포함
        True
        >>> check_role("user", "admin")  # user는 admin 역할 불가
        False
    """
    # 역할별 우선순위 레벨
    role_hierarchy = {
        'admin': 2,  # 최상위
        'user': 1,   # 일반
    }
    
    # 사용자 역할의 레벨
    user_level = role_hierarchy.get(user_role, 0)
    # 요구되는 역할의 레벨
    required_level = role_hierarchy.get(required_role, 0)
    
    # 사용자 레벨이 요구 레벨 이상이면 True
    return user_level >= required_level

# ============================================================
# 부분적 PII 암호화 (Fernet 대칭키 암호화)
# ============================================================
# v1.0에서는 카드번호와 전화번호만 암호화합니다.
# 다른 개인 정보는 일반 DB 컬럼에 저장합니다.

# 암호화 키 로드 (환경 변수에서)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if ENCRYPTION_KEY:
    cipher = Fernet(ENCRYPTION_KEY.encode())
else:
    # 환경 변수가 없으면 임시 키 생성 (개발용, 프로덕션에서는 반드시 설정 필요)
    cipher = Fernet(Fernet.generate_key())
    import warnings
    warnings.warn("⚠️ ENCRYPTION_KEY가 설정되지 않았습니다. 임시 키를 사용합니다.")

def encrypt_card_number(card_number: str) -> dict:
    """
    카드번호를 암호화하고 마스킹된 버전도 함께 반환합니다.
    
    카드번호 전체는 암호화하여 DB에 저장하고,
    UI 표시용으로 마지막 4자리만 노출하는 마스킹 버전도 제공합니다.
    
    Args:
        card_number: 16자리 카드번호 (예: "1234567812345678")
    
    Returns:
        dict: {
            "masked": "****-****-****-5678",  # UI 표시용
            "encrypted": "gAAAAA..."           # DB 저장용 (암호화됨)
        }
    
    예시:
        >>> encrypt_card_number("1234567812345678")
        {
            "masked": "****-****-****-5678",
            "encrypted": "gAAAAABhXYZ..."
        }
    """
    # 입력 검증
    if not card_number or len(card_number) < 4:
        return {"masked": "****", "encrypted": None}
    
    # 마지막 4자리 추출
    last_four = card_number[-4:]
    
    # 전체 카드번호 암호화 (Fernet)
    encrypted = cipher.encrypt(card_number.encode()).decode()
    
    return {
        "masked": f"****-****-****-{last_four}",  # UI에 표시
        "encrypted": encrypted                      # DB에 저장
    }

def decrypt_card_number(encrypted: str) -> str:
    """
    암호화된 카드번호를 복호화합니다.
    
    관리자가 전체 카드번호를 확인해야 할 때 사용합니다.
    (예: 카드 정지 요청 처리, 본인 확인 등)
    
    Args:
        encrypted: 암호화된 카드번호
    
    Returns:
        str: 복호화된 원본 카드번호, 실패 시 None
    
    예시:
        >>> decrypt_card_number("gAAAAABhXYZ...")
        "1234567812345678"
    """
    try:
        return cipher.decrypt(encrypted.encode()).decode()
    except Exception:
        return None

def encrypt_phone_number(phone: str) -> str:
    """
    전화번호를 암호화합니다.
    
    전화번호는 전체를 암호화하여 DB에 저장합니다.
    카드번호와 달리 마스킹 버전은 제공하지 않습니다.
    
    Args:
        phone: 전화번호 (예: "010-1234-5678")
    
    Returns:
        str: 암호화된 전화번호
    
    예시:
        >>> encrypt_phone_number("010-1234-5678")
        "gAAAAABhXYZ..."
    """
    return cipher.encrypt(phone.encode()).decode()

def decrypt_phone_number(encrypted: str) -> str:
    """
    암호화된 전화번호를 복호화합니다.
    
    Args:
        encrypted: 암호화된 전화번호
    
    Returns:
        str: 복호화된 원본 전화번호, 실패 시 None
    
    예시:
        >>> decrypt_phone_number("gAAAAABhXYZ...")
        "010-1234-5678"
    """
    try:
        return cipher.decrypt(encrypted.encode()).decode()
    except Exception:
        return None

def mask_name(name: str) -> str:
    """
    이름을 마스킹 처리합니다 (간단한 개인정보 보호).
    
    중간 글자를 *로 대체하여 이름을 부분적으로 숨깁니다.
    암호화는 하지 않고 마스킹만 수행합니다.
    
    Args:
        name: 사용자 이름
    
    Returns:
        str: 마스킹된 이름
    
    예시:
        >>> mask_name("홍길동")
        "홍*동"
        >>> mask_name("김철수")
        "김*수"
        >>> mask_name("이순")
        "이*"
    """
    if len(name) <= 2:
        return name[0] + "*"
    return name[0] + "*" * (len(name) - 2) + name[-1]
