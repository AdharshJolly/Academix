import pytest
import os
from pathlib import Path
from unittest.mock import patch
from app.services.ai.prompt_manager import PromptManager

@pytest.fixture
def manager(tmp_path):
    pm = PromptManager()
    
    # Setup test prompts
    with open(tmp_path / "system_prompt.md", "w") as f:
        f.write("You are an assistant.")
        
    with open(tmp_path / "notice_extraction.md", "w") as f:
        f.write("Extract notices from:\n\n{notice_text}")

    # Patch the module level PROMPTS_DIR
    with patch("app.services.ai.prompt_manager.PROMPTS_DIR", Path(tmp_path)):
        # Clear cache before tests
        pm._cache.clear()
        yield pm, tmp_path

class TestPromptManager:
    def test_load_system_prompt(self, manager):
        pm, _ = manager
        prompt = pm.get_system_prompt()
        assert "You are an assistant." in prompt

    def test_build_notice_prompt_injects_text(self, manager):
        pm, _ = manager
        prompt = pm.get_notice_extraction_prompt("Midterm tomorrow!")
        assert "Midterm tomorrow!" in prompt
        assert "Extract notices from:" in prompt

    def test_build_missing_prompt_raises_file_not_found(self, manager):
        pm, tmp_path = manager
        # Simulate a missing file
        old_path = tmp_path / "notice_extraction.md"
        old_path.rename(tmp_path / "notice_extraction.md.bak")
        
        with pytest.raises(FileNotFoundError):
            pm.get_notice_extraction_prompt("Will fail")

    def test_build_prompt_caches_templates_in_memory(self, manager):
        pm, tmp_path = manager
        
        # First call caches it
        prompt_1 = pm.get_notice_extraction_prompt("Text 1")
        assert "Text 1" in prompt_1
        
        # Modify the file on disk
        with open(tmp_path / "notice_extraction.md", "w") as f:
            f.write("A completely new prompt: {notice_text}")
            
        # Second call should use the cached template, ignoring disk changes
        prompt_2 = pm.get_notice_extraction_prompt("Text 2")
        assert "Extract notices from:" in prompt_2
        assert "A completely new prompt" not in prompt_2
