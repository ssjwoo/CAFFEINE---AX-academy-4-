#비밀번호 암호화
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    # passlib이 내부적으로 처리하지만, 명시적으로 문자열 타입 보장
    return pwd_context.hash(str(password))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
