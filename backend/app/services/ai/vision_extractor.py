"""
Vision Extractor Service using Gemini
Because Groq decommissioned their vision models, we use Gemini 2.5 Flash
to extract text and event details from images/posters.
"""
import os
import logging
import httpx
import base64

logger = logging.getLogger(__name__)

class VisionExtractor:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. Vision extraction will fail.")
        
    async def extract_text_from_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
        """
        Takes raw image bytes, sends them to Gemini 2.5 Flash via REST API, 
        and asks it to transcribe all event details into text.
        """
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is missing.")
            
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.api_key}"
            
            prompt = (
                "You are an assistant for a student planner app. "
                "The user has uploaded this image/poster. Please transcribe all the important "
                "text from this image. Specifically, extract the event title, description, "
                "dates, times, and location. Output it as a clear, plain text summary."
            )
            
            b64_img = base64.b64encode(image_bytes).decode("utf-8")
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_img
                            }
                        }
                    ]
                }]
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=30.0)
                response.raise_for_status()
                
            data = response.json()
            # Navigate the deeply nested JSON response
            try:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text
            except (KeyError, IndexError):
                logger.error(f"Failed to parse Gemini response: {data}")
                return "No text could be extracted."
            
        except Exception as e:
            logger.error(f"Gemini Vision extraction failed: {e}")
            raise e

    async def extract_timetable_subjects(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> list:
        """
        Takes raw image bytes of a timetable (PDF or Image), sends it to Gemini 2.5 Flash, 
        and extracts a unique list of subjects found in the timetable grid.
        Returns a JSON array of strings.
        """
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is missing.")
            
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.api_key}"
            
            prompt = (
                "You are an academic parser. The user has uploaded an image of their class timetable or schedule. "
                "Extract all the unique subject/course names from the timetable grid. "
                "Output ONLY a valid JSON array of strings containing the unique subject names. Do not include markdown or explanations."
            )
            
            b64_img = base64.b64encode(image_bytes).decode("utf-8")
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_img
                            }
                        }
                    ]
                }]
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=30.0)
                response.raise_for_status()
                
            data = response.json()
            try:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                import json
                # Try to parse the text directly, stripping markdown if present
                text = text.replace("```json", "").replace("```", "").strip()
                subjects = json.loads(text)
                if isinstance(subjects, list):
                    return subjects
                return []
            except Exception as e:
                logger.error(f"Failed to parse Gemini timetable response: {e}")
                return []
            
        except Exception as e:
            logger.error(f"Gemini Vision timetable extraction failed: {e}")
            raise e
