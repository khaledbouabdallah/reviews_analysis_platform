from datetime import datetime, timedelta, timezone
import secrets
from core.config import settings
from jose import jwt
from passlib.context import CryptContext

# Password utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# JWT utilities
def create_access_token(subject: str, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )

    to_encode = {"exp": expire, "sub": subject}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

def create_verification_token() -> str:
    """Create a secure verification token"""
    return secrets.token_urlsafe(32)


def create_verification_token_with_expiry() -> tuple[str, datetime]:
    """Create verification token with expiry time (24 hours)"""
    token = create_verification_token()
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    return token, expires


def is_valid_email(email: str) -> bool:
    """Basic email validation (additional to Pydantic EmailStr)"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))