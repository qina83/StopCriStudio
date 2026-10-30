# Stop Cri Studio — Project Constitution

Operational charter for anyone (human or agent) changing this repository. Every rule below is
grounded in files that exist today; where the repository is silent, the gap is called out.

## 1. Purpose

Stop Cri Studio is a **browser-only OpenAPI authoring workspace** (self-described in
`src/App.tsx` as "Offline OpenAPI Workspace"). It lets a single user:

1. create a new OpenAPI specification from a minimal template (`createNewSpecification` in
   `src/services/storageService.ts`),
2. load a previously saved specification from browser storage
   (`src/components/LoadSpecificationModal.tsx`),
3. import an existing OpenAPI `.yaml` / `.yml` / `.json` file (`src/utils/openAPILoader.ts`),
4. edit *API Information*, *Paths* (operations, path parameters, query parameters, request body,
   responses, security requirements) and *Schemas* in a visual editor
   (`src/components/SpecificationEditor/`, `src/hooks/useSpecification.ts`),
5. export the result as YAML (`exportSpecificationAsYAML` in `src/utils/exportService.ts`).

Work is organised in **work packages** identified by `WP-xxx` ids. Those ids appear in source
headers and inline comments (e.g. `WP-006` path parameters, `WP-020` query parameters, `WP-026`
request body, `WP-032` security, `WP-046` responses) and map to the requirement material in
`UserStories/`. Code comments are the traceability link between requirement and implementation:
keep them accurate when you touch a feature.

## 2. Domain vocabulary

| Term | Meaning in this codebase |
| --- | --- |
| Specification | `OpenAPISpecification` (`src/types/index.ts`): metadata (`id`, `name`, `specVersion`, `createdAt`, `updatedAt`) + `content` holding the OpenAPI document as `Record<string, unknown>`. |
| Spec version | `specVersion`: the **API** version shown in the UI (`info.version`), e.g. `2.3.4`. Not the OpenAPI version. |
| OpenAPI version | `openAPIVersion`: typed as the literal `'3.0.0'`. Imports accept `3.0.x`/`3.1.x` but the internal model is pinned to 3.0.0. |
| Operation | An HTTP method object under a path (`get`, `post`, …) typed as `PathOperation`. |
| Internal fields | Keys prefixed with `_` (`_queryParams`, `_requestBody`, `_security`) that exist **only** inside `content` while editing. |
| Panel | A right-hand editor surface for one concern: InfoPanel, PathsPanel, SchemasPanel, QueryParameters, RequestBody, Responses, Security. |

## 3. Fundamental constraints (non-negotiable)

- **C1 — Offline, client-only.** No backend, no network requests, no telemetry, no remote
  fonts/APIs in runtime code. Persistence is `localStorage` only. Adding `fetch`, `axios`, a
  server, a remote schema registry or a cloud sync path is an architecture change, not a feature.
- **C2 — One persistence boundary.** All reads/writes go through `src/services/storageService.ts`.
  Components and hooks must not call `localStorage` directly (only `e2e/*` fixtures may).
- **C3 — Export must be a valid OpenAPI document.** `transformForExport` guarantees, per
  operation: non-empty `operationId`, trimmed `summary`/`description`, a non-empty `tags` array,
  a non-empty `responses` object, and removal of every internal `_`-prefixed key
  (`_queryParams`, `_requestBody`, `_security`, path-level `parameters`). Do not weaken this.
- **C4 — Every persisted/exported feature round-trips.** A field the editor can produce must be
  importable (`src/utils/openAPILoader.ts`) *and* exportable (`src/utils/exportService.ts`).
  Asymmetric changes are bugs.
- **C5 — Stable accessible contract.** The Playwright suite locates UI by role, label, placeholder
  and visible text (`article`/`button` names such as `Create a new OpenAPI specification`,
  `Load a previously saved specification`, `Load an existing OpenAPI specification file`,
  `Back to welcome`, `Export YAML`, labels like `Specification Name`, `Edit query parameter`).
  These strings are a public contract: renaming them is a breaking change and requires updating
  `e2e/**` in the same change.
- **C6 — Storage key is a contract.** Metadata lives under `stopCriStudio_specifications`, each
  document under `stopCriStudio_specifications_<id>` (see `storageService.ts` and
  `e2e/helpers/editor.ts`). Renaming or restructuring keys requires a migration read path; the
  E2E suite resets state by deleting exactly these keys.
- **C7 — Dependency minimalism.** Runtime dependencies are `react`, `react-dom`, `js-yaml` only.
  Introducing a state manager, router, form library, UI kit or HTTP client is a decision that
  needs an ADR, not a convenience import.
- **C8 — Type safety is enforced.** `tsc --noEmit` runs with `strict`, `noUnusedLocals`,
  `noUnusedParameters`, `noImplicitReturns`. Unused or implicitly-`any` code must not be merged
  (legacy `any` appears inside the import/export converters; do not spread it into new code).
- **C9 — English in the product.** User-facing copy, identifiers, comments and e2e selectors are
  English.

## 4. Quality bar

A change is only "done" when `pnpm type-check`, `pnpm lint`, `pnpm build` and `pnpm test:e2e`
pass (see `.project/gates/`). There is currently **no unit-test runner**: pure logic in
`src/utils/*` is covered only indirectly by the Playwright specs, so any new pure function must
either gain an e2e assertion or be flagged in review as untested. There is also **no linter
coverage for `e2e/`** (`lint` script targets `src` only) and **no CI workflow** in the repository
snapshot — treat the gate list as locally mandatory.

## 5. Criteria guiding evolution

1. **New OpenAPI field or concept** → model it in `src/types/index.ts`, implement the import
   mapping in `openAPILoader.ts`, the export mapping in `exportService.ts`, a pure helper in
   `src/utils/`, a hook mutator in `src/hooks/useSpecification.ts`, a panel/component under
   `src/components/`, and an e2e spec under `e2e/`.
2. **Ordering matters**: types → utils → hook/service → components → e2e. Do not start from the
   component.
3. **Preserve round-trip fidelity over editor convenience**: when the OpenAPI construct cannot be
   represented visually, keep the raw value in `content` and render it read-only instead of
   dropping it (the existing precedent is `parseEditableObjectSchema` returning
   `{ editable: false, reason }` for `oneOf`/`anyOf`/`allOf` and for non-object top-level schema).
4. **UI consistency before novelty**: reuse the primitives in `src/components/ui` and the design
   tokens declared in `tailwind.config.js` rather than inventing new visual vocabulary.
5. **No silent data loss on import.** Unsupported constructs are surfaced to the user
   (`ValidationError[]`, the error `ModalShell` in `App.tsx`), never swallowed.
6. **Decisions get recorded.** Any change to constraints C1–C9 requires a new ADR in
   `.project/adr/`; inferred behaviour that turns out different must be corrected there.
