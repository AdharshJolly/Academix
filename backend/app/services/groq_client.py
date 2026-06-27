"""
GroqClient
Manages AI inference via the Groq API.
Primary model:  moonshotai/kimi-k2-instruct
Fallback model: llama-3.3-70b-versatile

Handles:
  - Automatic fallback on primary model failure
  - Temperature and token configuration
  - Consistent error reporting
"""
import logging
from groq import Groq
from app.core.settings import settings

logger = logging.getLogger(__name__)


class GroqClient:
    """Wraps the Groq SDK with primary/fallback model logic."""

    def __init__(self):
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set in environment variables")
        self._client = Groq(api_key=settings.GROQ_API_KEY)
        self.primary_model = settings.PRIMARY_MODEL
        self.fallback_model = settings.FALLBACK_MODEL

    def generate(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> str:
        """
        Send a prompt to the primary model.
        Falls back to FALLBACK_MODEL on any failure.
        Returns raw string output from the model.
        Raises RuntimeError if both models fail.
        """
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        # Try primary model
        try:
            logger.info(f"Calling Groq [{self.primary_model}] ...")
            response = self._client.chat.completions.create(
                model=self.primary_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content
            logger.info(f"Groq [{self.primary_model}] responded successfully.")
            return content

        except Exception as e:
            primary_error_msg = str(e)
            logger.warning(
                f"Primary model [{self.primary_model}] failed: {primary_error_msg}. "
                f"Falling back to [{self.fallback_model}]..."
            )

        # Try fallback model
        try:
            response = self._client.chat.completions.create(
                model=self.fallback_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content
            logger.info(f"Groq fallback [{self.fallback_model}] responded successfully.")
            return content

        except Exception as fallback_error:
            raise RuntimeError(
                f"Both AI models failed. "
                f"Primary error: {primary_error_msg}. "
                f"Fallback error: {fallback_error}."
            )

    def generate_with_tools(
        self,
        messages: list,
        tools: list,
        tool_choice: str = "auto",
        temperature: float = 0.3,
    ) -> dict:
        """
        Sends a conversation history and a list of tools to Groq.
        Returns the raw message response object which may contain tool_calls or content.
        """
        try:
            response = self._client.chat.completions.create(
                model=self.primary_model,
                messages=messages,
                tools=tools,
                tool_choice=tool_choice,
                temperature=temperature,
                max_tokens=4096,
            )
            return response.choices[0].message
        except Exception as e:
            # Fallback to secondary if needed
            logger.warning(f"Primary model tools failed: {e}. Trying fallback.")
            response = self._client.chat.completions.create(
                model=self.fallback_model,
                messages=messages,
                tools=tools,
                tool_choice=tool_choice,
                temperature=temperature,
                max_tokens=4096,
            )
            return response.choices[0].message

    def generate_json(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.3,
    ) -> str:
        """
        Like generate() but adds explicit JSON instruction to system prompt.
        Use this for all structured output calls.
        """
        json_system = (
            system + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown. No explanation."
            if system
            else "Return ONLY valid JSON. No markdown. No explanation."
        )
        return self.generate(prompt, system=json_system, temperature=temperature)
