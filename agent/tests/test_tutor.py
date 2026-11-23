from __future__ import annotations

import json

import pytest
from httpx import ASGITransport, AsyncClient

from app.catalog import CATALOG_ID
from app.llm import OfflineLLM
from app.main import create_app
from app.tutor import Tutor


class Scripted:
    """Fake LLM: returns queued replies and records what it was asked."""

    def __init__(self, *replies: str) -> None:
        self.replies, self.calls = list(replies), []

    async def generate(self, system, history):
        self.calls.append(list(history))
        return self.replies.pop(0)


def quiz_reply(question="Q?", correct=1) -> str:
    comps = [
        {
            "id": "root",
            "component": "Quiz",
            "question": question,
            "options": ["a", "b", "c"],
            "correctIndex": correct,
            "selected": {"@path": "/answer"},
            "onAnswer": {
                "event": {"name": "quiz_answer", "context": {"choice": {"@path": "/answer"}}}
            },
        }
    ]
    msg = [
        {
            "version": "1.0",
            "createSurface": {
                "surfaceId": "model-picked",
                "catalogId": CATALOG_ID,
                "components": comps,
            },
        }
    ]
    return f"Here you go.\n<a2ui-json>{json.dumps(msg)}</a2ui-json>"


async def test_topic_prompt_returns_quiz_with_host_owned_surface_id():
    t = Tutor(Scripted(quiz_reply()))
    r = await t.turn("s", message="quiz me on lists")
    assert r.surface_id == "s1"
    assert r.messages[0]["createSurface"]["surfaceId"] == "s1"
    assert r.messages[0]["createSurface"]["components"][0]["component"] == "Quiz"
    assert r.text == "Here you go."


@pytest.mark.parametrize(("choice", "verdict"), [(1, "CORRECT"), (0, "WRONG")])
async def test_action_round_trip_tells_model_if_answer_was_right(choice, verdict):
    llm = Scripted(quiz_reply(), quiz_reply("Next?"))
    t = Tutor(llm)
    first = await t.turn("s", message="quiz me")
    action = {
        "name": "quiz_answer",
        "surfaceId": first.surface_id,
        "sourceComponentId": "root",
        "context": {"choice": choice},
    }
    second = await t.turn("s", action=action)
    last_user = llm.calls[-1][-1][1]
    assert verdict in last_user
    assert second.surface_id == "s2"  # next surface is a new one


async def test_explain_line_is_resolved_to_source_text():
    code = [
        {
            "version": "1.0",
            "createSurface": {
                "surfaceId": "z",
                "catalogId": CATALOG_ID,
                "components": [
                    {
                        "id": "root",
                        "component": "CodeBlock",
                        "language": "python",
                        "code": "a = 1\nprint(a)",
                    }
                ],
            },
        }
    ]
    llm = Scripted(f"<a2ui-json>{json.dumps(code)}</a2ui-json>", quiz_reply())
    t = Tutor(llm)
    r = await t.turn("s", message="def f(): pass")
    await t.turn(
        "s",
        action={
            "name": "explain_line",
            "surfaceId": r.surface_id,
            "sourceComponentId": "root",
            "context": {"line": 2},
        },
    )
    assert "print(a)" in llm.calls[-1][-1][1]


async def test_http_round_trip_offline():
    async with AsyncClient(
        transport=ASGITransport(app=create_app(OfflineLLM())), base_url="http://t"
    ) as c:
        body = (await c.post("/api/chat", json={"sessionId": "x", "message": "lists"})).json()
        assert body["surfaceId"] == "s1" and body["messages"]
        act = {
            "version": "1.0",
            "action": {
                "name": "quiz_answer",
                "surfaceId": "s1",
                "sourceComponentId": "root",
                "context": {"choice": 1},
            },
        }
        again = (await c.post("/api/chat", json={"sessionId": "x", "a2ui": act})).json()
        assert again["surfaceId"] == "s2"
