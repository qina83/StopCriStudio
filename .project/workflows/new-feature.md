# Agent instruction — implementing a new feature

Follow this sequence. It encodes the layering of this repository; skipping a step is how
round-trip bugs and broken E2E selectors get introduced.

## 0. Before writing code

1. Read `.project/docs/CONSTITUTION.md` (constraints C1–C9) and
   `.project/docs/PRINCIPLES.md`.
2. Find the requirement id. Source files cite `WP-xxx` ids; the requirement text lives in
   `UserStories/`. If the feature has no id, invent one and cite it in the new code header
   (`Implements WP-0NN: <title>`), matching existing headers such as
   `LoadSpecificationModal.tsx`.
3. Decide which of the two feature classes you are in:
   - **Specification data feature** (something that ends up inside the OpenAPI document):
     it must round-trip. Continue with all steps below.
   - **UI/behaviour-only feature** (navigation, layout, filtering, wording): no import/export
     changes, but step 5 (accessible names) and step 6 (e2e) still apply.

## 1. Types first — `src/types/index.ts`

- Add or extend the domain type next to its peers (query parameters, body parameters, security
  schemes each already have a section).
- Model variants as a discriminated union (`type` field) and put shared fields in a `*Base`
  interface, exactly like `Scalar/Object/ArrayQueryParameter` and `BodyParameter`.
- Use `: 'literal'` types for closed sets; add a `const` array (`BODY_ELIGIBLE_METHODS`,
  `MEDIA_TYPE_OPTIONS`) when the set is also needed at runtime.
- Never widen `OpenAPIVersion` (currently `'3.0.0'`).

## 2. Import — `src/utils/openAPILoader.ts`

- Write a `import<Thing>(content)` function that deep-clones with
  `JSON.parse(JSON.stringify(content))`, walks `content.paths[*][method]`, fills the internal
  `_`-prefixed key, and deletes the raw key it replaced.
- Reuse the existing converters (`openAPISchemaToQueryParam`, `openAPISchemaToBodyParam`) instead
  of writing another schema walker; extend them if the new construct needs a new node kind.
- Update `validateOpenAPIContent` only if the construct affects validity; validation errors use
  `{ field, message }` and are English.
- Remember `openAPILoader.ts` already composes `importSecurity(importRequestBody(importQueryParameters(spec)))`
  — add your transform to that chain.
- Leave unsupported constructs untouched in `content` (do not delete something you cannot model).

## 3. Export — `src/utils/exportService.ts`

- Extend `transformForExport` (or a helper it calls, like `buildRequestBodyExport`,
  `queryParamToOpenAPI`, `buildSecuritySchemesExport`).
- **Emit OpenAPI only; strip internals.** Every `_`-prefixed key must be deleted on every path,
  including the new one.
- Continue producing guideline-compliant operations: keep the `operationId`, `tags`, `responses`
  normalisation intact and do not reorder it before your transform if it depends on cleaned values.
- Keep optional output only when meaningful: spread conditionally
  (`...(description ? { description } : {})`), never emit `undefined` or empty strings.
- If your feature produces `$ref`s, reuse `buildSchemaRef` / `getSchemaNameFromRef` from
  `schemaUtils.ts` so rename-tracking keeps working.

## 4. Pure helpers — `src/utils/*Utils.ts`

- Put any non-trivial computation (validation, naming, sync, tree building) into a pure function in
  the matching `*Utils.ts` file, returning a result object rather than throwing
  (`{ valid, error }`, `{ editable, properties, reason }`).
- Mirror the existing style: explicit input types from `src/types`, `Set`/`Map` for lookups,
  early returns for guard clauses, JSDoc block describing the rules.
- Reuse before adding: `extractParameterNames`, `syncParametersWithPath`, `isValidSchemaName`,
  `buildObjectSchemaFromProperties` already exist.

## 5. State — `src/hooks/useSpecification.ts`

- Add an intent-named mutator (`addX`, `updateX`, `deleteX`) using the functional form:
  ```ts
  updateSpecification((spec) => ({ ...spec, content: { ...spec.content, ... }, updatedAt: Date.now() }))
  ```
  and wrap it in `useCallback` with the correct dependencies. Return it from the hook.
- Never mutate nested objects; clone before `delete`.
- Use `updateSpecificationAndSave` only if the flow cannot tolerate the 1 s autosave delay, and
  leave a comment explaining why (see the WP-019 precedent).
- Bump `updatedAt` on every semantic change; never touch `createdAt`.

## 6. UI — `src/components/<Panel>/`

- Place the component in the panel folder that owns the concern; create a new folder only for a
  genuinely new editor surface, and wire it into `SpecificationEditor` and the `Sidebar` if it
  must be reachable.
- Build from `src/components/ui` primitives (`AppButton`, `Badge`, `ModalShell`, `ConfirmDialog`,
  `EmptyState`, icons) and Tailwind semantic tokens (`bg-surface-base`, `text-text-secondary`,
  `border-border-default`, `shadow-panel`). Do not add raw palette classes or inline styles.
- **Accessible names are contract** (CONSTITUTION C5). Every new button/input needs a stable role +
  name; icon-only buttons need `aria-label`; modals must keep the `ModalShell` structure so
  `.fixed.inset-0` + `.last()` keeps working in tests.
- Destructive actions require `ConfirmDialog` with the confirm label `Delete`.
- Show empty and non-editable states (`EmptyState`, or the `reason` from `ParsedSchema`) instead of
  rendering an empty editor.
- All copy in English, short, action-oriented.

## 7. E2E — `e2e/<concern>.spec.ts`

- Add or extend a spec named after the concern (`app`, `operations`, `query-parameters`,
  `request-body`, `responses`, `security`, or a new file for a new concern).
- Always start with `test.beforeEach(async ({ page }) => resetAppState(page))` from
  `e2e/helpers/editor.ts`.
- Add reusable flows to `e2e/helpers/editor.ts` (signature `(page, ...)`, `Promise<void>`, assert
  postconditions) rather than copy-pasting steps.
- Use role/label/placeholder locators; assert persistence with `expect.poll` over `localStorage`
  (see the autosave test in `app.spec.ts`), not with `waitForTimeout`.
- Cover the feature in both directions when it is spec data: author it in the UI, export/inspect,
  and re-import (or assert the internal shape) so the round-trip is proven.
- If the UI flow changed visibly, also run the full `pnpm test:e2e` so `docs/screenshots/` is
  regenerated.

## 8. Gates (must all pass before you propose the change)

```
pnpm install --frozen-lockfile
pnpm type-check
pnpm lint
pnpm build
pnpm test:e2e --grep-invert "capture all manual screenshots"
```

See `.project/gates/`. If you touched `e2e/`, also run `CI=1 pnpm test:e2e`.

## 9. Report

In your hand-off summary state: requirement id, files touched per layer
(types → utils → hook → components → e2e), which gates you ran and their result, any OpenAPI
construct you now preserve but cannot edit, and any dependency you wanted but did not add.

## Do not

- add a network call, backend, analytics, router, state library or HTTP client (C1, C7);
- call `localStorage` outside `src/services/storageService.ts` (C2);
- persist or export `_`-prefixed internal keys (C3);
- rename user-visible copy or `aria-label`s without updating `e2e/**` in the same change (C5);
- change storage keys without a read-migration path (C6);
- implement only one direction (import without export or vice versa) (C4);
- use `any` in new component code (C8).
