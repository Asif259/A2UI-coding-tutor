"""Catalog validation: the agent can only draw approved, well-formed components."""

from __future__ import annotations

import copy
import json

import pytest
from a2ui.core import A2uiError

from app.catalog import CATALOG_ID, CATALOG_JSON, COMPONENT_NAMES, new_renderer_state
from app.catalog import build as catalog_build


def surface(components: list[dict]) -> dict:
    return {
        "version": "1.0",
        "createSurface": {"surfaceId": "s1", "catalogId": CATALOG_ID, "components": components},
    }


QUIZ = {
    "id": "quiz",
    "component": "Quiz",
    "question": "What does len([1, 2, 3]) return?",
    "options": ["2", "3", "4"],
    "correctIndex": 1,
    "selected": {"@path": "/answer"},
    "onAnswer": {"event": {"name": "quiz_answer", "context": {"choice": {"@path": "/answer"}}}},
}
CODE = {
    "id": "code",
    "component": "CodeBlock",
    "code": "print('hi')",
    "language": "python",
    "selectedLine": {"@path": "/line"},
    "runAction": {"event": {"name": "run_code", "context": {}}},
    "explainAction": {"event": {"name": "explain_line", "context": {"line": {"@path": "/line"}}}},
}
ROOT = {"id": "root", "component": "Column", "children": ["code", "quiz"]}


def apply(components: list[dict]) -> None:
    new_renderer_state().apply(surface(components))


def test_catalog_offers_only_approved_components():
    assert set(COMPONENT_NAMES) >= {"CodeBlock", "Quiz", "Text", "Row", "Column"}
    for forbidden in ("Image", "Video", "AudioPlayer", "Modal", "TextField", "Button"):
        assert forbidden not in COMPONENT_NAMES


def test_valid_code_and_quiz_surface_passes():
    apply([ROOT, CODE, QUIZ])


@pytest.mark.parametrize("name", ["Image", "Video", "Iframe", "Script"])
def test_unknown_component_is_rejected(name: str):
    with pytest.raises(A2uiError):
        apply([{"id": "root", "component": name, "url": "https://evil.example"}])


def test_unexpected_property_is_rejected():
    bad = {**QUIZ, "onClickEval": "alert(1)"}
    with pytest.raises(A2uiError):
        apply([{"id": "root", "component": "Column", "children": ["quiz"]}, bad])


@pytest.mark.parametrize(
    "patch",
    [
        {"options": ["only one"]},
        {"options": ["a"] * 7},
        {"correctIndex": -1},
        {"correctIndex": "1"},
        {"question": 42},
    ],
)
def test_quiz_property_constraints(patch: dict):
    with pytest.raises(A2uiError):
        apply([{"id": "root", "component": "Column", "children": ["quiz"]}, {**QUIZ, **patch}])


@pytest.mark.parametrize("missing", ["question", "options", "correctIndex", "onAnswer"])
def test_quiz_required_properties(missing: str):
    bad = {k: v for k, v in QUIZ.items() if k != missing}
    with pytest.raises(A2uiError):
        apply([{"id": "root", "component": "Column", "children": ["quiz"]}, bad])


def test_code_block_rejects_unknown_language():
    bad = {**CODE, "language": "brainfuck"}
    with pytest.raises(A2uiError):
        apply([{"id": "root", "component": "Column", "children": ["code"]}, bad])


def test_wrong_catalog_id_is_rejected():
    msg = surface([ROOT, CODE, QUIZ])
    msg["createSurface"]["catalogId"] = "https://example.com/other.json"
    with pytest.raises(A2uiError):
        new_renderer_state().apply(msg)


def test_checked_in_catalog_copies_are_current():
    rendered = catalog_build.render()
    for path in catalog_build.OUTPUTS:
        assert path.read_text("utf-8") == rendered, f"{path} stale: python -m app.catalog.build"


def test_catalog_declares_v1():
    assert CATALOG_JSON["protocolVersion"] == "1.0"
    assert CATALOG_JSON["catalogId"] == CATALOG_ID
    assert json.loads(json.dumps(copy.deepcopy(CATALOG_JSON)))  # serialisable


NEW_COMPONENTS = {
    "PredictOutput": {
        "component": "PredictOutput",
        "code": "print(1)",
        "language": "python",
        "expectedOutput": "1",
        "prediction": {"@path": "/g"},
        "onReveal": {"event": {"name": "predict_reveal", "context": {"guess": {"@path": "/g"}}}},
    },
    "StepWalkthrough": {
        "component": "StepWalkthrough",
        "title": "How a loop runs",
        "steps": [{"title": "Start", "body": "i is 0"}, {"title": "Next", "body": "i is 1"}],
    },
    "ProgressCard": {
        "component": "ProgressCard",
        "title": "Progress",
        "topics": [{"name": "Lists", "mastery": 90}, {"name": "Loops", "mastery": 40}],
        "onContinue": {"event": {"name": "continue", "context": {}}},
    },
}


@pytest.mark.parametrize("name", NEW_COMPONENTS)
def test_new_components_valid(name: str):
    apply([{"id": "root", **NEW_COMPONENTS[name]}])


@pytest.mark.parametrize(
    ("name", "patch"),
    [
        ("ProgressCard", {"topics": [{"name": "x", "mastery": 101}]}),
        ("ProgressCard", {"topics": []}),
        ("StepWalkthrough", {"steps": []}),
        ("StepWalkthrough", {"steps": [{"title": "t"}]}),
        ("PredictOutput", {"language": "cobol"}),
    ],
)
def test_new_components_constraints(name: str, patch: dict):
    with pytest.raises(A2uiError):
        apply([{"id": "root", **NEW_COMPONENTS[name], **patch}])
