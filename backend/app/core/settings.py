"""
Application Settings
Loads configuration from environment variables.
"""
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union

class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = ""
    API_V1_PREFIX: str = "/api/v1"
    TIMEZONE: str = "Asia/Kolkata"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Groq AI & Gemini
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    PRIMARY_MODEL: str = "moonshotai/kimi-k2-instruct"
    FALLBACK_MODEL: str = "llama-3.3-70b-versatile"


    # Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""

    # Google
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    # Webhook Secret (Telegram, etc.)
    WEBHOOK_SECRET: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_cors_origins_list(self) -> list[str]:
        return [i.strip() for i in self.CORS_ORIGINS.split(",") if i.strip()]

    def validate(self) -> list[str]:
        """Return list of missing critical env vars."""
        missing = []
        critical = [
            ("SUPABASE_URL", self.SUPABASE_URL),
            ("SUPABASE_SERVICE_ROLE_KEY", self.SUPABASE_SERVICE_ROLE_KEY),
            ("GROQ_API_KEY", self.GROQ_API_KEY),
            ("SECRET_KEY", self.SECRET_KEY),
            ("WEBHOOK_SECRET", self.WEBHOOK_SECRET),
        ]
        for name, val in critical:
            if not val:
                missing.append(name)

        if self.ENVIRONMENT == "production" and "*" in self.CORS_ORIGINS:
            raise RuntimeError(
                "CORS_ORIGINS cannot contain wildcard '*' in production."
            )

        return missing


settings = Settings()
