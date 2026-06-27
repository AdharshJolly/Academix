import logging
import json
import asyncio
import os
from fastapi import WebSocket

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL")

class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, list[WebSocket]] = {}
        self.redis_client = None
        self.pubsub = None
        self._listener_task = None
        
        if REDIS_URL:
            try:
                import redis.asyncio as aioredis
                self.redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
                self.pubsub = self.redis_client.pubsub()
                # Run the listener loop in the background
                self._listener_task = asyncio.create_task(self._listen_to_redis())
            except Exception as e:
                logger.error(f"Failed to connect to Redis for WebSockets: {e}")

    async def _listen_to_redis(self):
        """Listen for messages from Redis and broadcast to local WebSockets."""
        if not self.pubsub:
            return
        try:
            await self.pubsub.subscribe("ws_messages")
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        user_id = data.get("user_id")
                        payload = data.get("payload")
                        if user_id and payload:
                            await self._send_local(user_id, payload)
                    except json.JSONDecodeError:
                        pass
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Redis pubsub error: {e}")

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        if user_id not in self.connections:
            self.connections[user_id] = []
        self.connections[user_id].append(ws)
        logger.info(f"WebSocket connected for user: {user_id}. Total tabs: {len(self.connections[user_id])}")

    def disconnect(self, user_id: str, ws: WebSocket):
        if user_id in self.connections:
            if ws in self.connections[user_id]:
                self.connections[user_id].remove(ws)
            if not self.connections[user_id]:
                del self.connections[user_id]
            logger.info(f"WebSocket disconnected for user: {user_id}")

    async def send(self, user_id: str, data: dict):
        """Send message across all workers using Redis if available."""
        if self.redis_client:
            try:
                message = json.dumps({"user_id": user_id, "payload": data})
                await self.redis_client.publish("ws_messages", message)
            except Exception as e:
                logger.error(f"Redis publish error: {e}")
                # Fallback to local send
                await self._send_local(user_id, data)
        else:
            await self._send_local(user_id, data)

    async def _send_local(self, user_id: str, data: dict):
        """Send message only to locally connected WebSockets."""
        if user_id in self.connections:
            dead_sockets = []
            for ws in self.connections[user_id]:
                try:
                    await ws.send_json(data)
                except Exception as e:
                    logger.error(f"WebSocket send error for user {user_id}: {e}")
                    dead_sockets.append(ws)
            
            # Clean up dead connections
            for ws in dead_sockets:
                self.disconnect(user_id, ws)

manager = ConnectionManager()
