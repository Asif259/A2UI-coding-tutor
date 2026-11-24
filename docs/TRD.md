# Technical Requirements Document — A2UI Tutor

## Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend framework | **React 19 + Vite 6** | Already in use; fast HMR; minimal bundle |
| UI primitive layer | **@a2ui/react + @a2ui/web_core** | A2UI v1.0 spec — the whole point of the project |
| Backend framework | **FastAPI + Uvicorn** | Async-native, auto-generated OpenAPI, fast |
| Language | **Python 3.11+** | a2ui-agent-sdk is Python-only; Gemini SDK native |
| Database | **None (in-memory) → SQLite (P1)** | Sessions are short-lived; no persistent user data needed yet |
| File storage | **Local JSON** | Providers config in `agent/data/providers.json` |
| LLM clients | **google-genai, openai, anthropic** | Official SDKs; FailoverLLM wraps them uniformly |
| Testing | **pytest + httpx + happy-dom** | pytest async auto-mode; httpx for mock HTTP; happy-dom for React |
| Linting / formatting | **ruff** | Fast, single-tool Python lint + format |
| Type checking | **TypeScript (strict) + tsc --noEmit** | Frontend types catch catalog drift |
| Build orchestration | **docker-compose** | One-command dev env; matches CI |
| CI | **GitHub Actions** | ruff, pytest, catalog sync check, tsc, vitest |

---

## Architecture Overview

```
┌─────────────────┐     POST /api/chat      ┌─────────────────┐
│   React Web     │ ──────────────────────► │   FastAPI       │
│   (Vite :5173)  │ ◄────────────────────── │   (:8000)       │
└─────────────────┘    A2UI surfaces        └────────┬────────┘
                                                      │
                                          ┌───────────▼───────────┐
                                          │     Tutor             │
                                          │  (prompt + validate)  │
                                          └───────────┬───────────┘
                                                      │
                                          ┌───────────▼───────────┐
                                          │   FailoverLLM         │
                                          │  (provider list)      │
                                          └───────────┬───────────┘
                                                      │
                          ┌───────────────────────────┼──────────────────┐
                          ▼                           ▼                  ▼
                    ┌──────────┐               ┌──────────┐        ┌──────────┐
                    │  Gemini  │               │  OpenAI  │        │Anthropic │
                    │  adapter │               │ adapter  │        │ adapter  │
                    └──────────┘               └──────────┘        └──────────┘
```

### Key Design Decisions

1. **Catalog as hard guardrail.** The prompt *suggests* components; the validator *rejects* anything outside the schema. Invalid output gets one repair attempt, then falls back to plain text.

2. **Host assigns surface IDs.** The model never controls `surfaceId`; the server increments a counter per session. This prevents client-side tampering.

3. **Actions describe, not trust.** When a student clicks a quiz option, the client sends the action; the server resolves the *actual* answer from its stored copy of the surface. The model never trusts the client's claim about correctness.

4. **One JSON catalog, two consumers.** `agent/app/catalog/build.py` writes `tutor_catalog.json`; both Python (schema validation) and TypeScript (renderer registration) read from the same file. CI fails if they drift.

5. **No streaming, in-memory sessions.** Simple and testable. Streaming and a session store are P1.

---

## API Design

### Chat Endpoint

```
POST /api/chat
Content-Type: application/json

Body (new message):
{
  "sessionId": "uuid",
  "message": "Quiz me on Python closures"
}

Body (surface action):
{
  "sessionId": "uuid",
  "a2ui": {
    "version": "1.0",
    "action": {
      "name": "quiz_answer",
      "surfaceId": "s3",
      "sourceComponentId": "q1",
      "timestamp": "2026-11-23T06:00:00Z",
      "context": { "choice": 1 }
    }
  }
}

Response:
{
  "text": "Great job!",
  "messages": [{ "createSurface": { ... } }],
  "surfaceId": "s4",
  "provider": "Gemini (from .env)"
}
```

### Provider Management

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/providers` | List all providers (keys masked) |
| POST | `/api/providers` | Add a provider |
| PUT | `/api/providers/{id}` | Update name/model/enabled |
| DELETE | `/api/providers/{id}` | Remove a provider |
| PUT | `/api/providers/order` | Reorder failover priority |
| POST | `/api/providers/{id}/test` | Ping the provider, return OK/fail |
| POST | `/api/providers/models` | List the model IDs a format/base URL/key offers (15 s timeout) |

### Health

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | `{"status": "ok"}` |

---

## Data Models

### Provider (server-side)

```python
class Provider(BaseModel):
    id: str              # uuid4 hex, 8 chars
    name: str            # display name, 1-60 chars
    format: Literal["openai", "anthropic", "gemini"]
    base_url: str        # empty = default for format
    api_key: str         # stored plaintext, never returned
    model: str           # e.g. "gemini-3.5-flash"
    enabled: bool
```

### Session (in-memory)

```python
@dataclass
class Session:
    history: list[Turn]                       # [("user", text), ("model", raw)]
    surfaces: dict[str, dict[str, dict]]      # surfaceId → {componentId → component_data}
    counter: int                              # monotonic, host-assigned surface IDs
    progress: dict[str, float]                # topic → mastery % (P0)
```

### Course (new, JSON-stored)

```json
{
  "id": "python-basics",
  "title": "Python Basics",
  "description": "Variables, types, control flow, functions",
  "modules": [
    {
      "id": "vars-types",
      "title": "Variables & Types",
      "topics": ["int", "str", "list", "dict"],
      "surfaces": ["intro_text", "code_block_1", "quiz_1", "predict_1", "wrap_up"]
    }
  ]
}
```

---

## Security

| Concern | Mitigation |
|---------|-----------|
| API key exposure | Stored only on server in `providers.json` (mode 0600); API returns masked hint only |
| No auth = anyone can use | Bind to `127.0.0.1` only; docker-compose exposes `127.0.0.1:8080` |
| arbitrary URL redirection | Provider `base_url` validated on input (`http://` or `https://` prefix); localhost-only binding |
| LLM prompt injection | Student input goes into chat history; system prompt is fixed and separated |
| Surface ID tampering | Host-assigned IDs; model cannot set its own |

---

## Environment Configuration

```bash
# .env (never committed)
GEMINI_API_KEY=...          # seeded as first provider on initial start
GEMINI_MODEL=gemini-3.5-flash
TUTOR_OFFLINE=0             # 1 = skip LLM calls, serve canned surfaces

# Optional: override provider storage path
PROVIDERS_FILE=./data/providers.json
```

---

## Development vs Production

| Env | Command | Notes |
|-----|---------|-------|
| Dev | `uvicorn app.main:app --port 8000 --reload` | Hot reload on agent; `npm run dev` on web |
| Docker | `docker compose up --build` | Both services, ports `127.0.0.1:8080` |
| Tests | `pytest -q` / `vitest run` | Fast, mocked LLMs for Python; happy-dom for React |
| Eval | `python evals/run_eval.py` | 10 prompts against live model, scores surface validity |

---

## Deployment

Not targeted for public deployment (personal project). If deployed internally:

1. Run behind reverse proxy with TLS
2. Add basic auth or VPN restriction (no auth built in)
3. Set `PROVIDERS_FILE` to a secure volume
4. Enable structured logging
