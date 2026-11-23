"""FastAPI server: chat endpoint plus AI-provider management."""

from __future__ import annotations

import time
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, ValidationError

from .llm import LLM, LLMError
from .providers import (
    DEFAULT_BASE,
    FailoverLLM,
    Format,
    Provider,
    ProviderStore,
    default_llm,
    default_store,
)
from .tutor import Tutor


class ChatRequest(BaseModel):
    sessionId: str
    message: str | None = None
    #: A v1.0 renderer message: {"version": "1.0", "action": {...}}
    a2ui: dict[str, Any] | None = None


class ChatResponse(BaseModel):
    text: str
    messages: list[dict[str, Any]]
    surfaceId: str | None
    provider: str | None = None


class ProviderIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    format: Format
    baseUrl: str = ""
    apiKey: str = ""
    model: str = Field(min_length=1, max_length=120)
    enabled: bool = True

    def fields(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "format": self.format,
            "base_url": self.baseUrl,
            "api_key": self.apiKey,
            "model": self.model,
            "enabled": self.enabled,
        }


class ProviderOut(BaseModel):
    id: str
    name: str
    format: Format
    baseUrl: str
    defaultBaseUrl: str
    apiKeyHint: str  # never the key itself
    model: str
    enabled: bool
    coolingDown: bool


class Order(BaseModel):
    ids: list[str]


def create_app(llm: LLM | None = None, store: ProviderStore | None = None) -> FastAPI:
    app = FastAPI(title="a2ui-tutor")
    store = store or default_store()
    llm = llm or default_llm(store)
    tutor = Tutor(llm)

    def out(p: Provider) -> ProviderOut:
        cooling = isinstance(llm, FailoverLLM) and llm.cooling_down(p.id)
        hint = f"…{p.api_key[-4:]}" if len(p.api_key) > 8 else ("set" if p.api_key else "")
        return ProviderOut(
            id=p.id,
            name=p.name,
            format=p.format,
            baseUrl=p.base_url,
            defaultBaseUrl=DEFAULT_BASE[p.format],
            apiKeyHint=hint,
            model=p.model,
            enabled=p.enabled,
            coolingDown=cooling,
        )

    def found(pid: str) -> Provider:
        try:
            return store.get(pid)
        except KeyError:
            raise HTTPException(404, "provider not found") from None

    @app.get("/api/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/chat", response_model=ChatResponse)
    async def chat(req: ChatRequest) -> ChatResponse:
        action = (req.a2ui or {}).get("action")
        r = await tutor.turn(req.sessionId, message=req.message, action=action)
        return ChatResponse(
            text=r.text, messages=r.messages, surfaceId=r.surface_id, provider=r.provider
        )

    @app.get("/api/providers", response_model=list[ProviderOut])
    async def list_providers() -> list[ProviderOut]:
        return [out(p) for p in store.providers]

    @app.post("/api/providers", response_model=ProviderOut, status_code=201)
    async def add_provider(body: ProviderIn) -> ProviderOut:
        try:
            return out(store.add(Provider(**body.fields())))
        except ValidationError as e:
            raise HTTPException(422, e.errors()[0]["msg"]) from None

    @app.put("/api/providers/order", response_model=list[ProviderOut])
    async def reorder(body: Order) -> list[ProviderOut]:
        try:
            store.reorder(body.ids)
        except ValueError as e:
            raise HTTPException(422, str(e)) from None
        return [out(p) for p in store.providers]

    @app.put("/api/providers/{pid}", response_model=ProviderOut)
    async def update_provider(pid: str, body: ProviderIn) -> ProviderOut:
        found(pid)
        try:
            return out(store.update(pid, body.fields()))
        except ValidationError as e:
            raise HTTPException(422, e.errors()[0]["msg"]) from None

    @app.delete("/api/providers/{pid}", status_code=204)
    async def delete_provider(pid: str) -> None:
        found(pid)
        store.delete(pid)

    @app.post("/api/providers/{pid}/test")
    async def test_provider(pid: str) -> dict[str, Any]:
        p = found(pid)
        if not isinstance(llm, FailoverLLM):
            return {"ok": False, "message": "Offline mode: providers are not used."}
        started = time.monotonic()
        try:
            await llm.call(p, "Reply with the single word: ok", [("user", "ping")])
        except LLMError as e:
            return {"ok": False, "message": str(e)}
        return {"ok": True, "message": f"OK in {time.monotonic() - started:.1f}s"}

    return app


app = create_app()
