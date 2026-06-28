from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

def get_auth_token_or_ip(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        return auth.split(" ")[1]
    return get_remote_address(request)

limiter = Limiter(key_func=get_auth_token_or_ip)
