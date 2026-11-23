"""FastAPI server: POST /api/chat takes a message or an A2UI action, returns A2UI messages."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel

from .llm import LLM, default_llm
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


def create_app(llm: LLM | None = None) -> FastAPI:
    app = FastAPI(title="a2ui-tutor")
    tutor = Tutor(llm or default_llm())

    @app.get("/api/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/chat", response_model=ChatResponse)
    async def chat(req: ChatRequest) -> ChatResponse:
        action = (req.a2ui or {}).get("action")
        r = await tutor.turn(req.sessionId, message=req.message, action=action)
        return ChatResponse(text=r.text, messages=r.messages, surfaceId=r.surface_id)

    return app


app = create_app()
