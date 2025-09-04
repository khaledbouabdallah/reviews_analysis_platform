# backend/app/services/email.py
import os
from typing import Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
import httpx
from jinja2 import Environment, FileSystemLoader
from core.config import settings, logger
from core.security import create_verification_token


class EmailService:
    """Service for sending emails using SMTP or SendGrid"""
    
    def __init__(self):
        # Email settings from environment
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        
        # SendGrid settings (preferred for production)
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        
        # Setup Jinja2 for email templates
        template_dir = os.path.join(os.path.dirname(__file__), "templates")
        os.makedirs(template_dir, exist_ok=True)
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))
        
    async def send_email_smtp(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email using SMTP"""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = to_email
            
            # Add text and HTML parts
            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))
            
            # Send email
            await aiosmtplib.send(
                msg,
                hostname=self.smtp_server,
                port=self.smtp_port,
                start_tls=True,
                username=self.smtp_username,
                password=self.smtp_password,
            )
            
            logger.info(f"Email sent successfully to {to_email} via SMTP")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_email}: {e}")
            return False
    
    async def send_email_sendgrid(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email using SendGrid API"""
        if not self.sendgrid_api_key:
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.sendgrid_api_key}",
                "Content-Type": "application/json"
            }
            
            content = [{"type": "text/html", "value": html_content}]
            if text_content:
                content.insert(0, {"type": "text/plain", "value": text_content})
            
            data = {
                "personalizations": [{
                    "to": [{"email": to_email}],
                    "subject": subject
                }],
                "from": {"email": self.from_email},
                "content": content
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    json=data,
                    headers=headers
                )
                
                if response.status_code == 202:
                    logger.info(f"Email sent successfully to {to_email} via SendGrid")
                    return True
                else:
                    logger.error(f"SendGrid API error: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to send email via SendGrid to {to_email}: {e}")
            return False
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email using best available method"""
        # Try SendGrid first (more reliable for production)
        if self.sendgrid_api_key:
            success = await self.send_email_sendgrid(to_email, subject, html_content, text_content)
            if success:
                return True
        
        # Fallback to SMTP
        if self.smtp_username and self.smtp_password:
            return await self.send_email_smtp(to_email, subject, html_content, text_content)
        
        logger.error("No email service configured")
        return False
    
    async def send_verification_email(self, email: str, username: str, verification_token: str) -> bool:
        """Send email verification email"""
        try:
            # Create verification URL
            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            verification_url = f"{base_url}/verify-email?token={verification_token}"
            
            # Render template
            template = self.jinja_env.get_template("email_verification.html")
            html_content = template.render(
                username=username,
                verification_url=verification_url,
                app_name="reviewoly"
            )
            
            # Text version
            text_content = f"""
Hello {username},

Thank you for signing up! Please verify your email address by clicking the link below:

{verification_url}

If you didn't create an account, please ignore this email.

Best regards,
reviewoly Team
            """
            
            return await self.send_email(
                to_email=email,
                subject="Verify Your Email Address - reviewoly",
                html_content=html_content,
                text_content=text_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {e}")
            return False


# Global email service instance
email_service = EmailService()


# Create email template if it doesn't exist
def create_email_template():
    """Create default email verification template"""
    template_dir = os.path.join(os.path.dirname(__file__), "templates")
    template_path = os.path.join(template_dir, "email_verification.html")
    
    if not os.path.exists(template_path):
        os.makedirs(template_dir, exist_ok=True)
        
        template_content = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to {{ app_name }}!</h1>
    </div>
    
    <div class="content">
        <h2>Hi {{ username }},</h2>
        
        <p>Thank you for signing up for {{ app_name }}! To complete your registration, please verify your email address by clicking the button below:</p>
        
        <p style="text-align: center;">
            <a href="{{ verification_url }}" class="button">Verify Email Address</a>
        </p>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px;">{{ verification_url }}</p>
        
        <p>This link will expire in 24 hours for security reasons.</p>
        
        <p>If you didn't create an account with us, please ignore this email.</p>
        
        <p>Best regards,<br>The {{ app_name }} Team</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message, please do not reply to this email.</p>
    </div>
</body>
</html>"""
        
        with open(template_path, "w") as f:
            f.write(template_content)
        
        logger.info(f"Created email template at {template_path}")


# Create template on import
create_email_template()