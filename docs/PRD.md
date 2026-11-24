# Product Requirements Document — A2UI Tutor

## Vision

An interactive coding tutor that replaces walls of text with **A2UI surfaces** — small, focused mini-apps (quizzes, code explorers, output predictors, walkthroughs) that the student interacts with. Every interaction loops back to an AI agent, which generates the next surface. Built for **learning how A2UI works** while building a genuinely useful tutoring tool.

This is a **personal exploration project**, not a commercial product. No accounts, no public deployment target, no revenue model.

---

## Problem Statement

Traditional coding tutorials are passive: read a wall of text, watch a video, copy-paste code. Learners don't practice; they consume. Existing tools either give too much prose (chatbots) or too rigid structure (pre-built courses). A2UI bridges this gap — the AI responds with **interactive components the student must touch**, not just read.

---

## Target Users

| Persona | Description |
|---------|-------------|
| **The Explorer** (primary) | Developer learning A2UI and AI-assisted teaching. Wants to see what interactive surfaces can do. |
| **The Self-Learner** | Someone studying a topic who wants immediate, adaptive feedback without watching videos. |
| **The Hobbyist Tutor** | Anyone who wants to generate quizzes/explanations on demand for personal study. |

---

## User Needs & Pain Points

| Need | How A2UI Tutor Addresses It |
|------|------------------------------|
| "Don't just tell me — make me *do* something" | Every response is an interactive surface; no pure-text replies except fallbacks. |
| "I forgot what I learned yesterday" | Course progress persists across sessions (P1). |
| "My code doesn't work but I don't know why" | CodeBlock + step-by-step walkthrough shows execution paths visually. |
| "I want to learn at my own pace" | Structured courses let students follow a path; freeform chat lets them jump around. |
| "I keep hitting the same misconception" | Quiz component gives instant feedback; wrong answers trigger easier follow-up questions. |

---

## Functional Requirements

### P0 — MVP (shipped)

| ID | Requirement | Notes |
|----|-------------|-------|
| FR-001 | Student can send a freeform message and receive A2UI surfaces | Already works via `/api/chat` |
| FR-002 | Agent responds only with approved catalog components | Catalog guardrail enforced in `tutor.py` |
| FR-003 | Student can interact with surfaces (pick quiz options, select code lines, type predictions) | Actions loop back via `/api/chat` with `a2ui` payload |
| FR-004 | Multiple AI providers with automatic failover | OpenAI-compatible, Anthropic, Gemini supported |
| FR-005 | Offline mode (`TUTOR_OFFLINE=1`) provides canned responses | For testing without API keys |
| FR-020 | Landing page with suggested prompts, live session, guardrail explainer and FAQ | Shipped |
| FR-019 | Provider model-ID discovery while adding a provider | `POST /api/providers/models` |
| FR-021 | Accessible overlays: provider dialog and mobile drawer | Focus trap, Escape, scroll lock, focus return |

### P1 — Important (next round)

| ID | Requirement | Notes |
|----|-------------|-------|
| FR-006 | **Course catalog**: predefined courses with titles, descriptions, and module lists | Planned: JSON loaded by the agent |
| FR-007 | **Module selection**: student picks a course → sees module list → starts a module | Planned: navigation surface |
| FR-008 | **Progress tracking per session**: which modules/topics a student has completed | Planned: in-memory progress store |
| FR-009 | Persistent progress across sessions (localStorage or SQLite) | Currently sessions are ephemeral |
| FR-010 | Streaming LLM responses for better UX | Non-streaming currently |
| FR-011 | Custom question generation within a course | Agent adapts difficulty based on progress |
| FR-012 | Dark mode toggle | CSS variables ready; needs toggle |
| FR-013 | Export/share a conversation as a snippet | URL-encoded session state |

### P2 — Future Improvements

| ID | Requirement | Notes |
|----|-------------|-------|
| FR-014 | Real code execution sandbox (E2B / Firecracker) | Intentionally excluded from P0 |
| FR-015 | User accounts / OAuth | Out of scope (personal project) |
| FR-016 | Deeper mobile polish and gestures | The landing page is responsive to 375px |
| FR-017 | Multi-language support (i18n) | No i18n infrastructure yet |
| FR-018 | Public deployment with rate limiting | No auth means anyone with the URL controls it |

---

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | Latency: first surface renders within 3s for local models | < 3s p50 |
| NFR-002 | Reliability: malformed A2UI never reaches the renderer | One repair, then plain-text fallback; provider failures surface as a retryable error |
| NFR-003 | Security: API keys never leave the server | Keys stored in `agent/data/providers.json` (mode 0600) |
| NFR-004 | Privacy: no telemetry, no external tracking | No analytics, no cookies |
| NFR-005 | Accessibility: keyboard-navigable surfaces | ARIA labels present, focus-visible styles |
| NFR-006 | Local-only operation | Binds to `127.0.0.1`; no public exposure |

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Surface validity rate | ≥ 95% of agent replies are valid A2UI (not plain-text fallback) | Log count of repair attempts vs total turns |
| Quiz engagement | ≥ 70% of quizzes get attempted | Track `onAnswer` actions per surface |
| Course completion feel | Student can finish a module in one sitting | Time-on-task observation (manual) |
| Provider failover success | ≥ 90% of requests succeed on first or second provider | Count `failover` events in logs |

---

## Out of Scope (for now)

- User accounts and authentication
- Payment / subscription
- Real code execution (sandbox)
- Mobile app (native)
- Multi-tenant deployment
- Admin dashboard
- Social features (sharing, commenting)
- Gamification (badges, leaderboards)

---

## Version Boundaries

| Version | Scope |
|---------|-------|
| **v1 (MVP, shipped)** | Landing page, freeform chat, provider failover, model discovery, current surface catalog |
| **v2** | Structured courses and progress, persistence, streaming, dark mode, course creation UI |
| **v3** | Sandbox execution, accounts, deployment, mobile polish |
