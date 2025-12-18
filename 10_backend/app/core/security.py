#비밀번호 암호화
import bcrypt


def hash_password(password: str) -> str:
    # bcrypt는 72바이트 제한이 있으므로 미리 잘라서 전달
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # bcrypt는 72바이트 제한이 있으므로 미리 잘라서 전달
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

