"""LLM backends: Gemini for real use, a canned one for offline demos and tests."""

from __future__ import annotations

import json
from typing import Protocol

Turn = tuple[str, str]  # (role: "user" | "model", text)


class LLMError(Exception):
    """A model call failed. The message is safe to show to users (no keys, no response bodies)."""


class LLM(Protocol):
    async def generate(self, system: str, history: list[Turn]) -> str: ...


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
