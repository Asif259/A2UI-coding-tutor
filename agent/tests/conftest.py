import pytest


@pytest.fixture(autouse=True)
def isolate_env(monkeypatch, tmp_path):
    """No test may read real keys or write a real providers file."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("TUTOR_OFFLINE", raising=False)
    monkeypatch.setenv("PROVIDERS_FILE", str(tmp_path / "providers.json"))
