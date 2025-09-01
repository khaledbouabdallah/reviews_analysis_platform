# backend/app/api/routers/auth.py
from datetime import timedelta

from api.dependencies import get_current_active_user  # Add this import
from core.config import logger, settings
from core.security import (
    create_access_token, 
    verify_password, 
    create_verification_token_with_expiry,
    get_password_hash
)
from db.repositories.users import UserRepository
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from models.user import (
    UserCreate, 
    UserInDB, 
    EmailVerificationRequest,
    ResendVerificationRequest
)
from pydantic import BaseModel
from services.recaptcha import verify_recaptcha
from services.email import email_service

router = APIRouter(prefix="/auth", tags=["authentication"])
user_repo = UserRepository()


class LoginResponse(BaseModel):
    message: str
    username: str


class TokenData(BaseModel):
    username: str | None = None


@router.post("/login", response_model=LoginResponse)
async def login_for_access_token(
    response: Response, form_data: OAuth2PasswordRequestForm = Depends()
):
    """Login endpoint that sets httpOnly cookie"""

    user = await user_repo.get_by_username(form_data.username)

    # Verify user exists and password is correct
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # Check if user is disabled
    if user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # Check if email is verified (optional - you can comment this out if not required)
    # if not user.email_verified:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Please verify your email address before logging in",
    #     )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username,
        expires_delta=access_token_expires,
    )

    if settings.ENVIRONMENT == "development":
        response.set_cookie(
            key="token",
            value=access_token,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            httponly=True,
            secure=True,  # Only send over HTTPS in production
            samesite="strict",  # CSRF protection
        )
    elif settings.ENVIRONMENT == "production":
        response.set_cookie(
            key="token",
            value=access_token,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            httponly=True,
            secure=True,  # Only send over HTTPS in production
            samesite="none",  # CSRF protection
        )

    logger.info(f"User {user.username} logged in successfully")
    return {"message": "Login successful", "username": user.username}


# **NEW: Logout endpoint to clear cookie**
@router.post("/logout")
async def logout(response: Response):
    """Logout endpoint that clears the httpOnly cookie"""
    response.delete_cookie(
        key="token",
        httponly=True,
        secure=True,
        samesite="strict",
    )
    return {"message": "Logout successful"}


@router.post("/register", response_model=dict)
async def register_user(user_data: UserCreate):
    """Register new user with reCAPTCHA and email verification"""
    
    # Verify reCAPTCHA first
    await verify_recaptcha(user_data.recaptcha_token, "signup")
    
    # Check if user already exists
    existing_user = await user_repo.get_by_username(user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    
    # Check if email already exists
    if user_data.email:
        existing_email = await user_repo.get_by_email(user_data.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
    
    try:
        # Create verification token
        verification_token, token_expires = create_verification_token_with_expiry()
        
        hashed_password = get_password_hash(user_data.password)
                
        # Create user data for database
        user_db_data = {
            "username": user_data.username,
            "email": user_data.email,
            "hashed_password": hashed_password,
            "verification_token": verification_token,
            "verification_token_expires": token_expires,
            "subscription_tier": user_data.subscription_tier
        }
            
        # Create user in database
        user_id = await user_repo.create(user_db_data)
        
        # Send verification email
        email_sent = await email_service.send_verification_email(
            email=user_data.email,
            username=user_data.username,
            verification_token=verification_token
        )
        
        if not email_sent:
            logger.warning(f"Failed to send verification email to {user_data.email}")
            # Don't fail registration if email fails, but warn the user
        
        logger.info(f"User {user_data.username} registered successfully")
        
        return {
            "message": "Registration successful. Please check your email to verify your account.",
            "user_id": str(user_id),
            "email_sent": email_sent
        }
        
    except Exception as e:
        logger.error(f"Registration failed for {user_data.username}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )


@router.post("/verify-email")
async def verify_email(verification_data: EmailVerificationRequest):
    """Verify user email with verification token"""
    
    if not verification_data.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token is required"
        )
    
    # Find user by verification token
    user = await user_repo.get_by_verification_token(verification_data.token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )
    
    # Check if token is expired
    if not user.is_verification_token_valid():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )
    
    # Check if already verified
    if user.email_verified:
        return {"message": "Email already verified"}
    
    try:
        # Update user as verified and clear verification token
        await user_repo.update(user.id, {
            "email_verified": True,
            "verification_token": None,
            "verification_token_expires": None
        })
        
        logger.info(f"Email verified successfully for user {user.username}")
        
        return {"message": "Email verified successfully"}
        
    except Exception as e:
        logger.error(f"Email verification failed for token {verification_data.token}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed. Please try again."
        )


@router.post("/resend-verification")
async def resend_verification_email(request: ResendVerificationRequest):
    """Resend email verification link"""
    
    # Verify reCAPTCHA
    await verify_recaptcha(request.recaptcha_token, "resend_verification")
    
    # Find user by email
    user = await user_repo.get_by_email(request.email)
    
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a verification link has been sent"}
    
    # Check if already verified
    if user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )
    
    try:
        # Create new verification token
        verification_token, token_expires = create_verification_token_with_expiry()
        
        # Update user with new token
        await user_repo.update(user.id, {
            "verification_token": verification_token,
            "verification_token_expires": token_expires
        })
        
        # Send verification email
        email_sent = await email_service.send_verification_email(
            email=user.email,
            username=user.username,
            verification_token=verification_token
        )
        
        if email_sent:
            logger.info(f"Verification email resent to {request.email}")
        else:
            logger.warning(f"Failed to resend verification email to {request.email}")
        
        return {"message": "If the email exists, a verification link has been sent"}
        
    except Exception as e:
        logger.error(f"Failed to resend verification email to {request.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resend verification email. Please try again."
        )


@router.get("/me")
async def get_current_user_info(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get current user information"""
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "email_verified": current_user.email_verified,
        "disabled": current_user.disabled,
        "created_at": current_user.created_at.isoformat(),
        "subscription": current_user.subscription
    }