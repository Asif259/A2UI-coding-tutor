"""The tutor: builds the prompt from the catalog, calls the LLM, returns A2UI messages."""

from __future__ import annotations

import glob
import json
import pathlib
from dataclasses import dataclass, field
from typing import Any

from a2ui.core import A2uiError
from a2ui.inference_formats import DirectJsonFormatFactory, to_message_models
from a2ui.parser.response_part import A2uiPart, TextPart
from a2ui.processor import A2uiRequestProcessor

from .catalog import CATALOG, new_renderer_state
from .llm import LLM, Turn

EXAMPLES_DIR = pathlib.Path(__file__).parent / "examples"

ROLE = """\
You are a friendly coding tutor for beginners. You reply with A2UI surfaces, not walls of text.
- Student asks to learn or be quizzed on a topic: reply with ONE Quiz surface.
- Student pastes code: reply with a CodeBlock surface plus one short Text line.
- When you get a message starting with "[action]", the student interacted with your last surface.
  React to it: right answer -> short praise and a harder Quiz; wrong answer -> explain the
  misconception briefly and give an easier Quiz; hint -> a smaller nudge; explain_line -> a Text
  explanation of that line.
- Each reply is exactly one surface in one <a2ui-json> block, with at most one sentence outside it.
"""


def _processor() -> A2uiRequestProcessor:
    examples = [
        to_message_models(json.loads(pathlib.Path(p).read_text("utf-8"))["messages"])
        for p in sorted(glob.glob(str(EXAMPLES_DIR / "*.json")))
    ]
    return A2uiRequestProcessor(
        [CATALOG],
        examples=examples,
        format_factory=DirectJsonFormatFactory(allowed_messages=["createSurface"]),
    )


@dataclass
class Session:
    history: list[Turn] = field(default_factory=list)
    surfaces: dict[str, dict[str, dict[str, Any]]] = field(
        default_factory=dict
    )  # sid -> id -> comp
    counter: int = 0


@dataclass
class Reply:
    text: str
    messages: list[dict[str, Any]]
    surface_id: str | None


def describe_action(action: dict[str, Any], session: Session) -> str:
    """Turns a renderer action into a sentence the model can reason about."""
    comps = session.surfaces.get(action.get("surfaceId", ""), {})
    comp = comps.get(action.get("sourceComponentId", ""), {})
    ctx = action.get("context") or {}
    name = action.get("name", "")
    if name == "quiz_answer":
        choice = ctx.get("choice")
        options = comp.get("options", [])
        if isinstance(choice, int) and 0 <= choice < len(options):
            verdict = "CORRECT" if choice == comp.get("correctIndex") else "WRONG"
            return (
                f"[action] quiz_answer: student chose option {choice} "
                f"({options[choice]!r}) for question {comp.get('question')!r}: {verdict}."
            )
    if name == "hint":
        return f"[action] hint: student asked for a hint on {comp.get('question')!r}."
    if name == "explain_line":
        lines = str(comp.get("code", "")).split("\n")
        n = ctx.get("line")
        if isinstance(n, int) and 1 <= n <= len(lines):
            return f"[action] explain_line: line {n} of the code is {lines[n - 1]!r}."
    if name == "run_code":
        return f"[action] run_code: student pressed Run on:\n{comp.get('code', '')}"
    return f"[action] {name}: context={json.dumps(ctx)}"


class Tutor:
    def __init__(self, llm: LLM) -> None:
        self.llm = llm
        self.processor = _processor()
        self.system = ROLE + "\n" + self.processor.prompt_snippet
        self.sessions: dict[str, Session] = {}

    def session(self, sid: str) -> Session:
        return self.sessions.setdefault(sid, Session())

    async def turn(self, sid: str, message: str | None = None, action: dict | None = None) -> Reply:
        s = self.session(sid)
        user_text = describe_action(action, s) if action else (message or "").strip()
        if not user_text:
            return Reply("Ask me about a topic or paste some code.", [], None)
        s.history.append(("user", user_text))
        raw = await self.llm.generate(self.system, s.history)
        s.history.append(("model", raw))
        return self._parse(s, raw)

    def _parse(self, s: Session, raw: str) -> Reply:
        text_parts: list[str] = []
        messages: list[dict[str, Any]] = []
        try:
            for part in self.processor.parse_response(raw):
                if isinstance(part, TextPart):
                    text_parts.append(part.text)
                elif isinstance(part, A2uiPart):
                    messages += [m.model_dump(by_alias=True, exclude_none=True) for m in part.a2ui]
            surface_id = self._assign_surface(s, messages)
        except A2uiError:
            # Guardrail: never ship unvalidated UI. Fall back to plain text.
            return Reply(raw.strip() or "Sorry, I could not build that.", [], None)
        return Reply(" ".join(t.strip() for t in text_parts if t.strip()), messages, surface_id)

    def _assign_surface(self, s: Session, messages: list[dict[str, Any]]) -> str | None:
        """The host, not the model, owns surface ids. Also re-validates the final messages."""
        sid = None
        state = new_renderer_state()
        for m in messages:
            cs = m.get("createSurface")
            if cs:
                s.counter += 1
                sid = cs["surfaceId"] = f"s{s.counter}"
                s.surfaces[sid] = {c["id"]: c for c in cs["components"]}
            state.apply(m)
        return sid
