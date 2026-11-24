# User Journey & Application Flow — A2UI Tutor

## Application Screens

| Screen | URL | Purpose |
|--------|-----|---------|
| **Landing page** | `/` | Hero, suggested prompts, statement, live session, how a reply is built, FAQ, CTA, footer |
| **Session** | `/#session` | The feed and composer, inside the landing page |
| **Providers dialog** | Dialog on `/` | Add, edit, reorder, test and disable AI providers |
| **Mobile menu** | Drawer on `/` | Section links and the Providers entry below 1024px |
| **Not found** | `/404.html` | Static fallback page |
| **Photo credits** | `/credits.html` | Static asset and typeface credits |

Courses, a course browser and a progress view are **planned (P1)**. They do not exist in this build; the tutor is a
freeform session on one page.

---

## Navigation Structure

```
Header (fixed)
├── A2UI TUTOR wordmark → #top
├── Section links: Session · How a reply is built · Questions
├── Providers button → opens the providers dialog
└── Menu button (< 1024px) → full-screen drawer

Main
├── 01 Hero            → Start a session / How a reply is built
├── 02 Start here      → three prompt rows that send into the session
├── 03 Statement       → thesis band
├── 03 Session         → feed, composer, Configure, Clear
├── 04 Guardrails      → how a reply is built (isometric figure)
├── 05 Questions       → FAQ
└── CTA                → Bring your own model key

Footer
└── Sections · Setup · Assets · legal row
```

---

## First-Time User Journey

```mermaid
flowchart TD
    A[Open http://localhost:5173] --> B[Read hero and suggested prompts]
    B --> C{Choose an entry}
    C -->|Press a Start here row| D[Prompt is sent to the session]
    C -->|Open Session and type| D
    C -->|No key yet| E[Open Providers]
    E --> F[Add provider: name, format, base URL, key, model]
    F --> G[Model IDs are fetched and the first is suggested]
    G --> H[Add provider]
    H --> D
    D --> I[Agent replies with a Quiz, CodeBlock or other surface]
    I --> J[Student presses a control]
    J --> K[Action goes back to the agent]
    K --> I
```

---

## Returning User Journey

```mermaid
flowchart TD
    A[Open app] --> B[New tab = new sessionId = crypto.randomUUID]
    B --> C[Feed is empty; providers persist on the server]
    C --> D[Send a prompt or press a suggested row]
    D --> E[Interact with surfaces]
    E --> D
```

There is no login and no saved conversation: closing or reloading the tab starts a fresh session. Provider settings
survive because they live in `agent/data/providers.json` on the server.

---

## Authentication Flow

**No authentication.** The app is designed for localhost. Anyone who can reach the port can read replies, change
providers and make the server call any base URL. Docker compose binds `127.0.0.1:8080`; never expose the API on a
public interface.

---

## Main Workflows

### Workflow 1: Prompt to surface

```mermaid
sequenceDiagram
    participant S as Student
    participant App as React App
    participant API as FastAPI
    participant T as Tutor
    participant L as LLM

    S->>App: Type a prompt or press a suggested row
    App->>API: POST /api/chat {sessionId, message}
    API->>T: turn(sessionId, message)
    T->>L: generate(system + history)
    L-->>T: text + <a2ui-json>
    T->>T: parse and validate against the catalog
    alt invalid
        T->>L: one repair attempt
        L-->>T: repaired output
    end
    T-->>API: Reply(text, messages, surfaceId, provider)
    API-->>App: ChatResponse
    App->>App: render the surface and the "Answered via …" line
```

### Workflow 2: Surface press back to the agent

```mermaid
sequenceDiagram
    participant S as Student
    participant Surface as A2UI surface
    participant App as React App
    participant API as FastAPI
    participant T as Tutor

    S->>Surface: Choose an option / select a line / reveal
    Surface->>App: action {name, surfaceId, sourceComponentId, context}
    App->>API: POST /api/chat {a2ui: {version, action}}
    API->>T: turn(sessionId, action)
    T->>T: describe_action resolves the stored surface
    T-->>App: next Reply
    App->>App: append the next surface
```

### Workflow 3: Add a provider

```mermaid
flowchart TD
    A[Open Providers] --> B[Press + Add provider]
    B --> C[Pick format, base URL and key]
    C --> D[POST /api/providers/models]
    D -->|models| E[First ID fills in; list shown]
    D -->|error| F[Message shown; type a model ID by hand]
    E --> G[Add provider]
    F --> G
    G --> H[Order is failover priority; Test pings it]
```

---

## Error & Edge Case Scenarios

| Scenario | System behavior |
|----------|----------------|
| LLM or provider failure | The chat request fails; the feed shows "Reply failed: …" with Retry |
| Invalid A2UI output after one repair | Plain-text fallback; no raw JSON is shown |
| No providers configured | The request fails and the feed offers Retry; add one in Providers |
| Provider key rejected | That provider sits out for 60 s and the next enabled one answers |
| Model list fetch fails | The form shows the error and still accepts a typed model ID |
| Network loss (web → API) | Fetch rejects; the error line and Retry appear |
| Tab reload | New session; provider settings remain |
| Action for an unknown surface | `describe_action()` returns a generic sentence; the agent still replies |
| Bad base URL | The server rejects it with 422 before any outbound call |

---

## Loading States

| State | Visual |
|-------|--------|
| Waiting for the agent | Three-bar skeleton, `aria-label="Waiting for the next surface"` |
| Surface rendering | Immediate, client-side |
| Model fetch in the provider form | "Fetching model IDs…" line |
| Provider test | Inline "✓ OK in 1.2s" or "✗ HTTP 401" note |

---

## Empty States

| Context | Message |
|---------|---------|
| Fresh session | "Nothing asked yet." plus a Write a prompt action |
| No providers | "No providers yet. Add one to start chatting." inside Providers |
| FAQ | Collapsed native `details` rows; no empty state needed |
| Static 404 | "This page has moved, or never existed." with links home and to the questions |
