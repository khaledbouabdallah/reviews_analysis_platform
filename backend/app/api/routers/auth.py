# backend/app/api/routers/auth.py
from datetime import timedelta

from api.dependencies import get_current_active_user  # Add this import
from core.config import settings
from core.security import create_access_token, verify_password
from db.repositories.users import UserRepository
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from models.user import UserCreate, UserInDB
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["authentication"])
user_repo = UserRepository()


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):  # noqa: B008 - FastAPI dependency injection
    """Login endpoint that returns JWT token
    """
    # Get user by username
    user = await user_repo.get_by_username(form_data.username)

    # Verify user exists and password is correct
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is disabled
    if user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user",
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username, expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=dict)
async def register_user(user_data: dict):
    """Register new user (can be moved to users router if preferred)
    """
    # Validate input data
    try:
        user_create = UserCreate(**user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from e

    # Check if user already exists
    existing_user = await user_repo.get_by_username(user_create.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already registered",
        )

    existing_email = await user_repo.get_by_email(user_create.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create the user
    try:
        new_user = await user_repo.create(user_create)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user",
        ) from e

    return {"message": "User registered successfully", "user_id": str(new_user.id)}


@router.get("/me")
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):  # noqa: B008 - FastAPI dependency injection
    """Get current user info
    """
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "disabled": current_user.disabled,
    }


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(current_user: UserInDB = Depends(get_current_active_user)):  # noqa: B008 - FastAPI dependency injection
    """Delete the current user's account and all associated data
    """
    try:
        # Delete the user account
        await user_repo.delete(str(current_user.id))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account",
        ) from e
