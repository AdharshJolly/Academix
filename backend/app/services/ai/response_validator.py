"""
ResponseValidator
Validates parsed AI JSON against Pydantic schemas.
All AI responses MUST pass validation before being stored or returned.
"""
from pydantic import BaseModel, ValidationError
from typing import Type, TypeVar

T = TypeVar("T", bound=BaseModel)


class ResponseValidator:
    """Validates AI output dicts against Pydantic model schemas."""

    def validate(self, data: dict, schema_class: Type[T]) -> T:
        """
        Validate a parsed dict against a Pydantic model.
        Returns the model instance on success.
        Raises ValueError with a clear message on failure.
        """
        try:
            return schema_class.model_validate(data)
        except ValidationError as e:
            errors = e.errors()
            error_summary = "; ".join(
                f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}"
                for err in errors[:5]  # First 5 errors
            )
            raise ValueError(
                f"AI response failed schema validation for {schema_class.__name__}. "
                f"Errors: {error_summary}"
            )
        except Exception as e:
            raise ValueError(
                f"Unexpected validation error for {schema_class.__name__}: {str(e)}"
            )

    def validate_safe(
        self, data: dict, schema_class: Type[T], fallback: T | None = None
    ) -> T | None:
        """
        Like validate() but returns fallback instead of raising.
        """
        try:
            return self.validate(data, schema_class)
        except (ValueError, Exception):
            return fallback
