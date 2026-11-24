# Schema & Data Models — A2UI Tutor

> **Status**: In-memory only. No database. This document describes current models and the schema planned for P1 persistent storage.

---

## Current Runtime Models

### Provider (server-side Pydantic model)

Stored in `agent/data/providers.json` (mode 0600).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `str` | yes | 8-char hex slug, unique across list |
| `name` | `str` | yes | Display name; 1–60 chars |
| `format` | `Literal["openai","anthropic","gemini"]` | yes | Maps to SDK client |
| `base_url` | `str` | no | Empty = SDK default; must match `https?://` if set |
| `api_key` | `str` | yes | Stored plaintext; **never** returned in API responses |
| `model` | `str` | yes | Model ID, e.g. `"gemini-3.5-flash"` |
| `enabled` | `bool` | yes | False skips this provider in failover |

**Serialized shape (providers.json):**

```json
[
  {
    "id": "abc12345",
    "name": "Gemini (from .env)",
    "format": "gemini",
    "base_url": "",
    "api_key": "AQ.Ab8RN...",
    "model": "gemini-3.5-flash",
    "enabled": true
  }
]
```

### Session (in-memory dataclass)

Resides entirely in server process memory. Lost on restart.

```python
@dataclass
class Session:
    history: list[Turn]               # Turn = tuple[str, str]  ("user"|"model", raw_text)
    surfaces: dict[str, dict[str, dict]]  # surfaceId → {componentId → full_component_dict}
    counter: int                      # Monotonic integer; next surfaceId = f"s{counter}"

# Progress is not stored: ProgressCard receives topics as props from the model.
# Session state is lost on restart; persistence is planned (P1).
```

**`Turn` type:**

```python
Turn = tuple[str, str]   # ("user", "message text") or ("model", "<a2ui-json>...</a2ui-json>")
```

### Catalog (singleton loaded at startup)

Built once from `tutor_catalog.json` at process start. Read by both Python validator and TypeScript renderer.

**Schema source:** `agent/app/catalog/schemas.py` → `build.py` → `agent/app/catalog/tutor_catalog.json`, copied to `web/src/catalog/tutor_catalog.json` for the renderer.

| Component ID | Required fields | Optional fields |
|-------------|-----------------|-----------------|
| `CodeBlock` | `code`, `language` | `title`, `selectedLine`, `runAction`, `explainAction` |
| `Quiz` | `question`, `options` (2–6 strings), `correctIndex`, `onAnswer` | `explanation`, `hint`, `selected`, `onHint` |
| `PredictOutput` | `code`, `language`, `expectedOutput`, `onReveal` | `prompt`, `explanation`, `prediction` |
| `StepWalkthrough` | `steps[{title, body}]` (1–12) | `title` |
| `ProgressCard` | `topics[{name, mastery}]` (1–12, mastery 0–100) | `title`, `onContinue` |

Layout primitives `Text`, `Row`, `Column`, `Divider` come from the base catalog.

---

## Planned Persistent Schema (P1 — SQLite)

When persistence is added, the following SQLite schema is proposed. Single table per entity, zero FK complexity (local-only app).

```sql
CREATE TABLE sessions (
    id          TEXT PRIMARY KEY,       -- uuid4 hex
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    title       TEXT                    -- auto-derived from first user message
);

CREATE TABLE turns (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK(role IN ('user','model')),
    content     TEXT NOT NULL,          -- plain text for user; <a2ui-json>...</a2ui-json> for model
    timestamp   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE course_progress (
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    course_id   TEXT NOT NULL,
    module_id   TEXT NOT NULL,
    mastery     REAL NOT NULL DEFAULT 0.0 CHECK(mastery >= 0 AND mastery <= 1),
    completed   INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    PRIMARY KEY (session_id, course_id, module_id)
);

CREATE TABLE courses (
    id          TEXT PRIMARY KEY,       -- matches course.id in JSON file
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    modules     TEXT NOT NULL           -- JSON array of module objects
);
```

### Indexes

```sql
CREATE INDEX idx_turns_session ON turns(session_id, timestamp);
CREATE INDEX idx_progress_course ON course_progress(course_id);
```

---

## Course JSON Structure (source-of-truth file)

Location (proposed): `agent/data/courses.json`

```json
[
  {
    "id": "python-basics",
    "title": "Python Basics",
    "description": "Variables, types, control flow, functions.",
    "modules": [
      {
        "id": "vars-types",
        "title": "Variables & Types",
        "topics": ["int", "str", "list", "dict"],
        "surface_sequence": [
          { "type": "CodeBlock", "props": { "language": "python", "code": "..." } },
          { "type": "Quiz", "props": { ... } },
          { "type": "StepWalkthrough", "props": { ... } }
        ]
      }
    ]
  }
]
```

**Constraints:**
- `id`: lowercase, hyphens, globally unique across all course files
- `topics`: used for progress tracking granularity
- `surface_sequence`: ordered array; agent reads sequentially during module play

---

## Environment Variables

Not persisted — injected at runtime.

| Variable | Default | Purpose |
|----------|---------|---------|
| `GEMINI_API_KEY` | _(unset)_ | Optional seed for the first Gemini provider on initial boot |
| `GEMINI_MODEL` | `gemini-3.5-flash` | Model ID seeded into the first Gemini provider |
| `TUTOR_OFFLINE` | `0` | `1` disables LLM calls, returns canned surfaces |
| `PROVIDERS_FILE` | `./data/providers.json` | Override path for provider store |

---

## Migration Path: In-Memory → SQLite

When P1 is implemented, the migration script (`scripts/migrate_to_sqlite.py`) would:

1. Scan `/sessions/*.json` (or any existing JSON-based session store)
2. Open target SQLite DB
3. Create tables if absent
4. Backfill sessions + turns
5. Leave provider config in `providers.json` (file-based, no migration needed)

No schema versioning is required for the local project scope.
