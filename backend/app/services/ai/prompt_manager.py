"""
PromptManager
Loads and formats prompt templates from the /prompts directory.
"""
from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parents[4] / "prompts"


class PromptManager:

    def load_prompt(self, template_name: str) -> str:
        """
        Load a prompt template file by name (without .md extension).
        TODO: Read file, extract the Prompt Template section
        """
        pass

    def format_prompt(self, template: str, variables: dict) -> str:
        """
        Inject variables into a prompt template.
        TODO: Implement variable substitution
        """
        pass

