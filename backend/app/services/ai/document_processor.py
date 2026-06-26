import os
import io
import logging
import httpx
from typing import List, Dict
import fitz  # PyMuPDF
from app.db.client import get_supabase

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """
    Handles extracting text from PDFs, chunking, embedding via Gemini,
    and storing in Supabase (pgvector).
    """
    def __init__(self):
        self.db = get_supabase()
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.embedding_url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={self.gemini_key}"
        self.chunk_size = 1000  # characters
        self.chunk_overlap = 200

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract all text from a PDF file."""
        text = ""
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page in doc:
                text += page.get_text("text") + "\n"
        except Exception as e:
            logger.error(f"Failed to parse PDF: {e}")
        return text

    def chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        chunks = []
        start = 0
        while start < len(text):
            end = start + self.chunk_size
            chunks.append(text[start:end])
            start += (self.chunk_size - self.chunk_overlap)
        return chunks

    async def get_embedding(self, text: str) -> List[float]:
        """Get 768-dimensional embedding from Gemini."""
        if not self.gemini_key:
            raise ValueError("GEMINI_API_KEY is not set.")
            
        payload = {
            "model": "models/text-embedding-004",
            "content": {
                "parts": [{"text": text}]
            }
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(self.embedding_url, json=payload, timeout=10.0)
            res.raise_for_status()
            data = res.json()
            return data["embedding"]["values"]

    async def process_and_store(self, user_id: str, filename: str, pdf_bytes: bytes) -> int:
        """
        End-to-end pipeline: Parse -> Chunk -> Embed -> Store in DB.
        Returns the number of chunks processed.
        """
        text = self.extract_text_from_pdf(pdf_bytes)
        if not text.strip():
            return 0
            
        chunks = self.chunk_text(text)
        stored_count = 0
        
        for chunk in chunks:
            if not chunk.strip():
                continue
                
            try:
                embedding = await self.get_embedding(chunk)
                
                # Format embedding array into PostgreSQL vector literal '[1.2, 3.4, ...]'
                vector_literal = "[" + ",".join(map(str, embedding)) + "]"
                
                self.db.table("study_materials").insert({
                    "user_id": user_id,
                    "filename": filename,
                    "chunk_text": chunk.strip(),
                    "embedding": vector_literal
                }).execute()
                stored_count += 1
            except Exception as e:
                logger.error(f"Failed to embed/store chunk for {filename}: {e}")
                
        return stored_count
