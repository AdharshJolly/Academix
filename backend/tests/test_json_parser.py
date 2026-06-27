import pytest
from app.services.ai.json_parser import JSONParser

parser = JSONParser()

def test_pure_json():
    raw = '{"key": "value"}'
    assert parser.extract_json(raw) == {"key": "value"}

def test_pure_json_array():
    raw = '["value1", "value2"]'
    assert parser.extract_json(raw) == {"data": ["value1", "value2"]}

def test_markdown_fence():
    raw = "Here is the response:\n```json\n{\"status\": \"ok\"}\n```\nHope it helps!"
    assert parser.extract_json(raw) == {"status": "ok"}

def test_markdown_fence_array():
    raw = "```\n[\"item\"]\n```"
    assert parser.extract_json(raw) == {"data": ["item"]}

def test_first_brace():
    raw = "Some leading text {\"a\": 1} and trailing text."
    assert parser.extract_json(raw) == {"a": 1}

def test_first_bracket():
    raw = "Array starts [1, 2, 3] and ends here."
    assert parser.extract_json(raw) == {"data": [1, 2, 3]}

def test_empty_response():
    with pytest.raises(ValueError, match="Empty response"):
        parser.extract_json("")

def test_invalid_json():
    with pytest.raises(ValueError, match="Could not extract valid JSON"):
        parser.extract_json("Just a normal sentence without JSON.")

def test_safe_extract():
    assert parser.safe_extract("not json", fallback={"fallback": True}) == {"fallback": True}
    assert parser.safe_extract("not json") == {}
    assert parser.safe_extract('{"ok": 1}') == {"ok": 1}
