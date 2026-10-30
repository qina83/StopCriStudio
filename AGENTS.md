# AGENTS.md — Stop Cri Studio

Vendor-neutral entry point for any AI agent or developer working in this repository. Read this
file first; the detailed harness lives in `.project/`.

## What this project is

Stop Cri Studio is a **browser-only OpenAPI authoring workspace** ("Offline OpenAPI Workspace").
Users create, load or import an OpenAPI specification, edit it visually (API information, paths,
operations, path/query parameters, request body, responses, security, schemas), and export it as
YAML. There is **no backend and no network I/O**: every specification is persisted in
`localStorage` through `src/services/storageService.ts`.

Stack: React 19 + TypeScript 5.9 (strict) + Vite 5, Tailwind CSS 3.4 with CSS-variable design
tokens, `js-yaml` 4 for YAML, Playwright 1.59 for end-to-end tests, ESLint 9 flat config, pnpm.
Details: `.project/docs/STACK.md`.

## Repository map

```
src/main.tsx                     app bootstrap (imports src/styles/globals.css)
src/App.tsx                      welcome screen: create / load saved / import file, import-error modal
src/types/index.ts               ALL domain types (spec, paths, query params, request body, security)
src/services/storageService.ts   the only localStorage gateway (index + per-spec keys)
src/hooks/useSpecification.ts    state + intent-named mutators + 1 s debounced autosave
src/utils/openAPILoader.ts       YAML/JSON parse, validation, OpenAPI → internal `_`-fields
src/utils/exportService.ts       internal → valid OpenAPI YAML (guideline normalisation)
src/utils/pathParameterUtils.ts  path placeholder parsing/validation/sync
src/utils/schemaUtils.ts         schema ↔ property-tree, $ref build/rename
src/components/ui/               design-system primitives barrel (AppButton, ModalShell, …)
src/components/<Panel>/          editor panels: InfoPanel, PathsPanel, QueryParameters,
                                 RequestBody, Responses, SchemasPanel, Security, Sidebar,
                                 SpecificationForm, SpecificationEditor, LoadSpecificationModal
src/styles/globals.css           CSS variables consumed by tailwind.config.js
e2e/*.spec.ts                    Playwright suite (Chromium) + e2e/helpers/editor.ts
e2e/screenshots.spec.ts          regenerates docs/screenshots/*.png (serial, not a gate)
UserStories/                     requirement material referenced as WP-xxx in code comments
.github/agents/                  existing agent definitions
```

## Commands

```bash
pnpm install --frozen-lockfile   # reproducible install
pnpm dev                         # Vite dev server on http://127.0.0.1:5173
pnpm type-check                  # tsc --noEmit (strict, noUnusedLocals/Parameters)
pnpm lint                        # eslint src --ext ts,tsx
pnpm build                       # tsc && vite build
pnpm test:e2e                    # Playwright; starts the dev server itself
pnpm test:e2e --grep-invert "capture all manual screenshots"   # behavioural suite only
pnpm exec playwright install chromium                          # one-time, no script defined
```

Full command and configuration reference: `.project/docs/STACK.md`.

## Harness

| Path | Contents |
| --- | --- |
| `.project/docs/CONSTITUTION.md` | purpose, domain, constraints C1–C9, evolution criteria |
| `.project/docs/STACK.md` | technologies, configs, commands, operational gaps |
| `.project/docs/PRINCIPLES.md` | layering, naming, state, error handling, UI, tests |
| `.project/adr/` | architecture decisions (marked `documented` or `inferred`) |
| `.project/gates/` | blocking verification gates and their exact commands |
| `.project/workflows/` | agent instructions: `new-feature`, `review` |

## Skills (task-scoped)

Skills are **task-scoped**, not role descriptions. Load the one that matches the task before
editing code; each has focused, repository-specific instructions:

- `openapi-round-trip` — any change to an OpenAPI construct that must survive import + export
  (the internal `_queryParams` / `_requestBody` / `_security` representation).
- `specification-state-mutation` — new mutation paths in `useSpecification` / persistence rules.
- `editor-panel-ui` — new or modified editor panels, modals, forms, empty states, tokens and
  accessible names.
- `playwright-e2e-spec` — writing/extending `e2e/**`, helpers, and repairing tests after UI copy
  changes.

