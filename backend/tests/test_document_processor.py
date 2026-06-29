import pytest
from unittest.mock import patch, MagicMock
from app.services.ai.document_processor import DocumentProcessor

class TestDocumentProcessor:
    @pytest.fixture
    def processor(self, mock_supabase):
        with patch("app.services.ai.document_processor.get_supabase_admin", return_value=mock_supabase):
            proc = DocumentProcessor()
            yield proc, mock_supabase

    def test_chunk_text_splits_by_size(self, processor):
        proc, _ = processor
        doc = "A" * 1500
        # If chunk size is 1000 and overlap is 200
        # chunks: [0:1000], [800:1800]
        chunks = proc.chunk_text(doc)
        assert len(chunks) == 2
        assert len(chunks[0]) == 1000
        assert len(chunks[1]) == 700

    @pytest.mark.asyncio
    async def test_get_embedding_calls_fastembed(self, processor):
        proc, _ = processor
        with patch("fastembed.TextEmbedding") as MockTextEmbedding:
            mock_model = MockTextEmbedding.return_value
            # return a list containing a numpy-like mock array that has a tolist()
            mock_array = MagicMock()
            mock_array.tolist.return_value = [0.1, 0.2, 0.3]
            mock_model.embed.return_value = [mock_array]
            
            embedding = await proc.get_embedding("test text")
            
            assert embedding == [0.1, 0.2, 0.3]
            mock_model.embed.assert_called_once_with(["test text"])

    @pytest.mark.asyncio
    async def test_process_and_store_ignores_empty_text(self, processor):
        proc, _ = processor
        with patch.object(proc, 'extract_text_from_pdf', return_value="   "):
            count = await proc.process_and_store("user1", "file.pdf", b"fake-pdf")
            assert count == 0

    @pytest.mark.asyncio
    async def test_process_and_store_inserts_to_db(self, processor):
        proc, mock_db = processor
        mock_db.table.return_value.insert.reset_mock()
        with patch.object(proc, 'extract_text_from_pdf', return_value="hello world"), \
             patch.object(proc, 'get_embedding', return_value=[0.1, 0.2]):
            
            count = await proc.process_and_store("user1", "file.pdf", b"fake-pdf")
            assert count == 1
            mock_db.table.assert_called_with("study_materials")
            mock_db.table.return_value.insert.assert_called_once()
