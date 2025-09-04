# backend/app/services/email.py
import os
from typing import Optional
import resend
import httpx
from jinja2 import Environment, FileSystemLoader
from core.config import settings, logger
from core.security import create_verification_token


class EmailService:
    """Service for sending emails using SMTP or SendGrid"""
    
    def __init__(self):
        # Resend settings
        self.resend_api_key = settings.RESEND_API_KEY
        resend.api_key = self.resend_api_key
        self.from_email = "no-reply@reviewoly.com"
        self.frontend_url = "http://localhost:3000" if settings.ENVIRONMENT == "development" else "https://www.reviewoly.com"

        # Setup Jinja2 for email templates
        template_dir = os.path.join(os.path.dirname(__file__), "templates")
        os.makedirs(template_dir, exist_ok=True)
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))

    async def send_email_Resend(
        self,
        to_email: str,
        subject: str,
        html_content: str,
    ) -> bool:
        """Send email using Resend API"""
        if not self.resend_api_key:
            return False

        try:
            
            params: resend.Emails.SendParams = {
                "from": f"Reviewoly <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }

            email = resend.Emails.send(params)
            if email and email.id:
                return True
            logger.error(f"Failed to send email via Resend to {to_email}: {email.error}")
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
            success = await self.send_email_Resend(to_email, subject, html_content)
            if success:
                return True
       
    
    async def send_verification_email(self, email: str, username: str, verification_token: str) -> bool:
        """Send email verification email"""
        try:
            # Create verification URL
            verification_url = f"{self.frontend_url}/verify-email?token={verification_token}"

            # TODO: to implement
            # Render template (pass username and verification_url)
            template = self.jinja_env.get_template("email_verification.html")
            html_content = template.render(
                username=username,
                verification_url=verification_url,
                app_name="reviewoly"
            )

            return await self.send_email(
                to_email=email,
                subject="Verify Your Email Address - Reviewoly",
                html_content=html_content,
            )
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {e}")
            return False


# Global email service instance
email_service = EmailService()