"""
PromptManager
Loads and formats prompt templates from the /prompts directory.
Injects variables using {variable_name} syntax.
"""
from pathlib import Path

def _find_prompts_dir() -> Path:
    # Resolve relative to this file: backend/app/services/ai/prompt_manager.py -> backend/app/prompts
    current = Path(__file__).resolve()
    prompts_dir = current.parent.parent.parent / "prompts"
    if not prompts_dir.is_dir():
        raise RuntimeError(f"Could not find 'prompts' directory at {prompts_dir}")
    return prompts_dir

PROMPTS_DIR = _find_prompts_dir()


class PromptManager:
    """Loads prompt templates from the prompts/ directory."""

    _cache: dict[str, str] = {}

    def load_prompt(self, template_name: str) -> str:
        """
        Load a prompt template file by name (without .md extension).
        Results are cached after first load.
        Raises FileNotFoundError if template does not exist.
        """
        if template_name in self._cache:
            return self._cache[template_name]

        path = PROMPTS_DIR / f"{template_name}.md"

        if not path.exists():
            raise FileNotFoundError(
                f"Prompt template '{template_name}' not found at {path}"
            )

        content = path.read_text(encoding="utf-8").strip()
        self._cache[template_name] = content
        return content

    def format_prompt(self, template: str, variables: dict) -> str:
        """
        Inject variables into a prompt template using {variable_name} syntax.
        Missing variables are left as-is (no KeyError).
        """
        try:
            return template.format(**variables)
        except KeyError as e:
            # Partial format — leave unresolved vars in place
            import re
            result = template
            for key, value in variables.items():
                result = result.replace(f"{{{key}}}", str(value))
            return result

    def get_system_prompt(self) -> str:
        """Return the system prompt used for all Groq requests."""
        return self.load_prompt("system_prompt")

    def get_notice_extraction_prompt(self, notice_text: str) -> str:
        """Build the notice extraction prompt with injected notice text."""
        template = self.load_prompt("notice_extraction")
        return self.format_prompt(template, {"notice_text": notice_text})

    def get_schedule_prompt(self, events_json: str, days_ahead: int = 14) -> str:
        """Build the schedule generation prompt."""
        template = self.load_prompt("schedule_generation")
        return self.format_prompt(
            template, {"events_json": events_json, "days_ahead": days_ahead}
        )

    def get_recommendation_prompt(
        self,
        risk_score: float,
        risk_level: str,
        risk_factors_json: str,
        events_json: str,
    ) -> str:
        """Build the recommendation generation prompt."""
        template = self.load_prompt("recommendation_generation")
        return self.format_prompt(
            template,
            {
                "risk_score": risk_score,
                "risk_level": risk_level,
                "risk_factors_json": risk_factors_json,
                "events_json": events_json,
            },
        )
