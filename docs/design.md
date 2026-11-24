# UI/UX Design System — A2UI Tutor

## Philosophy

Editorial, achromatic, and quiet. The page reads like a printed sheet: black type on warm grey, white bands for the
working areas, and a single signal colour reserved for state. The surfaces carry the lesson; chrome stays out of the way.

Source of truth: `web/src/styles.css`. This document mirrors its tokens rather than inventing new ones.

---

## Color

Everything is neutral except semantic feedback (correct / wrong) and the orange signal used in the isometric figure.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#ededed` | Page background |
| `--neutral-white` | `#ffffff` | Session band, panel, cards |
| `--neutral-100` | `#f5f5f5` | Quiet fills |
| `--neutral-200` | `#e5e5e5` | Bars and rules |
| `--neutral-300` | `#d4d4d4` | Placeholder art strokes |
| `--neutral-400` | `#a3a3a3` | Placeholders, code line numbers, dark-bg comments |
| `--neutral-500` | `#737373` | Icons on dark, code-token muted |
| `--neutral-600` | `#525252` | Body secondary text (`.muted`) |
| `--text-muted` | `#666666` | Mono labels and meta on light backgrounds (4.7:1 on `#ededed`) |
| `--tone-strong` | `#151515` | Primary text and the CTA/footer ground |
| `--border-subtle` | `#15151529` | 1px rules and card borders |
| `--ok` / `--ok-fill` | `#2f7d4f` / `#e3eee7` | Correct quiz feedback only |
| `--bad` / `--bad-fill` | `#a3342b` / `#f6e5e2` | Wrong quiz feedback only |
| `--signal` | `#ff4d2e` | Isometric diagram pulse only |

Dark mode is not implemented. Dark bands (CTA, footer) invert the same neutrals; they are not a theme.

### Contrast

- Normal text on `#ededed`, `#ffffff` and `#f5f5f5` uses `#151515`, `#525252` or `#666666`; all reach 4.5:1 or better.
- On `#0a0a0a` code ground, comments and line numbers use `#a3a3a3` (7.9:1).
- Disabled controls are the only text allowed below 4.5:1, and they also carry `disabled`/`aria-disabled`.

---

## Typography

Geist for everything; Geist Mono for labels, metadata and code. Loaded from Google Fonts in `index.html` and the two
static pages.

| Role | Size / line-height | Notes |
|------|--------------------|-------|
| `.h0` | 72 / 68, -2.5px | Not used on the landing page |
| `.h1` | 48 / 52, -1.5px | Statement band |
| `.h2` | 40 / 44, -1.5px | Hero `h1` and section heads |
| `.h3` | 32 / 36, -1px | Section headings |
| `.h4` | 24 / 28, -0.75px | Row titles, drawer links |
| `.h5` | 20 / 24, -0.5px | Empty-state heading |
| `.h6` | 14 / 18, -0.25px | FAQ summaries, step titles |
| `.body-lg` / `.body-md` / `.body-sm` | 17 / 15 / 13 | Body copy; `.body-md` caps at 64ch |
| `.label-lg` / `.label-sm` / `.eyebrow` | 11 / 10 | Uppercase mono, 0.04–0.06em tracking |

Mobile (<768px) steps down: `h0` 44, `h1` 36, `h2` 30, `h3` 26, `h4` 20, body 15/14/12.

---

## Spacing and Layout

A 5px scale: `5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 75, 100`.

| Token | Desktop | Mobile |
|-------|---------|--------|
| `--container` | 1280px | 1280px |
| `--grid-margin` | 40px | 20px |
| `--grid-gutter` | 20px | 12px |
| `--section-pad` | 96px | 64px |
| `--nav-h` | 64px | 64px |

Sections alternate the page ground with `.section--white` bands. The studio is a two-column split (side note + feed)
that collapses to one column at 1024px. No horizontal scrolling is intended at 375px; wide code scrolls inside its
own card.

---

