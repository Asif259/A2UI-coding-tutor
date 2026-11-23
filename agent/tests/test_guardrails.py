"""Guardrails: invalid model output never reaches the renderer."""

from __future__ import annotations

import json

from app.tutor import Tutor

from .test_tutor import Scripted, quiz_reply


def block(components: list[dict]) -> str:
    from app.catalog import CATALOG_ID

    msg = [
        {
            "version": "1.0",
            "createSurface": {"surfaceId": "x", "catalogId": CATALOG_ID, "components": components},
        }
    ]
    return f"Sure.\n<a2ui-json>{json.dumps(msg)}</a2ui-json>"


BAD = [
    "Sure.\n<a2ui-json>[{not json at all</a2ui-json>",
    block([{"id": "root", "component": "Image", "url": "https://evil.example/x.png"}]),
    block(
        [
            {
                "id": "root",
                "component": "Quiz",
                "question": "q",
                "options": ["only"],
                "correctIndex": 0,
                "onAnswer": {"event": {"name": "a"}},
            }
        ]
    ),
    block([{"id": "root", "component": "Column", "children": ["missing"]}]),
]


async def test_invalid_output_falls_back_to_plain_text_without_json():
    for bad in BAD:
        t = Tutor(Scripted(bad, bad))  # still bad after the repair attempt
        r = await t.turn("s", message="hi")
        assert r.messages == [] and r.surface_id is None
        assert "a2ui-json" not in r.text and "{" not in r.text


async def test_one_repair_attempt_can_recover():
    llm = Scripted(BAD[1], quiz_reply("Fixed?"))
    r = await Tutor(llm).turn("s", message="quiz me")
    assert r.surface_id == "s1"
    assert "invalid" in llm.calls[1][-1][1]  # the model was told what was wrong


async def test_plain_text_answer_passes_through():
    r = await Tutor(Scripted("Just words.")).turn("s", message="hi")
    assert r.text == "Just words." and r.messages == []


async def test_llm_failure_does_not_crash():
    class Boom:
        async def generate(self, system, history):
            raise RuntimeError("quota")

    t = Tutor(Boom())
    r = await t.turn("s", message="hi")
    assert "unavailable" in r.text
    assert t.session("s").history == []  # failed turn leaves no dangling user message


async def test_empty_input_is_not_sent_to_model():
    llm = Scripted()
    r = await Tutor(llm).turn("s", message="   ")
    assert llm.calls == [] and r.messages == []