If your environment supports automatic skill discovery, the skills under `.agents/skills/` are
available and will activate on the described triggers. If not, read
`.agents/skills/<name>/SKILL.md` directly before starting the task. A generated index of the
skills may be appended to this file — treat that index as the authoritative list.

Workflows: for implementation use the instructions in `.project/workflows/new-feature.md`; for
reviewing a diff use `.project/workflows/review.md`.

## Non-negotiables (summary — see CONSTITUTION for the full text)

1. **Offline, client-only.** No backend, `fetch`, analytics or remote assets. Runtime dependencies
   stay `react`, `react-dom`, `js-yaml`; anything else needs an ADR.
2. **One persistence boundary.** `localStorage` is touched only in
   `src/services/storageService.ts`, with keys `stopCriStudio_specifications` (index) and
   `stopCriStudio_specifications_<id>` (documents). Changing keys requires a read migration.
3. **Export is valid OpenAPI.** Every internal `_`-prefixed key is deleted on export; every
   operation keeps a non-empty `operationId`, `tags` and `responses`.
4. **Round-trip symmetry.** A field the editor produces must be importable and exportable. Never
   implement one direction only.
5. **Accessible names are API.** Playwright locates by role, label, placeholder and visible text
   (`Create a new OpenAPI specification`, `Back to welcome`, `Export YAML`, `Specification Name`,
   `.fixed.inset-0` modal stacking). Renaming them without updating `e2e/**` is a breaking change.
6. **Strict TypeScript.** No new `any` outside the OpenAPI boundary converters; all files use the
   classic JSX runtime, so `import React` is required in `.tsx` files.
7. **Immutable state.** Mutations go through `useSpecification` with the functional
   `updateSpecification((spec) => ...)` form, clone before `delete`, and bump `updatedAt`.

## Gates (run before proposing any change)

```bash
pnpm install --frozen-lockfile
pnpm type-check
pnpm lint
pnpm build
pnpm test:e2e --grep-invert "capture all manual screenshots"
```

Plus `CI=1 pnpm test:e2e` when you touched `e2e/`, and the full `pnpm test:e2e` when UI copy or
layout changed (it regenerates `docs/screenshots/`). Gate definitions: `.project/gates/`.

Report the gates you ran and their outcome in your hand-off, together with the `WP-xxx` id and the
files touched per layer (types → utils → hook/service → components → e2e).

## Known gaps

- No unit-test runner: `src/utils/*` is covered only through the UI.
- `lint` and `type-check` cover `src` only — review `e2e/**` and config files manually.
- No CI workflow, formatter or Node/pnpm pin in this snapshot.
- Composition schemas (`oneOf`/`anyOf`/`allOf`) and non-object top-level schemas are intentionally
  read-only in the visual editor; preserve them rather than dropping them.

## Project Skills

Load the skill matching the task before working. If the agent runtime does
not discover skills automatically, read the linked `SKILL.md` directly.

- [openapi-round-trip](.agents/skills/openapi-round-trip/SKILL.md): Load when adding, changing or debugging any OpenAPI construct that must survive import and export (query parameters, request bodies, security, responses, path parameters, schemas, new fields). Covers the internal `_`-prefixed representation and the transforms in src/utils/openAPILoader.ts and src/utils/exportService.ts.
- [playwright-e2e-spec](.agents/skills/playwright-e2e-spec/SKILL.md): Load when writing, extending or fixing Playwright tests under e2e/, adding helpers to e2e/helpers/, or when a change to UI copy, labels or modal structure may break the suite. Covers state reset, locator conventions and the screenshot job.
- [specification-state-mutation](.agents/skills/specification-state-mutation/SKILL.md): Load when adding a new editable concern to the specification state (a new mutation path on src/hooks/useSpecification.ts, autosave/immediate-save behaviour, or persistence through src/services/storageService.ts), including cases where the change must be saved before navigation.
- [editor-panel-ui](.agents/skills/editor-panel-ui/SKILL.md): Load when creating or modifying editor UI in src/components (panels under PathsPanel, QueryParameters, RequestBody, Responses, SchemasPanel, Security, InfoPanel, Sidebar, SpecificationForm) or when a new modal, form, list or empty state is needed. Covers the ui primitive layer, Tailwind semantic tokens and the accessible-name contract.
