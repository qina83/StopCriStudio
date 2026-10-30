# Development Principles & Conventions

Derived from the code as it exists today. Follow the precedent; where the code is inconsistent,
the rule states which side to prefer.

## 1. Layering (respect the direction of dependencies)

```
types (src/types/index.ts)
  ↑
utils (src/utils/*)          services (src/services/storageService.ts)
  ↑                              ↑
hooks (src/hooks/useSpecification.ts)
  ↑
components (src/components/**)  →  ui primitives (src/components/ui)
  ↑
App.tsx / main.tsx
```

- **`src/types/index.ts` is the single source of domain types.** No component-local interfaces for
  domain objects; component-only prop interfaces stay in the component file
  (`LoadSpecificationModalProps`).
- **`src/utils/*` holds pure, framework-free logic**: parsing (`openAPILoader.ts`), serialisation
  (`exportService.ts`), path-parameter helpers (`pathParameterUtils.ts`), schema helpers
  (`schemaUtils.ts`). Utils must not import React and must not touch `localStorage` (the one
  exception is the browser-specific `exportService` download, which uses `Blob`/`URL`/`document`).
- **`src/services/storageService.ts` is the only persistence gateway.** It catches its own errors
  and `console.error`s them; a failed write must never throw into the render path.
- **State mutation lives in `src/hooks/useSpecification.ts`.** Components read the returned
  `specification` and call the exposed mutators; they never rebuild `content` themselves.
- **`src/components/ui` is the design-system barrel** (`AppButton`, `Badge`, `ModalShell`,
  `ConfirmDialog`, `EmptyState`, icons, …). Import from `./ui` / `../components/ui`, never from a
  concrete file path inside `ui/`.

## 2. Naming & file layout

- One component per file, `PascalCase.tsx`, named export that matches the file
  (`export function LoadSpecificationModal`). `App.tsx` additionally has `export default App`.
- Feature folders mirror the editor panels: `src/components/PathsPanel/`, `QueryParameters/`,
  `RequestBody/`, `Responses/`, `SchemasPanel/`, `Security/`, `Sidebar/`, `InfoPanel/`,
  `SpecificationForm/`, `SpecificationEditor/`.
- Hooks are `use*.ts` in `src/hooks/` (`useSpecification.ts`).
- Plain functions `camelCase`; constants `UPPER_SNAKE_CASE` (`STORAGE_KEY`, `AUTOSAVE_DELAY`,
  `MEDIA_TYPE_OPTIONS`, `BODY_ELIGIBLE_METHODS`, `HTTP_METHODS`).
- Utilities follow verb-first names (`syncParametersWithPath`, `buildObjectSchemaFromProperties`,
  `renameSchemaRefsInRequestBodies`) and predicates start with `is`/`find`/`validate`.
- File-header JSDoc blocks state purpose and cite the `WP-xxx` ids they implement. Preserve and
  extend this pattern; it is the requirement traceability mechanism.

## 3. State & immutability

- All updates are **immutable**: `updateSpecification((spec) => ({ ...spec, content: { ... },
  updatedAt: Date.now() }))`. Never mutate the existing object graph; when you need to drop a key,
  clone (`const next = { ...obj }; delete next[key]`).
- Deep copies for whole-document transforms use
  `JSON.parse(JSON.stringify(content))` (see `transformForExport`, `importRequestBody`). Keep that
  idiom for consistency — the payloads are JSON-only by definition (YAML is parsed into plain
  JSON-compatible values).
- `updatedAt` is bumped on every semantic change; `createdAt` never changes.
- Autosave is debounced by `AUTOSAVE_DELAY = 1000` ms and only runs when `isDirty`.
  `updateSpecificationAndSave` is the escape hatch for flows that must persist immediately
  (used by query-parameter edits, `WP-019`); use it sparingly and comment why.
- Handlers are wrapped in `useCallback` with explicit dependency arrays; expose a stable,
  flat object from the hook (no nested state objects).

## 4. Error handling

- Boundary code returns a **result object**, not exceptions:
  `LoadResult { success, spec?, errors?: ValidationError[] }` with `field` + `message`
  (`src/utils/openAPILoader.ts`).
