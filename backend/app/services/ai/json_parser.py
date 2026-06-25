"""
JSONParser
Robustly extracts valid JSON from raw AI string outputs.
Handles:
  - Clean JSON responses
  - JSON wrapped in markdown code fences (```json ... ```)
  - Leading/trailing prose around the JSON block
  - Nested structures
"""
import json
import re
from typing import Any


class JSONParser:
    """Extracts and parses the first valid JSON object from AI output."""

    def extract_json(self, raw: str) -> dict[str, Any]:
        """
        Extract the first valid JSON object or array from a raw string.
        Tries multiple strategies in order of likelihood.
        Raises ValueError if no valid JSON can be extracted.
        """
        if not raw or not raw.strip():
            raise ValueError("Empty response from AI model")

        # Strategy 1: Try parsing the whole string directly
        try:
            result = json.loads(raw.strip())
            return result if isinstance(result, dict) else {"data": result}
        except json.JSONDecodeError:
            pass

        # Strategy 2: Strip markdown code fences (```json ... ``` or ``` ... ```)
        fence_match = re.search(
            r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL | re.IGNORECASE
        )
        if fence_match:
            try:
                result = json.loads(fence_match.group(1).strip())
                return result if isinstance(result, dict) else {"data": result}
            except json.JSONDecodeError:
                pass

        # Strategy 3: Find the first { ... } block
        brace_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if brace_match:
            try:
                result = json.loads(brace_match.group(0))
                return result if isinstance(result, dict) else {"data": result}
            except json.JSONDecodeError:
                pass

        # Strategy 4: Find the first [ ... ] block (array response)
        bracket_match = re.search(r"\[.*\]", raw, re.DOTALL)
        if bracket_match:
            try:
                result = json.loads(bracket_match.group(0))
                return {"data": result}
            except json.JSONDecodeError:
                pass

        raise ValueError(
            f"Could not extract valid JSON from AI response. "
            f"Raw output (first 300 chars): {raw[:300]}"
        )

    def safe_extract(self, raw: str, fallback: dict | None = None) -> dict[str, Any]:
        """
        Like extract_json but returns fallback dict instead of raising.
        Useful when AI output is optional.
        """
        try:
            return self.extract_json(raw)
        except (ValueError, Exception):
            return fallback or {}
