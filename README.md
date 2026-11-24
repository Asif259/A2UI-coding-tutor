# a2ui-tutor

[![ci](https://github.com/OWNER/a2ui-tutor/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/a2ui-tutor/actions/workflows/ci.yml)

An interactive coding tutor on [A2UI v1.0](https://a2ui.org). The agent never answers with a wall of text. It answers
with **surfaces** built only from an approved custom catalog, and whatever the student presses goes back to the agent
and produces the next surface.

![demo](docs/demo.gif)

> The GIF was recorded with `TUTOR_OFFLINE=1`, a canned one-question quiz, because no Gemini key was available while
> building. The same UI path serves real Gemini output.

## Components (the whole catalog)

| Component | What the student does |
| --- | --- |
| `CodeBlock` | Reads highlighted code, selects a line, presses **Explain line** or **Run** |
| `Quiz` | Picks an option, gets instant right/wrong feedback, can ask for a hint |
| `PredictOutput` | Types what code prints, presses **Reveal** to compare |
| `StepWalkthrough` | Opens collapsible steps |
| `ProgressCard` | Sees topics mastered |

Plus the layout primitives `Text`, `Row`, `Column`, `Divider`. Nothing else can be drawn: see [architecture](docs/architecture.md).

## Quickstart

```bash
cp .env.example .env            # optional: GEMINI_API_KEY seeds a first provider, or TUTOR_OFFLINE=1
# agent
cd agent && python -m venv .venv && .venv/bin/pip install -e ".[dev]"
.venv/bin/uvicorn app.main:app --port 8000
# web, in a second terminal
cd web && npm install && npm run dev      # http://localhost:5173
```

Or `docker compose up --build` and open http://localhost:8080.

Checks (same as CI):

```bash
cd agent && .venv/bin/ruff check . && .venv/bin/pytest -q && .venv/bin/python -m app.catalog.build --check
cd web && npx tsc --noEmit && npx vitest run && npx vite build
cd agent && .venv/bin/python evals/run_eval.py     # 10 prompts against the configured model
```

## AI providers and automatic failover

Open **Providers** from the nav (or the Configure link in the session) to add as many providers as you like: name, API format, base URL, API key and
model ID. Formats: **OpenAI-compatible** (OpenAI, OpenRouter, DeepSeek, Groq, Ollama, LM Studio: set the base URL),
**Anthropic** and **Google Gemini**. Providers are tried top to bottom. If one fails (quota, outage, bad key,
timeout) it sits out for 60 s and the next one answers; each reply shows which provider served it. Use **Test**,
reorder with the arrows, disable without deleting.

Keys are stored only on the server in `agent/data/providers.json` (mode 0600, gitignored) and the API returns only a
masked hint. There is **no login**: run it on localhost only (compose binds `127.0.0.1`). Anyone who can reach the
port can read replies, add providers and make the server call any base URL.

## Design tradeoffs

- **Catalog as guardrail, not prompt.** The prompt asks for approved components; the validator enforces it. A reply
  with an `Image`, an unknown property or a 1-option quiz never reaches the renderer.
- **One JSON catalog, two consumers.** Python and TypeScript read the same generated file; CI catches drift.
- **Correct answers travel with the component.** Feedback is instant and offline-capable, at the cost that a curious
  student can read the answer from the wire. Fine for a tutor, wrong for an exam.
- **Code is never executed.** `Run` asks the agent to reason about output; `expectedOutput` comes from the model and
  can be wrong. Real execution would need a sandbox.
- **Direct JSON, not Express.** More tokens than the SDK's compact Express notation, but easier to read in logs and
  tests.
- **Non-streaming, in-memory sessions.** Simple and testable; a real deployment needs streaming and a session store.
- **Per-line highlighting.** Multi-line strings and comments can be mis-coloured; it keeps line selection trivial.

## Documentation

A full design-doc package lives in [`docs/`](docs/). Use it to understand, extend, or vibe-code the app from scratch:

| Doc | What's inside |
|-----|---------------|
| [PRD.md](docs/PRD.md) | Product vision, user needs, P0/P1/P2 requirements, success metrics |
| [TRD.md](docs/TRD.md) | Architecture, API contract, data models, security, deployment |
| [USER_JOURNEY.md](docs/USER_JOURNEY.md) | Screen map, first-time & returning flows, error scenarios |
| [design.md](docs/design.md) | Color palette, typography, spacing, component specs, states |
| [schema.md](docs/schema.md) | Provider/session/catalog shapes; planned SQLite schema for persistence |
| [FINAL_CHECK_PLAN.md](docs/FINAL_CHECK_PLAN.md) | The last pre-commit scan: findings, decisions and what was applied |
| [tracker.md](docs/tracker.md) | Feature checklist, bug log, health metrics, next actions |
| [rules.md](docs/rules.md) | Non-negotiables for agents and humans working on this codebase |
| [architecture.md](docs/architecture.md) | Mermaid sequence diagram + pieces table (original pre-docs artifact) |

**Recommended reading order:** TRD → USER_JOURNEY → PRD → FINAL_CHECK_PLAN. Flip to rules.md before editing code; tracker.md as the living changelog.

The docs describe the current codebase; update them when you ship a feature that changes behavior.

---

## Status and limits

Unit tests use scripted fake models and mocked HTTP for the OpenAI and Anthropic formats. A live Gemini
(`gemini-3.5-flash`) eval scored 8/10 expected surfaces before hitting the free-tier quota; the failures were API
errors, not invalid output. Real OpenAI and Anthropic endpoints were not called. The Docker images build and serve
(offline mode checked). See [docs/quickstart-notes.md](docs/quickstart-notes.md) for the official quickstart run.

MIT licensed.
