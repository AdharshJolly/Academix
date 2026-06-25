"""
Application Settings
Loads configuration from environment variables.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # App
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "changeme-secret-key")
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Groq AI
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    PRIMARY_MODEL: str = os.getenv("PRIMARY_MODEL", "moonshotai/kimi-k2-instruct")
    FALLBACK_MODEL: str = os.getenv("FALLBACK_MODEL", "llama-3.3-70b-versatile")

    # Make.com
    MAKE_WEBHOOK_URL: str = os.getenv("MAKE_WEBHOOK_URL", "")

    # Twilio
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")

    # Google
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://campus-flow-six-rho.vercel.app")

    # Internal automation callback
    AUTOMATION_CALLBACK_SECRET: str = os.getenv("AUTOMATION_CALLBACK_SECRET", "")

    # CORS
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,https://campus-flow-six-rho.vercel.app,*"
    ).split(",")

    def validate(self) -> list[str]:
        """Return list of missing critical env vars."""
        missing = []
        critical = [
            ("SUPABASE_URL", self.SUPABASE_URL),
            ("SUPABASE_SERVICE_ROLE_KEY", self.SUPABASE_SERVICE_ROLE_KEY),
            ("GROQ_API_KEY", self.GROQ_API_KEY),
        ]
        for name, val in critical:
            if not val:
                missing.append(name)
        return missing


settings = Settings()
