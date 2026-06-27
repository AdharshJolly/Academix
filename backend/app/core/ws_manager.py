import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.connections[user_id] = ws
        logger.info(f"WebSocket connected for user: {user_id}")

    def disconnect(self, user_id: str):
        if user_id in self.connections:
            del self.connections[user_id]
            logger.info(f"WebSocket disconnected for user: {user_id}")

    async def send(self, user_id: str, data: dict):
        if ws := self.connections.get(user_id):
            try:
                await ws.send_json(data)
            except Exception as e:
                logger.error(f"WebSocket send error for user {user_id}: {e}")
                self.disconnect(user_id)

manager = ConnectionManager()
