# Project Progress Tracker — A2UI Tutor

> Last updated: 2026-11-23  
> Author: Asif259  
> Status: **MVP functional — landing page and provider model discovery shipped; courses planned**

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-08-xx | v0.1 | Initial scaffolding: FastAPI + React + A2UI catalog |
| 2026-09-xx | v0.5 | Multi-provider failover, offline mode, eval harness |
| 2026-10-xx | v0.8 | Output guardrails, repair attempt, plain-text fallback |
| 2026-11-10 | v1.0-alpha | Stable chat loop, docker-compose, CI pipeline |
| 2026-11-23 | v1.1-beta | Documentation package (this phase) |

---

## Feature Tracker

### P0 — Core (done)

| ID | Feature | Status | PR / Commit | Notes |
|----|---------|--------|-------------|-------|
| FR-001 | Freeform chat with A2UI surfaces | ✅ Done | `a29c6bc` | `POST /api/chat` loops correctly |
| FR-002 | Catalog guardrail rejection | ✅ Done | `ab6c4d4` | Invalid components → repair → plain text |
| FR-003 | Surface action round-trip | ✅ Done | `a29c6bc` | `describe_action()` converts to NL sentence |
| FR-004 | Multi-provider failover | ✅ Done | `a074729` | Cooldown 60 s, ordered list |
| FR-005 | Offline mode | ✅ Done | `ab6c4d4` | `TUTOR_OFFLINE=1` env flag |
| FR-019 | Auto-fetch model IDs on provider add | ✅ Done | _(uncommitted, 2026-11-24)_ | POST `/api/providers/models`; effect in Providers form |
| FR-006 | Course catalog (JSON-loaded) | 🔲 TODO | — | Planned P1 |
| FR-007 | Module selection UI | 🔲 TODO | — | Planned P1 |
| FR-008 | In-memory progress tracking | 🔲 TODO | — | Planned P1 |

### P1 — Important

| ID | Feature | Status | PR / Commit | Notes |
|----|---------|--------|-------------|-------|
| FR-009 | Persistent sessions (SQLite) | 🔲 TODO | — | Sprint 2 |
| FR-010 | Streaming LLM responses | 🔲 TODO | — | Sprint 2 |
| FR-011 | Adaptive question difficulty | 🔲 TODO | — | Sprint 3 |
| FR-012 | Dark mode toggle | 🔲 TODO | — | Sprint 2 |
| FR-013 | Export/share conversation | 🔲 TODO | — | Sprint 2 |

### P2 — Future

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| FR-014 | Sandbox execution | 🔲 Deferred | Requires external infra |
| FR-015 | User accounts | 🔲 Deferred | Personal project, out of scope |
| FR-016 | Mobile polish | 🔲 Deferred | Desktop-first for now |
| FR-017 | i18n | 🔲 Deferred | English-only |
| FR-018 | Public deployment | 🔲 Deferred | Localhost bind by design |

---

## Bug Tracker

| ID | Description | Severity | Status | Fixed In |
|----|-------------|----------|--------|----------|
| BUG-001 | Vite port fallback confusion on first start | Low | Won't fix | — |
| BUG-002 | Groq provider hits 429 under rapid testing | Medium | Documented | — |
| BUG-003 | Provider keys visible in Network tab (minor) | Low | Known | API returns masked hint only; key never echoed |

---

## Documentation Status

| Doc | Status | Owner | Last Reviewed |
|-----|--------|-------|---------------|
| `README.md` | ✅ Up to date | — | 2026-11-24 |
| `docs/architecture.md` | ✅ Accurate | — | 2026-11-10 |
| `docs/PRD.md` | ✅ Written today | Claude | 2026-11-23 |
| `docs/TRD.md` | ✅ Written today | Claude | 2026-11-23 |
| `docs/USER_JOURNEY.md` | ✅ Matches the landing page | Claude | 2026-11-24 |
| `docs/design.md` | ✅ Matches `styles.css` | Claude | 2026-11-24 |
| `docs/schema.md` | ✅ Written today | Claude | 2026-11-23 |
| `docs/FINAL_CHECK_PLAN.md` | ✅ Applied 2026-11-24 | Claude | 2026-11-24 |
| `docs/tracker.md` | ✅ Written today | Claude | 2026-11-23 |
| `docs/rules.md` | ✅ Written today | Claude | 2026-11-23 |

---

## Health Metrics (manual observations)

| Metric | Target | Current | Source |
|--------|--------|---------|--------|
| Surface validity rate | ≥ 95% | ~90% (Gemini) | `evals/run_eval.py` scores |
| Average LLM latency | < 3 s | ~1.8 s p50 (Gemini flash) | Manual timing |
| Test pass rate | 100% | ✅ passing | `pytest -q`, `vitest run` |
| Catalog sync | 0 drift | ✅ clean | CI `check_catalog_sync` job |
| Docker build time | < 2 min | ~90 s | `docker compose build` |

---

## Next Actions

1. Implement `agent/data/courses.json` with 1–2 demo courses
2. Build `GET /api/courses` endpoint in `app/main.py`
3. Add course-loading logic in `tutor.py` system prompt augmentation
4. Build `CourseBrowser` React component in `web/src/`
5. Wire up in-memory progress tracking in `Session` dataclass
6. Add integration tests for course-aware conversations
