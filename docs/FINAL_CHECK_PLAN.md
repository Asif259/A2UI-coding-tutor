# Final check: frontend scan and update plan

Status: applied 2026-11-24. Decisions: keep `lenis`, remove `playwright` and the two scripts, P0 and P1 done. Bundle is split by vendor chunk (no async flash) and the main chunk is 57 kB.
Scope: the uncommitted work added on top of commit a074729 (landing page, motion, static pages, provider model listing, docs).

## 1. Scan results

| Check | Result |
|---|---|
| `tsc --noEmit` | Clean |
| `vitest` | 8 of 8 passed |
| `vite build` | Succeeds. The main bundle is 863 kB (249.76 kB gzip), which triggers Vite's warning for chunks over 500 kB |
| `ruff` | Clean |
| `pytest` | 48 passed |
| Secrets scan | Clean |
| Impeccable (design linter) | Findings on the two static pages: low contrast on muted text, and the "overused font" flag for Geist |

No build or test failures. The problems are about scope: new dependencies, stray scripts, untested new code, bundle size, accessibility and motion, unreviewed docs, and contrast.

## 2. What changed (uncommitted)

Modified:
- `README.md`
- `agent/app/main.py` and `agent/app/providers.py` (add `list_models` and `POST /api/providers/models`)
- `web/index.html`
- `web/package.json` and `web/package-lock.json` (add `lenis ^1.3.27`, and `playwright ^1.65.1` as a devDependency)
- `web/src/App.tsx` (landing page)
- `web/src/Providers.tsx`
- `web/src/api.ts`
- `web/src/styles.css`

Untracked:
- `docs/IMPLEMENTATION_PLAN.md`, `PRD.md`, `TRD.md`, `USER_JOURNEY.md`, `design.md`, `rules.md`, `schema.md`, `tracker.md`
- `web/public/` (`404.html`, `credits.html`, `LICENSE.txt`, `img/`)
- `web/shoot.cjs` and `web/verify.cjs`
- `web/src/motion.tsx`
- `web/src/components/` (Cta, Faq, Footer, Hero, HowItWorks, Icons, Nav, ProvidersPanel, StartHere, Statement, Studio, isoReply.ts)

## 3. Plan

### P0: do before committing

1. **Decide on `lenis` and `playwright`.** Both are new dependencies. `lenis` drives smooth scrolling in `motion.tsx`. `playwright` is only used by the two scripts in item 2. Keep or remove each one. Installing or removing needs your approval.
2. **Handle `shoot.cjs` and `verify.cjs`.** Either move them into a `web/scripts/` folder and remove hard-coded paths and URLs, or delete them. If `playwright` is dropped, delete them.
3. **Add tests for the new code.**
   - vitest: `Studio`, `ProvidersPanel`, and `isoReply`.
   - pytest: `list_models` for success, a provider HTTP error, and an invalid base URL that returns 422.
4. **Fix contrast on the static pages.** In `credits.html` and `404.html`, change `--muted` from `#737373` to `#666666` so small text reaches 4.5:1 (WCAG AA).

### P1: do in the same pass if time allows

5. **Cut the bundle.** Code-split highlight.js and the custom catalog with dynamic imports. Target: main chunk under 500 kB.
6. **Accessibility and motion pass.**
   - Focus trap and focus return for any dialog or drawer.
   - Landmarks (`header`, `nav`, `main`, `footer`) and one `h1` per page.
   - Contrast check on the landing page, not only the static pages.
   - No horizontal overflow at 375 px width.
   - Respect `prefers-reduced-motion`: disable lenis and reveal animations.
   - Check the licence of every image in `web/public/img/` against `LICENSE.txt` and `credits.html`.
7. **Reconcile docs with the code.** Read the eight untracked docs and fix claims that no longer match. `rules.md` is not listed in the README docs table (lines 75-85).
8. **Geist findings.** Leave them standing. Geist is an intentional design choice. Do not add `ignore-file` or `ignore-rule` without your explicit approval.

### P2: housekeeping

9. In `App.tsx`, declare `mp` before `send` so the order reads top-down.
10. Commit in four chunks:
    1. agent list-models (code and tests)
    2. web landing page and motion
    3. static pages
    4. docs

## 4. Order of work

1. Get your answers to the decisions below.
2. Item 4 (contrast), since it is a two-line change.
3. Items 1 and 2 (dependencies and scripts).
4. Item 3 (tests), then run the full suite.
5. Items 5 and 6 (bundle, accessibility), then rebuild and re-run the suite.
6. Item 7 (docs).
7. Item 9, then the commits in item 10.

After each step, run tsc, vitest, pytest and ruff, and report what passed.

## 5. Decisions needed from you

- Keep `lenis`.
- Remove `playwright` and delete `web/scripts/`.
- Apply P0 and P1.
- Add a FINAL_CHECK_PLAN.md row to the README docs table.

## 6. Risks

- **Scroll feel:** removing or changing lenis changes how the landing page scrolls. Check it by hand.
- **Flash on lazy load:** code-splitting highlight.js can show unstyled code for a moment. Add a placeholder if it does.
- **Provider keys:** keys are stored in plaintext in `agent/data/providers.json` (mode 0600, gitignored). This is only safe because docker compose binds to 127.0.0.1 and there is no login. Do not expose the API on a public interface.
- **Not yet read:** the eight untracked docs were not read during the scan. Item 7 may turn up more.
