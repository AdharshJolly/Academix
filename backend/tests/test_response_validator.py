import pytest
from pydantic import BaseModel
from app.services.ai.response_validator import ResponseValidator

validator = ResponseValidator()

class MockSchema(BaseModel):
    id: int
    name: str

def test_validate_success():
    data = {"id": 1, "name": "Test"}
    result = validator.validate(data, MockSchema)
    assert isinstance(result, MockSchema)
    assert result.id == 1
    assert result.name == "Test"

def test_validate_missing_field():
    data = {"id": 1}
    with pytest.raises(ValueError, match="AI response failed schema validation"):
        validator.validate(data, MockSchema)

def test_validate_type_error():
    data = {"id": "not_an_int", "name": "Test"}
    with pytest.raises(ValueError, match="AI response failed schema validation"):
        validator.validate(data, MockSchema)

def test_validate_safe_success():
    data = {"id": 1, "name": "Test"}
    result = validator.validate_safe(data, MockSchema)
    assert isinstance(result, MockSchema)
    assert result.id == 1

def test_validate_safe_failure():
    data = {"id": 1}
    fallback = MockSchema(id=99, name="Fallback")
    result = validator.validate_safe(data, MockSchema, fallback=fallback)
    assert result is fallback
    assert result.id == 99

def test_validate_safe_failure_no_fallback():
    data = {"id": 1}
    result = validator.validate_safe(data, MockSchema)
    assert result is None
