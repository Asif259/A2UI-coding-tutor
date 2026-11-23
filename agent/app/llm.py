"""LLM backends: Gemini for real use, a canned one for offline demos and tests."""

from __future__ import annotations

import json
import os
from typing import Protocol

Turn = tuple[str, str]  # (role: "user" | "model", text)


class LLM(Protocol):
    async def generate(self, system: str, history: list[Turn]) -> str: ...


class GeminiLLM:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        from google import genai

        self._client = genai.Client(api_key=api_key or os.environ["GEMINI_API_KEY"])
        self._model = model or os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    async def generate(self, system: str, history: list[Turn]) -> str:
        from google.genai import types

        contents = [types.Content(role=r, parts=[types.Part(text=t)]) for r, t in history]
        resp = await self._client.aio.models.generate_content(
            model=self._model,
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=system, temperature=0.4),
        )
        return resp.text or ""


class OfflineLLM:
    """No network: always answers with a one-question quiz on the user's topic."""

    async def generate(self, system: str, history: list[Turn]) -> str:
        topic = history[-1][1].strip()[:60] or "Python"
        surface = {
            "version": "1.0",
            "createSurface": {
                "surfaceId": "x",
                "catalogId": "https://a2ui-tutor.dev/catalogs/tutor/v1/catalog.json",
                "components": [
                    {
                        "id": "root",
                        "component": "Quiz",
                        "question": f"Offline demo: which is a Python list? ({topic})",
                        "options": ["(1, 2)", "[1, 2]", "{1, 2}", "{1: 2}"],
                        "correctIndex": 1,
                        "explanation": "Square brackets make a list.",
                        "hint": "Lists use square brackets.",
                        "selected": {"@path": "/answer"},
                        "onAnswer": {
                            "event": {
                                "name": "quiz_answer",
                                "context": {"choice": {"@path": "/answer"}},
                            }
                        },
                        "onHint": {"event": {"name": "hint", "context": {}}},
                    },
                ],
            },
        }
        return f"Let's check that.\n<a2ui-json>\n{json.dumps([surface])}\n</a2ui-json>"


def default_llm() -> LLM:
    if os.environ.get("TUTOR_OFFLINE") == "1" or not os.environ.get("GEMINI_API_KEY"):
        return OfflineLLM()
    return GeminiLLM()
