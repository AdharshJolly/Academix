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

def invalidate_dashboard_cache(user_id: str):
    if cache:
        try:
            cache.delete(f"dashboard:{user_id}")
        except Exception as e:
            logger.error(f"Failed to invalidate dashboard cache for user {user_id}: {e}")
