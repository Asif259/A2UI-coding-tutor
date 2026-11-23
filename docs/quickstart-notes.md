# Milestone 1: official quickstart notes

The A2UI quickstart is the **Travel A2UI** sample in `a2ui-project/labs`
(`samples/travel-a2ui`). Run on macOS, Python 3.13, Node 24, npm 11:

```bash
git clone https://github.com/a2ui-project/labs
cd labs/samples/travel-a2ui
./scripts/quickstart.sh react
```

What happened:

| Step | Result |
| --- | --- |
| Python server (`a2ui-agent-sdk 0.10.0`, `a2ui-core 0.5.0`) | installed, boots on :8080 |
| `npm ci` | **fails**: lockfile is missing `@esbuild/*@0.28.2` entries (npm 11) |
| `npm install` + `vite build` | **fails**: vite 8 needs `rolldown` and `lightningcss`, npm skipped them |
| `npm i --no-save rolldown@~1.2.4 lightningcss` then build | works, `GET /` returns 200 |

Takeaways applied here:

- Pin **Vite 6** in `web/` to avoid the vite 8 / rolldown optional-dependency problem.
- Use `npm install` and commit our own lockfile.
- The sample shows the architecture we reuse: a JSON catalog is the single source of
  truth, the Python SDK (`A2uiRequestProcessor`) builds the prompt and validates model
  output against it, and `@a2ui/web_core` `MessageProcessor` + `@a2ui/react`
  `A2uiSurface` render it. Custom React views are bound with
  `createComponentImplementation`. Actions return as `{version: "1.0", action}`.
