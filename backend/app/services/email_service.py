import os
from pathlib import Path

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr

from app.core.config import get_settings

settings = get_settings()

conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.FROM_EMAIL or settings.SMTP_USER,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

fast_mail = FastMail(conf)

async def send_otp_email(email: EmailStr, otp: str):
    html = f"""
    <html>
    <body>
        <h2>Welcome to Zettl!</h2>
        <p>Your one-time password (OTP) for registration is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; color: #4F46E5;">{otp}</h1>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="Zettl Registration OTP",
        recipients=[email],
        body=html,
        subtype=MessageType.html,
    )

    await fast_mail.send_message(message)
