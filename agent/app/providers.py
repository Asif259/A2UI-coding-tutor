"""AI providers: user-managed list, three wire formats, automatic failover.

A provider is (name, API format, base URL, API key, model id). `FailoverLLM` tries the enabled
providers in list order; one that fails (quota, outage, bad key, timeout) is skipped for a
cooldown and the next is tried. Keys live only on the server, in a 0600 JSON file.
"""

from __future__ import annotations

import json
import os
import pathlib
import time
import uuid
from contextvars import ContextVar
from typing import Literal

import httpx
from pydantic import BaseModel, Field, field_validator

from .llm import LLM, LLMError, OfflineLLM, Turn

Format = Literal["openai", "anthropic", "gemini"]
DEFAULT_BASE: dict[str, str] = {
    "openai": "https://api.openai.com/v1",
    "anthropic": "https://api.anthropic.com",
    "gemini": "https://generativelanguage.googleapis.com",
}
COOLDOWN_SECONDS = 60.0
#: Name of the provider that answered the current request (read right after generate()).
last_provider: ContextVar[str | None] = ContextVar("last_provider", default=None)


class Provider(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    name: str = Field(min_length=1, max_length=60)
    format: Format
    base_url: str = ""
    api_key: str = ""
    model: str = Field(min_length=1, max_length=120)
    enabled: bool = True

    @field_validator("base_url")
    @classmethod
    def _url(cls, v: str) -> str:
        v = v.strip().rstrip("/")
        if v and not v.startswith(("http://", "https://")):
            raise ValueError("base URL must start with http:// or https://")
        return v

    def endpoint(self) -> str:
        return self.base_url or DEFAULT_BASE[self.format]


class ProviderStore:
    """Ordered provider list persisted to a JSON file. List order is failover priority."""

    def __init__(self, path: str | os.PathLike[str]) -> None:
        self.path = pathlib.Path(path)
        self.providers: list[Provider] = []
        if self.path.exists():
            self.providers = [Provider(**d) for d in json.loads(self.path.read_text("utf-8"))]
        elif os.environ.get("GEMINI_API_KEY"):  # first run: seed from the old env-var setup
            self.providers = [
                Provider(
                    name="Gemini (from .env)",
                    format="gemini",
                    api_key=os.environ["GEMINI_API_KEY"],
                    model=os.environ.get("GEMINI_MODEL", "gemini-3.5-flash"),
                )
            ]
            self._save()

    def _save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps([p.model_dump() for p in self.providers], indent=2), "utf-8")
        os.chmod(tmp, 0o600)
        tmp.replace(self.path)

    def get(self, pid: str) -> Provider:
        for p in self.providers:
            if p.id == pid:
                return p
        raise KeyError(pid)

    def add(self, p: Provider) -> Provider:
        self.providers.append(p)
        self._save()
        return p

    def update(self, pid: str, changes: dict) -> Provider:
        cur = self.get(pid)
        if not changes.get("api_key"):  # blank key in an edit form means "keep the stored one"
            changes = {**changes, "api_key": cur.api_key}
        new = Provider(**{**cur.model_dump(), **changes, "id": pid})
        self.providers[self.providers.index(cur)] = new
        self._save()
        return new

    def delete(self, pid: str) -> None:
        self.providers.remove(self.get(pid))
        self._save()

    def reorder(self, ids: list[str]) -> None:
        if sorted(ids) != sorted(p.id for p in self.providers):
            raise ValueError("ids must list every provider exactly once")
        by_id = {p.id: p for p in self.providers}
        self.providers = [by_id[i] for i in ids]
        self._save()


def _status_error(p: Provider, r: httpx.Response) -> LLMError:
    return LLMError(f"{p.name}: HTTP {r.status_code}")


async def _call_openai(
    p: Provider, system: str, history: list[Turn], http: httpx.AsyncClient
) -> str:
    msgs = [{"role": "system", "content": system}] + [
        {"role": "assistant" if r == "model" else "user", "content": t} for r, t in history
    ]
    headers = {"Authorization": f"Bearer {p.api_key}"} if p.api_key else {}
    r = await http.post(
        f"{p.endpoint()}/chat/completions",
        headers=headers,
        json={"model": p.model, "messages": msgs, "temperature": 0.4},
    )
    if r.status_code >= 400:
        raise _status_error(p, r)
    return r.json()["choices"][0]["message"]["content"] or ""


async def _call_anthropic(
    p: Provider, system: str, history: list[Turn], http: httpx.AsyncClient
) -> str:
    msgs = [{"role": "assistant" if r == "model" else "user", "content": t} for r, t in history]
    r = await http.post(
        f"{p.endpoint()}/v1/messages",
        headers={"x-api-key": p.api_key, "anthropic-version": "2023-06-01"},
        json={"model": p.model, "system": system, "messages": msgs, "max_tokens": 4096},
    )
    if r.status_code >= 400:
        raise _status_error(p, r)
    return "".join(b.get("text", "") for b in r.json()["content"] if b.get("type") == "text")


async def _call_gemini(
    p: Provider, system: str, history: list[Turn], http: httpx.AsyncClient
) -> str:
    from google import genai
    from google.genai import types

    opts = types.HttpOptions(base_url=p.base_url) if p.base_url else None
    client = genai.Client(api_key=p.api_key, http_options=opts)
    contents = [types.Content(role=r, parts=[types.Part(text=t)]) for r, t in history]
    try:
        resp = await client.aio.models.generate_content(
            model=p.model,
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=system, temperature=0.4),
        )
    except Exception as e:  # SDK errors can embed request details; keep only the status code
        raise LLMError(f"{p.name}: {getattr(e, 'code', type(e).__name__)}") from None
    return resp.text or ""


_CALLS = {"openai": _call_openai, "anthropic": _call_anthropic, "gemini": _call_gemini}


class FailoverLLM:
    def __init__(
        self, store: ProviderStore, http: httpx.AsyncClient | None = None, clock=time.monotonic
    ) -> None:
        self.store = store
        self.http = http or httpx.AsyncClient(timeout=60)
        self.clock = clock
        self.cooling: dict[str, float] = {}  # provider id -> cooldown end

    def cooling_down(self, pid: str) -> bool:
        return self.cooling.get(pid, 0) > self.clock()

    async def call(self, p: Provider, system: str, history: list[Turn]) -> str:
        try:
            return await _CALLS[p.format](p, system, history, self.http)
        except LLMError:
            raise
        except Exception as e:  # network, timeout, malformed body
            raise LLMError(f"{p.name}: {type(e).__name__}") from None

    async def generate(self, system: str, history: list[Turn]) -> str:
        active = [p for p in self.store.providers if p.enabled]
        if not active:
            raise LLMError("No AI provider is configured. Add one in Settings.")
        # Providers in cooldown go last: still tried if everything else fails.
        ordered = [p for p in active if not self.cooling_down(p.id)] + [
            p for p in active if self.cooling_down(p.id)
        ]
        errors: list[str] = []
        for p in ordered:
            try:
                text = await self.call(p, system, history)
            except LLMError as e:
                self.cooling[p.id] = self.clock() + COOLDOWN_SECONDS
                errors.append(str(e))
                continue
            self.cooling.pop(p.id, None)
            last_provider.set(p.name)
            return text
        raise LLMError("All AI providers failed: " + "; ".join(errors))


def default_llm(store: ProviderStore) -> LLM:
    if os.environ.get("TUTOR_OFFLINE") == "1":
        return OfflineLLM()
    return FailoverLLM(store)


def default_store() -> ProviderStore:
    return ProviderStore(os.environ.get("PROVIDERS_FILE", "data/providers.json"))
