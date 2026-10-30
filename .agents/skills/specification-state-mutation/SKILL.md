---
name: specification-state-mutation
description: "Load when adding a new editable concern to the specification state (a new mutation path on src/hooks/useSpecification.ts, autosave/immediate-save behaviour, or persistence through src/services/storageService.ts), including cases where the change must be saved before navigation."
---

# Mutating the specification safely

`src/hooks/useSpecification.ts` is the only place that writes specification state. Components read
`specification` and call intent-named mutators. Persistence goes through
`src/services/storageService.ts` (`saveSpecification`) with autosave debounced by
`AUTOSAVE_DELAY = 1000` ms while `isDirty`.

## Adding a mutator

```ts
const addAudience = useCallback((pathName: string, audience: string) => {
  updateSpecification((spec) => {
    const paths = (spec.content.paths as Record<string, any>) || {}
    const pathObj = paths[pathName] || {}
    const audiences = Array.isArray(pathObj['x-audiences']) ? pathObj['x-audiences'] : []
    return {
      ...spec,
      content: {
        ...spec.content,
        paths: { ...paths, [pathName]: { ...pathObj, 'x-audiences': [...audiences, audience] } },
      },
      updatedAt: Date.now(),
    }
  })
}, [updateSpecification])
```

Rules:

- functional form `updateSpecification((spec) => ...)`; never read `specification` from the closure
  for the new value (stale state under rapid edits);
- immutable spread all the way down; clone before `delete` (`const next = { ...obj }; delete next.k`);
- `updatedAt: Date.now()` on every semantic change, `createdAt` untouched;
- return the mutator from the hook and add it to the returned object;
- `useCallback` with the real dependency list (usually `[updateSpecification]`).

## Choosing between autosave and immediate save

- Default: `updateSpecification` → persisted ~1 s later, `isSaving`/`isDirty` reflect progress.
- `updateSpecificationAndSave` persists inside the updater. Use it only when the flow continues
  outside the app's reactivity (the query-parameter precedent, WP-019) and comment why.
- Both paths funnel into `saveSpecification`, which catches storage errors and `console.error`s
  them; the hook surfaces `storageError` ("Storage quota exceeded. Some changes may not be saved.")
  for the UI to render. Do not add a third save path.

## Storage rules (`src/services/storageService.ts`)

- Keys: index `stopCriStudio_specifications`, documents `stopCriStudio_specifications_<id>`.
  Never invent a new prefix; E2E reset logic depends on it.
- `saveSpecification` writes the document then upserts `SpecificationMetadata` (`id`, `name`,
  `specVersion`, `createdAt`, `updatedAt`, `description`) into the index.
- Reads tolerate corrupt JSON (`try/catch` → `[]` / `null`). Keep that tolerance.
- If you ever change the stored shape, add a read-compat path for documents written by older
  versions; there is no migration system today.

## Verifying

- `pnpm type-check` then `pnpm lint` (hook rules are enforced by `eslint-plugin-react-hooks`).
- Add an e2e assertion that the change persisted:
  ```ts
  await expect.poll(async () => page.evaluate((k) => {
    const items = JSON.parse(localStorage.getItem(k) || '[]') as Array<{ name: string }>
    return items.some(i => i.name === 'QA Studio API')
  }, 'stopCriStudio_specifications')).toBe(true)
  ```
  (pattern from `e2e/app.spec.ts`).
- Confirm reload behaviour: back to welcome → reopen the saved card → value still present.
