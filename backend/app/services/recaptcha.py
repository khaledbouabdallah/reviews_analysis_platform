# backend/app/services/recaptcha.py
import httpx
from core.config import settings, logger
from fastapi import HTTPException, status


class RecaptchaService:
    """Service for verifying Google reCAPTCHA Enterprise tokens"""
    
    RECAPTCHA_SERVER_URL = settings.RECAPTCHA_URL
    SITE_KEY = settings.RECAPTCHA_SITE_KEY
    MIN_SCORE = 0.5  # Minimum score for reCAPTCHA v3 (0.0-1.0)
    
    @classmethod
    async def verify_token(cls, token: str, expected_action: str = "submit") -> bool:
        """
        Verify reCAPTCHA Enterprise token with Google's API
        
        Args:
            token: The reCAPTCHA token from frontend
            expected_action: Expected action name (default: "submit")
            
        Returns:
            bool: True if verification passes
            
        Raises:
            HTTPException: If verification fails
        """
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="reCAPTCHA token is required"
            )
        
        try:
            async with httpx.AsyncClient() as client:
                
                data = {
                    "event": {
                        "token": token,
                        "siteKey": cls.SITE_KEY,
                        "expectedAction": expected_action
                    }
                }
                
                print("reCAPTCHA URL:", cls.RECAPTCHA_SERVER_URL)  # Debugging line
                                
                response = await client.post(
                    cls.RECAPTCHA_SERVER_URL,
                    json=data,
                )
                
                result = response.json()
                
                print("reCAPTCHA response:", result)  # Debugging line
                
                # FIXED: Check Enterprise response structure
                token_properties = result.get("tokenProperties", {})
                risk_analysis = result.get("riskAnalysis", {})
                
                # Check if token is valid
                token_valid = token_properties.get("valid", False)
                if not token_valid:
                    invalid_reason = token_properties.get("invalidReason", "Unknown")
                    logger.warning(f"reCAPTCHA token invalid: {invalid_reason}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="reCAPTCHA verification failed - invalid token"
                    )
                
                # Check score for v3 (optional but recommended)
                score = risk_analysis.get("score", 0.0)
                if score < cls.MIN_SCORE:
                    logger.warning(f"reCAPTCHA score too low: {score}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="reCAPTCHA verification failed - low score"
                    )
                
                # Check action if provided
                action = token_properties.get("action", "")
                if expected_action and action != expected_action:
                    logger.warning(f"reCAPTCHA action mismatch: expected {expected_action}, got {action}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="reCAPTCHA verification failed - invalid action"
                    )
                
                logger.info(f"reCAPTCHA verification successful - Score: {score}, Action: {action}")
                return True
                
        except httpx.RequestError as e:
            logger.error(f"reCAPTCHA verification network error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="reCAPTCHA verification service unavailable"
            )
        except HTTPException:
            # Re-raise HTTPExceptions (our custom validation errors)
            raise
        except Exception as e:
            logger.error(f"reCAPTCHA verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="reCAPTCHA verification error"
            )


# Convenience function for easy import
async def verify_recaptcha(token: str, action: str = "submit") -> bool:
    """Convenience function to verify reCAPTCHA token"""
    return await RecaptchaService.verify_token(token, action)