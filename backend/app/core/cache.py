import os
import redis
import logging

logger = logging.getLogger(__name__)

from app.core.settings import settings

REDIS_URL = settings.REDIS_URL

try:
    if REDIS_URL:
        # Use decode_responses=True so we get strings
        cache = redis.from_url(REDIS_URL, decode_responses=True)
    else:
        cache = None
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    cache = None

def dashboard_key(user_id: str) -> str: return f"dashboard:{user_id}"
def calendar_key(user_id: str, y: int, m: int) -> str: return f"cal:{user_id}:{y}-{m}"

def invalidate_dashboard_cache(user_id: str):
    if cache:
        try:
            cache.delete(dashboard_key(user_id))
        except Exception as e:
            logger.error(f"Failed to invalidate dashboard cache for user {user_id}: {e}")
