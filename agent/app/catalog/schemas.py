"""JSON Schemas for the tutor's own components (A2UI v1.0 catalog format)."""

from __future__ import annotations

from typing import Any

CATALOG_ID = "https://a2ui-tutor.dev/catalogs/tutor/v1/catalog.json"
COMMON = "https://a2ui.org/specification/v1_0/common_types.json#/$defs"

CATALOG_INSTRUCTIONS = """\
You are drawing for a coding tutor. Rules:

- Pick the component that teaches best: CodeBlock to show code, Quiz to check
  understanding, never prose where a component fits.
- One idea per surface. Keep Text short; the components carry the lesson.
- A Quiz has exactly one correct option; set correctIndex (0-based) and a one
  or two sentence explanation. Do not leak the answer in the question.
- Wire every interactive component to an action so the student's choice comes
  back to you. Use the exact action names and context bindings in the examples.
- Never invent component names or properties. Only the listed ones exist.\
"""


def _dyn(kind: str, desc: str) -> dict[str, Any]:
    return {"$ref": f"{COMMON}/{kind}", "description": desc}


def _action(desc: str) -> dict[str, Any]:
    return {"$ref": f"{COMMON}/Action", "description": desc}


def _component(name: str, desc: str, props: dict[str, Any], required: list[str]) -> dict[str, Any]:
    return {
        "type": "object",
        "allOf": [
            {
                "type": "object",
                "description": desc,
                "properties": {"component": {"const": name}, **props},
                "required": ["component", *required],
            },
            {"$ref": f"{COMMON}/ComponentCommon"},
            {"$ref": "#/$defs/CatalogComponentCommon"},
        ],
        "unevaluatedProperties": False,
    }


LANGUAGES = ["python", "javascript", "typescript", "bash", "json", "java", "go", "rust", "sql", "c"]

CODE_BLOCK = _component(
    "CodeBlock",
    "Syntax-highlighted code. The student can click a line number to select it, then press"
    " 'Explain line'. 'Run' asks the agent to predict/explain the output (code is never executed).",
    {
        "code": _dyn("DynamicString", "The source code to show."),
        "language": {"type": "string", "enum": LANGUAGES, "description": "Syntax language."},
        "title": {"type": "string", "description": "Optional short caption, e.g. a filename."},
        "selectedLine": _dyn(
            "DynamicNumber",
            'Bound to the 1-based selected line: {"@path": "/selectedLine"}.',
        ),
        "runAction": _action("Fired when the student presses Run."),
        "explainAction": _action(
            "Fired when the student presses 'Explain line'. Context should bind the selected line."
        ),
    },
    ["code", "language"],
)

QUIZ = _component(
    "Quiz",
    "A multiple-choice question with instant feedback. The component marks the answer right or"
    " wrong locally, then fires onAnswer so the agent can respond.",
    {
        "question": _dyn("DynamicString", "The question text."),
        "options": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 2,
            "maxItems": 6,
            "description": "The answer choices.",
        },
        "correctIndex": {
            "type": "integer",
            "minimum": 0,
            "description": "0-based index of the one correct option.",
        },
        "explanation": _dyn("DynamicString", "Shown after answering; why the answer is right."),
        "hint": {"type": "string", "description": "Optional hint text shown on request."},
        "selected": _dyn(
            "DynamicNumber",
            'Bound path the component writes the chosen index to: {"@path": "/answer"}.',
        ),
        "onAnswer": _action("Fired after the student picks an option. Bind the chosen index."),
        "onHint": _action("Fired when the student asks for a hint."),
    },
    ["question", "options", "correctIndex", "onAnswer"],
)

TUTOR_COMPONENTS: dict[str, dict[str, Any]] = {
    "CodeBlock": CODE_BLOCK,
    "Quiz": QUIZ,
}
