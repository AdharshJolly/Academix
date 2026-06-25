"""
Application Settings
Loaded from environment variables.
"""
import os


class Settings:
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    PRIMARY_MODEL: str = os.getenv("PRIMARY_MODEL", "moonshotai/kimi-k2-instruct")
    FALLBACK_MODEL: str = os.getenv("FALLBACK_MODEL", "llama-3.3-70b-versatile")

    N8N_BASE_URL: str = os.getenv("N8N_BASE_URL", "")
    N8N_API_KEY: str = os.getenv("N8N_API_KEY", "")

    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")

    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # TODO: Replace with pydantic-settings BaseSettings for validation


settings = Settings()

