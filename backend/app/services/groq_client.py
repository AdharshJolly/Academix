"""
GroqClient
Manages AI inference via the Groq API.
Primary model: moonshotai/kimi-k2-instruct
Fallback model: llama-3.3-70b-versatile
"""
from app.core.settings import settings


class GroqClient:

    def generate(self, prompt: str, system: str = "") -> str:
        """
        Send a prompt to the primary model.
        Falls back to FALLBACK_MODEL on failure.
        TODO: Implement Groq API call with retry logic
        """
        pass

