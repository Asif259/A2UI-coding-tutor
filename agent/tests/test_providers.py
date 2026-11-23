from __future__ import annotations

import json
import os
import stat

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from app.llm import LLMError
from app.main import create_app
from app.providers import FailoverLLM, Provider, ProviderStore, last_provider
from app.tutor import Tutor

from .test_tutor import quiz_reply


def provider(name, fmt="openai", **kw) -> Provider:
    return Provider(
        name=name,
        format=fmt,
        base_url=f"https://{name}.test",
        api_key="sk-secret-1234",
        model="m",
        **kw,
    )


def make(tmp_path, handler, *providers) -> tuple[ProviderStore, FailoverLLM, list[str], list]:
    store = ProviderStore(tmp_path / "p.json")
    for p in providers:
        store.add(p)
    seen: list[str] = []

    def wrapped(req: httpx.Request) -> httpx.Response:
        seen.append(req.url.host)
        return handler(req)

    clock = [0.0]
    llm = FailoverLLM(
        store, httpx.AsyncClient(transport=httpx.MockTransport(wrapped)), clock=lambda: clock[0]
    )
    return store, llm, seen, clock


def ok_openai(_req):
    return httpx.Response(200, json={"choices": [{"message": {"content": "hello"}}]})


async def test_openai_format_request_and_response(tmp_path):
    captured = {}

    def h(req):
        captured["url"], captured["auth"] = str(req.url), req.headers["authorization"]
        captured["body"] = json.loads(req.content)
        return ok_openai(req)

    _, llm, _, _ = make(tmp_path, h, provider("a"))
    assert await llm.generate("SYS", [("user", "hi"), ("model", "yo"), ("user", "more")]) == "hello"
    assert captured["url"] == "https://a.test/chat/completions"
    assert captured["auth"] == "Bearer sk-secret-1234"
    roles = [m["role"] for m in captured["body"]["messages"]]
    assert roles == ["system", "user", "assistant", "user"]
    assert last_provider.get() == "a"


async def test_anthropic_format(tmp_path):
    captured = {}

    def h(req):
        captured["url"], captured["key"] = str(req.url), req.headers["x-api-key"]
        captured["body"] = json.loads(req.content)
        return httpx.Response(200, json={"content": [{"type": "text", "text": "hey"}]})

    _, llm, _, _ = make(tmp_path, h, provider("b", "anthropic"))
    assert await llm.generate("SYS", [("user", "hi")]) == "hey"
    assert captured["url"] == "https://b.test/v1/messages"
    assert captured["key"] == "sk-secret-1234" and captured["body"]["system"] == "SYS"


async def test_failover_to_next_provider_on_quota(tmp_path):
    def h(req):
        return httpx.Response(429, json={}) if req.url.host == "a.test" else ok_openai(req)

    _, llm, seen, _ = make(tmp_path, h, provider("a"), provider("b"))
    assert await llm.generate("s", [("user", "x")]) == "hello"
    assert seen == ["a.test", "b.test"] and last_provider.get() == "b"


async def test_failed_provider_is_skipped_during_cooldown_then_retried(tmp_path):
    def h(req):
        return httpx.Response(503) if req.url.host == "a.test" else ok_openai(req)

    _, llm, seen, clock = make(tmp_path, h, provider("a"), provider("b"))
    await llm.generate("s", [("user", "x")])
    seen.clear()
    await llm.generate("s", [("user", "x")])
    assert seen == ["b.test"]  # a is cooling down
    clock[0] = 1000
    seen.clear()
    await llm.generate("s", [("user", "x")])
    assert seen[0] == "a.test"  # cooldown over, back in priority order


async def test_all_fail_reports_names_and_codes_not_secrets(tmp_path):
    _, llm, _, _ = make(
        tmp_path,
        lambda r: httpx.Response(401, text="bad key sk-secret-1234"),
        provider("a"),
        provider("b"),
    )
    with pytest.raises(LLMError) as e:
        await llm.generate("s", [("user", "x")])
    assert "a: HTTP 401" in str(e.value) and "b: HTTP 401" in str(e.value)
    assert "sk-secret" not in str(e.value)


async def test_disabled_and_missing_providers(tmp_path):
    _, llm, seen, _ = make(tmp_path, ok_openai, provider("a", enabled=False), provider("b"))
    await llm.generate("s", [("user", "x")])
    assert seen == ["b.test"]
    _, empty, _, _ = make(tmp_path / "x", ok_openai)
    with pytest.raises(LLMError, match="No AI provider"):
        await empty.generate("s", [("user", "x")])


async def test_tutor_reports_which_provider_answered(tmp_path):
    def h(req):
        if req.url.host == "a.test":
            return httpx.Response(429)
        return httpx.Response(200, json={"choices": [{"message": {"content": quiz_reply()}}]})

    _, llm, _, _ = make(tmp_path, h, provider("a"), provider("b"))
    r = await Tutor(llm).turn("s", message="quiz me")
    assert r.provider == "b" and r.surface_id == "s1"


def test_store_persists_masks_nothing_on_disk_but_locks_file(tmp_path):
    s = ProviderStore(tmp_path / "p.json")
    p = s.add(provider("a"))
    assert [x.name for x in ProviderStore(tmp_path / "p.json").providers] == ["a"]
    assert stat.S_IMODE(os.stat(tmp_path / "p.json").st_mode) == 0o600
    s.update(p.id, {"name": "a2", "api_key": ""})  # blank key keeps the stored one
    assert s.get(p.id).api_key == "sk-secret-1234" and s.get(p.id).name == "a2"
    q = s.add(provider("b"))
    s.reorder([q.id, p.id])
    assert [x.name for x in s.providers] == ["b", "a2"]
    with pytest.raises(ValueError):
        s.reorder([q.id])


def test_first_run_seeds_from_env_key(tmp_path, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "AIza-test-key")
    s = ProviderStore(tmp_path / "new.json")
    assert [(p.format, p.model) for p in s.providers] == [("gemini", "gemini-3.5-flash")]


async def test_management_api_never_returns_keys(tmp_path):
    store, llm, _, _ = make(tmp_path, ok_openai)
    app = create_app(llm, store)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        body = {
            "name": "Mine",
            "format": "openai",
            "baseUrl": "https://x.test/v1/",
            "apiKey": "sk-live-abcdefgh",
            "model": "gpt-x",
        }
        created = (await c.post("/api/providers", json=body)).json()
        assert "apiKey" not in created and "sk-live" not in json.dumps(created)
        assert created["apiKeyHint"] == "…efgh" and created["baseUrl"] == "https://x.test/v1"
        assert len((await c.get("/api/providers")).json()) == 1
        t = (await c.post(f"/api/providers/{created['id']}/test")).json()
        assert t["ok"] is True
        bad = await c.post("/api/providers", json={**body, "baseUrl": "ftp://nope"})
        assert bad.status_code == 422 and "http" in bad.json()["detail"]
        assert (await c.delete(f"/api/providers/{created['id']}")).status_code == 204
        assert (await c.delete("/api/providers/zzz")).status_code == 404
