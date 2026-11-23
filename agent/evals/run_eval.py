"""Eval: send 10 sample prompts to the configured model and score the UI it returns.

    python evals/run_eval.py              # Gemini if GEMINI_API_KEY is set, else offline stub
    python evals/run_eval.py --strict     # exit 1 unless every reply is valid A2UI

Per prompt: did it produce a validated surface (not the plain-text fallback), and was the
expected custom component appeared anywhere in the surface? The last prompt is a jailbreak: any *valid* catalog
surface or plain text passes, a forbidden component never can (the validator blocks it).
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.llm import default_llm  # noqa: E402
from app.tutor import Tutor  # noqa: E402

LAYOUT = {"Column", "Row", "Text", "Divider"}
logging.basicConfig(level=logging.WARNING)


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()
    cases = json.loads((pathlib.Path(__file__).parent / "prompts.json").read_text())
    llm = default_llm()
    print(f"backend: {type(llm).__name__}\n")
    valid = matched = 0
    for i, case in enumerate(cases, 1):
        r = await Tutor(llm).turn(f"eval-{i}", message=case["prompt"])
        names = [c["component"] for m in r.messages for c in m["createSurface"]["components"]]
        ok = bool(names)
        hit = ok and (case["expect"] == "ANY_VALID" or case["expect"] in names)
        got = ",".join(dict.fromkeys(n for n in names if n not in LAYOUT)) if ok else None
        valid += ok
        matched += hit
        label = "ok " if hit else ("ui " if ok else "TXT")
        print(f"{i:2} {label} expected={case['expect']:<16} got={got or 'plain-text fallback'}")
    print(f"\nvalid surface: {valid}/{len(cases)}   expected component: {matched}/{len(cases)}")
    return 0 if (not args.strict or valid == len(cases)) else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