- User-visible failures go through component state and render inside `ModalShell`
  (`loadError` / `loadErrorDetails` in `App.tsx`) with an actionable message and a next step
  ("Try Another File"). Never leave a `window.alert` or a silent no-op.
- Storage failures are caught inside `storageService`; the hook additionally maps failures to
  `storageError` ("Storage quota exceeded. Some changes may not be saved.").
- Unsupported constructs must degrade explicitly, not silently: `parseEditableObjectSchema`
  returns `{ editable: false, properties: [], reason }` and the UI shows the reason.

## 5. TypeScript conventions

- Prefer discriminated unions over `any`: `QueryParameter = ScalarQueryParameter |
  ObjectQueryParameter | ArrayQueryParameter`, `BodyParameter`, `SecurityScheme`. Narrow with
  `param.type === 'object'` then cast to the specific interface.
- Legacy `any`/`Record<string, any>` is tolerated *only* inside the OpenAPI boundary converters
  (`openAPILoader.ts`, `exportService.ts`, parts of `useSpecification.ts`, `schemaUtils.ts`),
  because external documents are untyped. New component code must be fully typed.
- Public function signatures get explicit return types; helpers may rely on inference.
- Optional values are expressed with `?:` and always guarded before spreading
  (`...(description ? { description } : {})`) — this keeps exported YAML free of `undefined`
  keys.
- Casts to literal unions need a comment when the source is unvalidated
  (`openAPIVersion as '3.0.0'` in `openAPILoader.ts`).

## 6. UI conventions

- Compose with `src/components/ui` primitives and semantic Tailwind tokens
  (`bg-surface-base`, `text-text-secondary`, `border-border-default`, `shadow-panel`,
  `rounded-xl`, `focus-ring`). Raw palette utilities exist in `App.tsx` and the load modal
  (`bg-sky-50`, `text-emerald-700`, `bg-red-50`); do not introduce new ones — prefer tokens.
- Interactive elements need an accessible name: cards use `aria-label`, modal actions use literal
  visible text (`Create Path`, `Save Schema`, `Delete Operation`, `Export YAML`), icon buttons use
  `aria-label` (`Close path editor`, `Edit query parameter`, `Delete query parameter`,
  `Expand response structure`).
- Modals: `ModalShell` with `open`/`title`/`description`/`size`/`onClose`/`footer`; destructive
  actions go through `ConfirmDialog` with label `Delete`.
- Empty states use `EmptyState` with an icon, a title and a next-step description
  ("No saved specifications yet", "No query parameters defined").
- Text is English, short, and action-oriented; status feedback is a sentence with a trailing
  period ("Schema saved successfully.").

## 7. Tests

- Verification is **end-to-end only** (Playwright, Chromium). A feature is not complete without an
  e2e spec unless it is purely internal.
- Each spec resets state via `resetAppState(page)` from `e2e/helpers/editor.ts` — never rely on
  leftover `localStorage`.
- Flow helpers (`createPath`, `addOperation`) belong in `e2e/helpers/`; new ones take
  `page` first, return `Promise<void>`, and assert their own postconditions with `expect`.
- Prefer role/label/placeholder locators over CSS. CSS is used only for modal stacking
  (`.fixed.inset-0` + `.last()`) and file inputs (`input[type="file"]`).
- One spec file per concern: `app`, `operations`, `query-parameters`, `request-body`, `responses`,
  `security`, plus `screenshots` for documentation assets.
- Use `expect.poll` for storage assertions (see `app.spec.ts` autosave test) instead of fixed
  sleeps; `waitForTimeout` only appears in the screenshot job.

## 8. Dependencies & scope

- Add a runtime dependency only with an ADR. `js-yaml` is the existing precedent (YAML parsing is
  in scope; a hand-rolled parser is not).
- Do not add a backend, network call, analytics or file-system access; the product promise is
  offline + local.
- Keep the OpenAPI surface honest: if the editor cannot edit a construct, preserve it and say so —
  never truncate the user's document.
