---
name: playwright-e2e-spec
description: "Load when writing, extending or fixing Playwright tests under e2e/, adding helpers to e2e/helpers/, or when a change to UI copy, labels or modal structure may break the suite. Covers state reset, locator conventions and the screenshot job."
---

# Writing Playwright specs for Stop Cri Studio

Verification in this repository is end-to-end only: `playwright.config.ts` runs Chromium against
`pnpm dev --host 127.0.0.1` on `http://127.0.0.1:5173`, fully parallel, with the server started
automatically (120 s timeout).

## Skeleton

```ts
import { expect, test } from '@playwright/test'
import { addOperation, createPath, resetAppState } from './helpers/editor'

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

test('does the new thing', async ({ page }) => { /* ... */ })
```

`resetAppState` navigates to `/`, deletes `stopCriStudio_specifications` and every
`stopCriStudio_specifications_*` key, then reloads. Never skip it: the app autosaves to
`localStorage` and state leaks between tests otherwise.

## File organisation

One file per concern: `e2e/app.spec.ts` (welcome, create/load/delete, import/export, paths+schemas,
filter), `operations.spec.ts`, `query-parameters.spec.ts`, `request-body.spec.ts`,
`responses.spec.ts`, `security.spec.ts`. Put reusable flows in `e2e/helpers/editor.ts`
(`resetAppState`, `createPath`, `addOperation`) — signature `(page: Page, ...): Promise<void>`,
asserting its own postconditions with `expect`.

## Locator conventions

- Role/label first: `getByRole('button', { name: 'Add Response' })`,
  `getByLabel('Specification Name')`, `getByPlaceholder('/users')`.
- Welcome cards: `getByRole('button', { name: 'Create a new OpenAPI specification' })`,
  `'Load a previously saved specification'`, `'Load an existing OpenAPI specification file'`.
- Modals are stacked portals: locate the topmost one with
  `page.locator('.fixed.inset-0').last()` and then query inside it.
- Buttons whose text varies use `filter({ hasText: /^Save$/ })` or `/^Add property$/`.
- File input: `page.locator('input[type="file"]').setInputFiles({ name, mimeType, buffer })`.
- Back navigation: `page.getByLabel('Back to welcome')`.
- Save/load assertions: `expect.poll(async () => page.evaluate(...))` over `localStorage` — never
  `waitForTimeout` (that only belongs to `screenshots.spec.ts`).

## Assertion style

Assert user-visible outcomes and persisted state, not implementation details:

```ts
await expect(page.getByText('Schema saved successfully.')).toBeVisible()
await expect(page.getByRole('heading', { name: SPEC_NAME })).toBeVisible()
```

For CRUD, cover the full cycle (create → edit → delete → empty state), as in
`query-parameters.spec.ts` (`'No query parameters defined'` after deletion).

## When UI copy changes

Any rename of a visible action, `aria-label`, placeholder or heading is a breaking change for the
suite. Update `e2e/**` in the same change and re-run
`pnpm test:e2e --grep-invert "capture all manual screenshots"`.

## Screenshot job

`e2e/screenshots.spec.ts` is serial (`test.describe.configure({ mode: 'serial' })`), sets a
1440×900 viewport, has a 180 s timeout and writes PNGs into `docs/screenshots/` (paths 01-welcome …
19-sidebar-filter). Run the full suite (`pnpm test:e2e`) when the layout changed so those assets
stay current; it is not a behavioural gate.

## Pitfalls

- `pnpm type-check` / `pnpm lint` do not cover `e2e/`; keep types explicit (`Page` from
  `@playwright/test`) and never commit `test.only` (CI sets `forbidOnly`).
- Tests are parallel: never depend on a previous test's storage or ordering (except the serial
  screenshot file).
- Import fixtures must be valid OpenAPI (`openapi`, `info.title`, `info.version`, `paths`), otherwise
  the validation modal appears instead of the editor.
