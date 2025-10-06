# core/security.py

from datetime import datetime, timedelta, timezone
import secrets
import bcrypt  # ← CHANGED: direct import instead of passlib
from core.config import settings
from jose import jwt

# ← REMOVED: pwd_context = CryptContext(...)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash using bcrypt directly"""
    if not plain_password or not hashed_password:
        return False
    try:
        # bcrypt requires bytes
        password_bytes = plain_password.encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)  # ← CHANGED
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt directly"""
    # bcrypt requires bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt(rounds=12)  # ← CHANGED
    hashed = bcrypt.hashpw(password_bytes, salt)  # ← CHANGED
    # Return as string
    return hashed.decode('utf-8')

# JWT utilities - UNCHANGED
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