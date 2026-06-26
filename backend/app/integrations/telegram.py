"""
Telegram API Client
Handles sending messages and downloading files directly without Make.com.
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

class TelegramClient:
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.base_url = f"https://api.telegram.org/bot{self.token}"
        self.file_url = f"https://api.telegram.org/file/bot{self.token}"
        
    async def send_message(self, chat_id: str, text: str) -> bool:
        if not self.token:
            logger.error("TELEGRAM_BOT_TOKEN missing.")
            return False
            
        url = f"{self.base_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=10.0)
                response.raise_for_status()
                return True
            except Exception as e:
                logger.error(f"Failed to send Telegram message: {e}")
                return False

    async def get_file_bytes(self, file_id: str) -> bytes | None:
        """Get file path and download bytes."""
        if not self.token:
            return None
            
        async with httpx.AsyncClient() as client:
            try:
                # 1. Get file path
                url = f"{self.base_url}/getFile?file_id={file_id}"
                res = await client.get(url, timeout=10.0)
                res.raise_for_status()
                data = res.json()
                
                if not data.get("ok"):
                    logger.error(f"Telegram getFile error: {data}")
                    return None
                    
                file_path = data["result"]["file_path"]
                
                # 2. Download file
                download_url = f"{self.file_url}/{file_path}"
                dl_res = await client.get(download_url, timeout=30.0)
                dl_res.raise_for_status()
                
                return dl_res.content
            except Exception as e:
                logger.error(f"Failed to download Telegram file: {e}")
                return None