## Radius, Borders and Depth

| Context | Radius |
|---------|--------|
| Buttons, inputs, option rows | 8px |
| Cards, surfaces, panels | 10px |
| Small controls and line numbers | 4px |
| Pills and progress bars | 9999px |

Borders are 1px `--border-subtle`; there are no drop shadows. The code surface is the only dark card
(`#0a0a0a`), with a `#171717` header.

---

## Component Specs

### Nav

Fixed, 64px, translucent page ground with blur. Wordmark left; three section links and Providers on the right.
Hides on scroll down after 60vh, returns on scroll up; suppressed while a drawer, panel or focus is open.
Below 1024px the links collapse into a full-screen drawer.

### Hero

Eyebrow, `h1` set in masked words that rise once, a right-hand paragraph, two buttons, a facts row, then a 21:9
band. The band currently ships a generated SVG placeholder with descriptive alt text.

### Start Here rows

Full-width buttons in a list. Each row is index, title, one-line description, arrow. Hover inverts to the strong
ground. The description is hidden below 768px.

### Studio (session)

White band. Left: section label, heading, explanation, provider state, Configure / Clear links. Right: the feed and
composer. The feed is `aria-live="polite"`; the empty state offers a "Write a prompt" action that focuses the
textarea.

### Feed messages

- User: dark ground, light text, aligned right.
- Tutor: white card with a subtle border, aligned left.
- Surface: white card, 10px radius, 1px border; a "Answered via …" mono line sits underneath.
- Busy: three-bar skeleton with `aria-label="Waiting for the next surface"`.
- Error: one line plus an inline Retry button.

### Composer

Label above a 3-row textarea, hint below, primary "Send prompt" button. Enter sends, Shift+Enter adds a line. The
button is disabled when the prompt is empty or a reply is in flight.

### Providers panel

Right-side dialog, 520px (full width below 768px), scrim behind. Escape closes, focus moves to Close on open,
returns to the trigger on close, and Tab is trapped. Background scroll is locked. The panel contains the provider
list, reorder/test/enable/delete controls, and the add/edit form with model autocomplete from
`POST /api/providers/models`.

### Drawer

Full-screen, strong ground, large links, Providers entry and a "Local only · no accounts" line. Same focus and scroll
rules as the panel.

### CTA and footer

Both use the strong ground. The CTA is a headline, a rule, a paragraph and one light button. The footer carries the
wordmark, three link columns, a legal row and an oversized wordmark watermark.

### Static pages

`404.html` and `credits.html` are standalone HTML with the same palette, Geist, 40px headings, 8px button radius and
`#666666` muted text. They do not load the app bundle.

---

## State Styles

| State | Visual cue |
|-------|-----------|
| Loading | Skeleton bars; composer disabled |
| Error | One line ("Reply failed: …") plus Retry; no red ground |
| Disabled | 40% opacity, `cursor: not-allowed`, native `disabled` |
| Focus | 2px `#151515` outline, 3px offset (light ground) or `#ededed` (dark ground) |
| Quiz correct | Green fill and border, mono "Correct." label |
| Quiz wrong | Red fill and border, mono "Not quite." label |
| Selected code line | Dark line ground; pressed line number turns white |
| Reduced motion | Transitions and animations removed; reveals start visible |

---

## Accessibility Checklist

- [x] One `h1` per document; `header`, `nav`, `main`, `footer` landmarks
- [x] Skip link to the session
- [x] Focus-visible outline on every interactive element
- [x] Dialogs mark `aria-modal`, set `inert` when closed, trap Tab and return focus
- [x] Quiz feedback is announced in a live region
- [x] Text tokens meet 4.5:1 on light and dark grounds
- [x] `prefers-reduced-motion` disables Lenis, reveals and CSS animation
- [x] Images carry alt text; the isometric figure has a title and description
- [x] Keyboard: Enter/Shift+Enter in the composer, Escape closes overlays, native `details` for FAQ
