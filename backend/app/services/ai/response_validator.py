"""
ResponseValidator
Validates parsed AI JSON against Pydantic schemas.
All AI responses must pass validation before being persisted.
"""


class ResponseValidator:

    def validate(self, data: dict, schema_class) -> object:
        """
        Validate data dict against the given Pydantic model class.
        Raises ValidationError on failure.
        TODO: Implement Pydantic parse_obj with error handling
        """
        pass

