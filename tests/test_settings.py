# tests/test_settings.py
from pathlib import Path
import textwrap
from src.config.settings import Settings, load_model_tiers


def test_load_model_tiers_reads_yaml(tmp_path):
    p = tmp_path / "models.yaml"
    p.write_text(textwrap.dedent("""
        quick:
          model: "m-quick"
          temperature: 0.1
        deep:
          model: "m-deep"
          temperature: 0.9
    """))
    tiers = load_model_tiers(p)
    assert tiers["quick"]["model"] == "m-quick"
    assert tiers["deep"]["temperature"] == 0.9


def test_settings_defaults_without_env(monkeypatch):
    # Ensure no env bleed-through from a real .env
    for k in ["OLLAMA_API_KEY", "LLM_BASE_URL", "QUICK_MODEL", "DEEP_MODEL"]:
        monkeypatch.delenv(k, raising=False)
    s = Settings(_env_file=None)
    assert s.llm_base_url == "https://ollama.com/v1"
    assert s.debate_mode == "on"
    assert s.research_debate_rounds == 1


def test_settings_reads_env(monkeypatch):
    monkeypatch.setenv("OLLAMA_API_KEY", "test-key-123")
    monkeypatch.setenv("QUICK_MODEL", "override-quick")
    s = Settings(_env_file=None)
    assert s.ollama_api_key == "test-key-123"
    assert s.quick_model == "override-quick"
