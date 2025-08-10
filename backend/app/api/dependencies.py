# backend/app/api/dependencies.py
from core.security import decode_access_token
from fastapi import Depends, HTTPException, Request, status
from jose import JWTError
from models.user import UserInDB


# **NEW: Cookie-based token extractor instead of OAuth2PasswordBearer**
async def get_token_from_cookie(request: Request) -> str:
    """Extract JWT token from httpOnly cookie"""
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return token


# **CHANGED: Use cookie extractor instead of oauth2_scheme**
async def get_current_user(token: str = Depends(get_token_from_cookie)) -> UserInDB:
    """Get current user from JWT token"""
    from db.repositories.users import (
        UserRepository,  # Import here to avoid circular imports
    )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        # Decode JWT token
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    except Exception:
        raise credentials_exception

    # Get user from database
    user_repo = UserRepository()
    user = await user_repo.get_by_username(username)
    if user is None:
        raise credentials_exception

    return user


# **UNCHANGED: These functions remain exactly the same**
async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    """Get current active user (not disabled)"""
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user


async def get_current_admin_user(
    current_user: UserInDB = Depends(get_current_active_user),
) -> UserInDB:
    """Get current admin user (for future role-based access)"""
    # For now, all active users are admins
    # Later you can add role field to User model
    return current_user
