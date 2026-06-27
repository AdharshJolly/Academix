import pytest
from app.core.security import hash_password, verify_password, create_access_token, verify_ws_token
from jose import jwt
import os

os.environ["SECRET_KEY"] = "test-secret-key-32-chars-minimum!!"

class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        h = hash_password("mysecretpass")
        assert h != "mysecretpass"

    def test_correct_password_verifies(self):
        h = hash_password("correctpassword")
        assert verify_password("correctpassword", h) is True

    def test_wrong_password_fails(self):
        h = hash_password("correctpassword")
        assert verify_password("wrongpassword", h) is False

    def test_empty_password_hashes_without_error(self):
        h = hash_password("")
        assert verify_password("", h) is True
        assert verify_password("notEmpty", h) is False

    def test_long_password_safe_from_bcrypt_72_byte_limit(self):
        # SHA-256 pre-hash should eliminate the bcrypt 72-byte truncation bug.
        base = "a" * 72
        password_a = base + "X"
        password_b = base + "Y"
        hash_a = hash_password(password_a)
        assert verify_password(password_a, hash_a) is True
        assert verify_password(password_b, hash_a) is False


class TestJWTTokens:
    def test_valid_token_decodes_correctly(self):
        token = create_access_token("user-123", "test@example.com")
        payload = jwt.decode(token, os.environ["SECRET_KEY"], algorithms=["HS256"])
        assert payload["sub"] == "user-123"
        assert payload["email"] == "test@example.com"

    def test_token_contains_expiry(self):
        token = create_access_token("user-123", "test@example.com")
        payload = jwt.decode(token, os.environ["SECRET_KEY"], algorithms=["HS256"])
        assert "exp" in payload

    def test_tampered_token_rejected_by_ws_verifier(self):
        token = create_access_token("user-123", "test@example.com")
        tampered = token[:-5] + "XXXXX"
        result = verify_ws_token(tampered)
        assert result is None

    def test_valid_token_accepted_by_ws_verifier(self):
        token = create_access_token("user-456", "other@example.com")
        result = verify_ws_token(token)
        assert result is not None
        assert result["id"] == "user-456"
        assert result["email"] == "other@example.com"

    def test_missing_sub_claim_rejected(self):
        from datetime import datetime, timedelta, timezone
        payload = {"email": "test@example.com", "exp": datetime.now(timezone.utc) + timedelta(hours=1)}
        bad_token = jwt.encode(payload, os.environ["SECRET_KEY"], algorithm="HS256")
        assert verify_ws_token(bad_token) is None
