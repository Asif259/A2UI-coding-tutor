from __future__ import annotations

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from app.llm import LLMError
from app.main import create_app
from app.providers import list_models


async def test_openai_models_use_bearer_and_dedupe():
    seen = {}

    def h(req: httpx.Request) -> httpx.Response:
        seen["url"], seen["auth"] = str(req.url), req.headers.get("authorization")
        return httpx.Response(
            200, json={"data": [{"id": "b"}, {"id": "a"}, {"id": "a"}, {"nope": 1}]}
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(h)) as http:
        models = await list_models("openai", "https://api.test/v1/", "sk-1", http)
    assert models == ["a", "b"]
    assert seen == {"url": "https://api.test/v1/models", "auth": "Bearer sk-1"}


async def test_anthropic_models_use_x_api_key():
    seen = {}

    def h(req: httpx.Request) -> httpx.Response:
        seen["url"] = str(req.url)
        seen["key"] = req.headers.get("x-api-key")
        seen["auth"] = req.headers.get("authorization")
        return httpx.Response(200, json={"data": [{"id": "claude-x"}]})

    async with httpx.AsyncClient(transport=httpx.MockTransport(h)) as http:
        assert await list_models("anthropic", "https://api.anthropic.com", "sk-ant", http) == [
            "claude-x"
        ]
    assert seen == {
        "url": "https://api.anthropic.com/v1/models",
        "key": "sk-ant",
        "auth": None,
    }


async def test_gemini_models_strip_prefix_and_sort():
    seen = {}

    def h(req: httpx.Request) -> httpx.Response:
        seen["url"], seen["key"] = str(req.url), req.url.params.get("key")
        return httpx.Response(
            200,
            json={"models": [{"name": "models/gemini-b"}, {"name": "models/gemini-a"}]},
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(h)) as http:
        assert await list_models("gemini", "", "AIza", http) == ["gemini-a", "gemini-b"]
    assert seen["key"] == "AIza"
    assert seen["url"].split("?")[0].endswith("/v1beta/models")


async def test_models_http_error_and_bad_url_raise_llm_error():
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _r: httpx.Response(401))
    ) as http:
        with pytest.raises(LLMError, match="HTTP 401"):
            await list_models("openai", "https://api.test", "sk", http)
        with pytest.raises(LLMError, match="http:// or https://"):
            await list_models("openai", "ftp://nope", "sk", http)


async def test_models_endpoint_wires_success_and_provider_errors(monkeypatch):
    async def ok(*_a):
        return ["a", "b"]

    async def bad(*_a):
        raise LLMError("HTTP 500")

    app = create_app()
    transport = ASGITransport(app=app)
    body = {"format": "openai", "baseUrl": "https://api.test", "apiKey": "sk"}
    async with AsyncClient(transport=transport, base_url="http://t") as c:
        monkeypatch.setattr("app.main.list_models", ok)
        r = await c.post("/api/providers/models", json=body)
        assert r.status_code == 200 and r.json() == {"models": ["a", "b"], "error": None}

        monkeypatch.setattr("app.main.list_models", bad)
        r = await c.post("/api/providers/models", json=body)
        assert r.status_code == 200 and r.json() == {"models": [], "error": "HTTP 500"}

        bad_url = await c.post("/api/providers/models", json={**body, "baseUrl": "ftp://nope"})
        assert bad_url.status_code == 422
        assert "http" in bad_url.json()["detail"][0]["msg"]
