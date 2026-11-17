from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field
import os
from pathlib import Path

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    MONGODB_USERNAME: str = Field(default="", description="MongoDB Atlas username")
    MONGODB_PASSWORD: str = Field(default="", description="MongoDB Atlas password")
    MONGODB_URI: str = Field(default="", description="MongoDB Atlas connection string")
    DATABASE_NAME: str = Field(default="chronos_db", description="Database name")
    
    JWT_SECRET_KEY: str = Field(
        default="chronos_jwt_super_secret_key_prod_2026_matrix_secure",
        description="Secret key for JWT generation and verification"
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT Algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=43200, description="Token expiration in minutes (30 days)")
    
    ENVIRONMENT: str = Field(default="production", description="Environment: development or production")
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000,https://personal-time-management-matrix.pages.dev",
        description="Comma-separated allowed origins"
    )
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)

    # Email & SMTP Settings
    SMTP_HOST: str = Field(default="smtp.gmail.com")
    SMTP_PORT: int = Field(default=587)
    SMTP_USER: str = Field(default="engineerleobeni@gmail.com")
    GMAIL_APP_PASSWORD: str = Field(default="lygz ltwu itmf mrtz")
    SMTP_PASSWORD: str = Field(default="lygz ltwu itmf mrtz")
    SMTP_FROM_EMAIL: str = Field(default="engineerleobeni@gmail.com")
    SMTP_FROM_NAME: str = Field(default="Master Your Time")
    RESEND_API_KEY: str = Field(default="", description="Resend HTTPS API key for cloud email delivery over port 443")
    BREVO_API_KEY: str = Field(default="", description="Brevo HTTPS API key for cloud email delivery over port 443")
    SENDGRID_API_KEY: str = Field(default="", description="SendGrid HTTPS API key for cloud email delivery over port 443")

    # Cloudinary Image Storage
    CLOUDINARY_CLOUD_NAME: str = Field(default="master-your-time", description="Cloudinary cloud name")
    CLOUDINARY_API_KEY: str = Field(default="lQkpLZmthjXKYgB7EGrFhFlxo5g", description="Cloudinary API key")
    CLOUDINARY_API_SECRET: str = Field(default="lQkpLZmthjXKYgB7EGrFhFlxo5g", description="Cloudinary API secret")
    CLOUDINARY_UPLOAD_PRESET: str = Field(default="lQkpLZmthjXKYgB7EGrFhFlxo5g", description="Cloudinary upload preset")

    @property
    def email_password(self) -> str:
        pwd = self.SMTP_PASSWORD or self.GMAIL_APP_PASSWORD
        return pwd.replace(" ", "").strip()

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def has_mongodb_uri(self) -> bool:
        uri = self.MONGODB_URI.strip()
        if not uri:
            return False
        # Avoid connecting to incomplete placeholder strings
        if "<username>" in uri or "<password>" in uri:
            return False
        return True

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
