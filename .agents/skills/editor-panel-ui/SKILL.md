---
name: editor-panel-ui
description: "Load when creating or modifying editor UI in src/components (panels under PathsPanel, QueryParameters, RequestBody, Responses, SchemasPanel, Security, InfoPanel, Sidebar, SpecificationForm) or when a new modal, form, list or empty state is needed. Covers the ui primitive layer, Tailwind semantic tokens and the accessible-name contract."
---

# Building editor UI that fits this project

## Placement

- New concern → new folder `src/components/<Concern>/<ConcernPanel>.tsx` following the existing
  panel folders; one component per file, `export function Name(...)`.
- Wire it into `src/components/SpecificationEditor/SpecificationEditor.tsx` and, if it is a new
  top-level surface, into the `Sidebar` navigation (`Paths`, `Schemas` buttons) so it is reachable —
  `e2e` navigates through those buttons.
- Prop interfaces stay local to the component file; domain types come from `src/types`.

## Primitives first

Import from the barrel (`import { AppButton, Badge, ModalShell, ConfirmDialog, EmptyState } from '../ui'`).
Available: `AppButton` (`variant` primary/secondary/ghost/danger, `size`, `leadingIcon`),
`Badge` (`variant="status"`, `tone`), `ModalShell` (`open`, `title`, `description`, `size`, `onClose`,
`footer`), `ConfirmDialog` (`open`, `title`, `description`, `confirmLabel`, `onConfirm`, `onCancel`),
`EmptyState` (`icon`, `title`, `description`), icons (`FolderIcon`, `TrashIcon`, `WarningIcon`,
`SparkleIcon`, `ImportIcon`, …). Reuse them; extend the primitive rather than re-implementing a
button or a dialog locally.

## Styling

- Use the semantic tokens from `tailwind.config.js`: `bg-app-bg`, `bg-surface-base|subtle|raised`,
  `border-border-default|strong`, `text-text-primary|secondary|muted`, `text-action-primary`,
  `bg-state-error-bg`/`text-state-error`, `sidebar-*`, `focus-ring`, `shadow-panel|raised|modal`,
  `rounded-sm|md|lg|xl`.
- Utility classes from `src/styles/globals.css` (`ui-panel-raised`, `ui-card-interactive`,
  `ui-status-banner`) are the preferred composites; add a new one there rather than repeating
  long class strings.
- Do not add raw palette classes (`bg-sky-50`, `text-red-700`) — a few legacy spots exist in
  `App.tsx`/`LoadSpecificationModal.tsx`; do not extend the pattern. No inline styles.

## Accessible-name contract

Playwright locates by role + name, so names are a public API:

- Interactive cards: `aria-label` describing the action ("Create a new OpenAPI specification").
- Actions: visible, literal text ("Create Path", "Save Schema", "Add Response", "Export YAML",
  "+ Add security", "Delete Operation").
- Icon-only controls: `aria-label` ("Close path editor", "Edit query parameter",
  "Delete query parameter", "Expand response structure", "Back to welcome").
- Inputs: real `<label>` association so `getByLabel('Specification Name')` works, or a
  `placeholder` used by tests (`/users`, `parameterName`, `propertyName`, `UserResponse`,
  `200 or default`, `Describe this response`, `Filter paths and schemas`).
- Keep the modal overlay structure (`fixed inset-0` container rendered by `ModalShell`) — tests use
  `.fixed.inset-0` + `.last()`.

## States to handle

- **Empty:** `EmptyState` with icon + title + next step ("No saved specifications yet",
  "No query parameters defined", "No security requirements defined for this operation.").
- **Non-editable:** when `ParsedSchema.editable === false`, render `reason` as read-only
  explanation, never an empty builder.
- **Error:** inline status banner (`.ui-status-banner`) inside a modal with an actionable
  next step, following the import-error modal in `App.tsx`.
- **Destructive:** `ConfirmDialog` with confirm label `Delete`; the dialog is rendered as a sibling
  of the modal so it stacks on top.

## After the UI change

- Copy in English, concise; success feedback is a sentence ("Schema saved successfully.").
- Run `pnpm lint` / `pnpm type-check`, then the affected spec:
  `pnpm test:e2e e2e/<concern>.spec.ts`. Add or update the e2e assertions when names changed
  (see the `playwright-e2e-spec` skill).
- If the layout changed visibly, run the full `pnpm test:e2e` to refresh `docs/screenshots/`.
