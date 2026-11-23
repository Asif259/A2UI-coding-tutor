"""Builds the tutor catalog (the single source of truth) and writes it twice.

    python -m app.catalog.build           # rewrite both copies
    python -m app.catalog.build --check   # fail if either copy is stale (CI)

The catalog is derived from the SDK's v1.0 basic catalog, keeps only the
layout primitives the tutor needs, and adds the tutor's own components. The
Python agent validates model output against `tutor_catalog.json`; the web
client renders from an identical copy in `web/src/catalog/`.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys
from typing import Any

from a2ui.core.basic_catalog import BasicCatalog
from a2ui.core.catalog import ComponentApi

from .schemas import CATALOG_ID, CATALOG_INSTRUCTIONS, TUTOR_COMPONENTS

PROTOCOL_VERSION = "1.0"

#: The only basic components the agent may use. Everything else is not offered.
BASIC_ALLOWED = ["Text", "Row", "Column", "Divider"]

AGENT_DIR = pathlib.Path(__file__).resolve().parent
REPO = AGENT_DIR.parents[2]
OUTPUTS = [
    AGENT_DIR / "tutor_catalog.json",
    REPO / "web" / "src" / "catalog" / "tutor_catalog.json",
]


def build() -> dict[str, Any]:
    basic = BasicCatalog(PROTOCOL_VERSION)
    derived = basic.derive(
        catalog_id=CATALOG_ID,
        components=[
            *BASIC_ALLOWED,
            *(
                ComponentApi(name, schema, from_document=True)
                for name, schema in TUTOR_COMPONENTS.items()
            ),
        ],
        functions=[],
        instructions=CATALOG_INSTRUCTIONS,
    ).to_json()

    defs = dict(derived["$defs"])
    defs["CatalogComponentCommon"] = {
        "type": "object",
        "properties": {"weight": {"$ref": "#/$defs/Weight"}},
    }
    return {
        "$schema": derived["$schema"],
        "$id": CATALOG_ID,
        "catalogId": CATALOG_ID,
        "protocolVersion": PROTOCOL_VERSION,
        "title": "A2UI Tutor Catalog",
        "description": "Interactive coding-tutor components: code, quizzes and progress.",
        "instructions": CATALOG_INSTRUCTIONS,
        "components": derived["components"],
        "functions": derived.get("functions", {}),
        "$defs": defs,
    }


def render() -> str:
    return json.dumps(build(), indent=2, ensure_ascii=False) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = render()
    stale = [p for p in OUTPUTS if not p.exists() or p.read_text(encoding="utf-8") != text]
    if args.check:
        for p in stale:
            print(f"stale: {p} (run: python -m app.catalog.build)", file=sys.stderr)
        return 1 if stale else 0
    for p in OUTPUTS:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")
        print(f"wrote {p}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
