# backend/app/services/email.py
import os
import base64
from typing import Optional
import resend
import httpx
from jinja2 import Environment, FileSystemLoader
from core.config import settings, logger
from core.security import create_verification_token


class EmailService:
    """Service for sending emails using Resend API"""
    
    def __init__(self):
        # Resend settings
        self.resend_api_key = settings.RESEND_API_KEY
        resend.api_key = self.resend_api_key
        self.from_email = "no-reply@reviewoly.com"
        self.frontend_url = "http://localhost:3000" if settings.ENVIRONMENT == "development" else "https://www.reviewoly.com"

        # Setup Jinja2 for email templates - point to correct directory
        current_dir = os.path.dirname(__file__)  # backend/app/services/
        app_dir = os.path.dirname(current_dir)   # backend/app/
        backend_dir = os.path.dirname(app_dir)   # backend/
        template_dir = os.path.join(backend_dir, "static", "email_templates")
        
        if not os.path.exists(template_dir):
            logger.error(f"Email template directory not found: {template_dir}")
            raise FileNotFoundError(f"Email template directory not found: {template_dir}")
            
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))
        
        # Load and encode logo once at startup
        self.logo_base64 = self._load_logo_as_base64()

    def _load_logo_as_base64(self) -> str:
        """Load logo and convert to base64 data URL"""
        try:
            # Path to your logo file
            current_dir = os.path.dirname(__file__)  # backend/app/services/
            app_dir = os.path.dirname(current_dir)   # backend/app/
            backend_dir = os.path.dirname(app_dir)   # backend/
            logo_path = os.path.join(backend_dir, "static", "images", "logo.png")
            
            if os.path.exists(logo_path):
                with open(logo_path, "rb") as image_file:
                    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                    logger.info(f"Logo loaded successfully from {logo_path}")
                    return f"data:image/png;base64,{encoded_string}"
            else:
                logger.warning(f"Logo not found at {logo_path}")
                return ""  # Fallback to no logo
                
        except Exception as e:
            logger.error(f"Failed to load logo: {e}")
            return ""

    async def send_email_Resend(
        self,
        to_email: str,
        subject: str,
        html_content: str,
    ) -> bool:
        """Send email using Resend API"""
        if not self.resend_api_key:
            logger.warning("Resend API key not configured")
            return False

        try:
            logger.info("okey 1")
            params: resend.Emails.SendParams = {
                "from": f"Reviewoly <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }


            email = resend.Emails.send(params)

            if email and email.get("id"):
                logger.info(f"Email sent successfully via Resend to {to_email}, ID: {email.get('id')}")
                return True
            logger.error(f"Failed to send email via Resend to {to_email}: {getattr(email, 'error', 'Unknown error')}")
            return False

        except Exception as e:
            logger.error(f"Failed to send email via Resend to {to_email}: {e}")
            return False
        
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
    ) -> bool:
        """Send email using best available method"""
        # Try Resend first (more reliable for production)
        if self.resend_api_key:
            logger.info(f"Attempting to send email via Resend to {to_email}")
            success = await self.send_email_Resend(to_email, subject, html_content)
            if success:
                return True
        
        logger.error(f"All email sending methods failed for {to_email}")
        return False

    async def send_verification_email(self, email: str, username: str, verification_token: str) -> bool:
        """Send email verification email"""
        try:
            # Create verification URL
            verification_url = f"{self.frontend_url}/verify-email?token={verification_token}"

            # Render template with all variables including logo
            template = self.jinja_env.get_template("email_verification.html")
            html_content = template.render(
                username=username,
                verification_url=verification_url,
                app_name="Reviewoly",
                logo_base64=self.logo_base64
            )

            success = await self.send_email(
                to_email=email,
                subject="Verify Your Email Address - Reviewoly",
                html_content=html_content,
            )
            
            if success:
                logger.info(f"Verification email sent successfully to {email}")
            else:
                logger.error(f"Failed to send verification email to {email}")
                
            return success
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {e}")
            return False

    async def send_password_reset_email(self, email: str, username: str, reset_token: str) -> bool:
        """Send password reset email (for future use)"""
        try:
            # Create reset URL
            reset_url = f"{self.frontend_url}/reset-password?token={reset_token}"

            # You can create a password_reset.html template later
            template = self.jinja_env.get_template("password_reset.html")
            html_content = template.render(
                username=username,
                reset_url=reset_url,
                app_name="Reviewoly",
                logo_base64=self.logo_base64
            )

            success = await self.send_email(
                to_email=email,
                subject="Reset Your Password - Reviewoly",
                html_content=html_content,
            )
            
            if success:
                logger.info(f"Password reset email sent successfully to {email}")
            else:
                logger.error(f"Failed to send password reset email to {email}")
                
            return success
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {email}: {e}")
            return False


# Global email service instance
email_service = EmailService()