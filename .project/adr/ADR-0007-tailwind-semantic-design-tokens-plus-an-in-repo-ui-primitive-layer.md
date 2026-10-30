# ADR-0007: Tailwind semantic design tokens plus an in-repo `ui` primitive layer

- **Status**: inferred
- **Date**: 2026-10-30

## Context

The UI needs a consistent, themeable look across ten-plus panels without introducing a component library (runtime dependencies are limited to react/react-dom/js-yaml).

## Decision

Styling is Tailwind CSS configured with semantic tokens mapped to CSS custom properties (`--color-surface-base`, `--color-text-primary`, `--color-action-primary`, `--color-state-error`, `--color-sidebar-*`, `--radius-*`, `--shadow-panel|raised|modal`) plus a small in-repo primitive layer in `src/components/ui` (AppButton, Badge, ModalShell, ConfirmDialog, EmptyState, icons) exported through a barrel file.

## Consequences

New UI must use the primitives and token classes, not new palette utilities or inline styles; if a token is missing, add it to the CSS variable set and `tailwind.config.js` theme together. `ui/` is the only place allowed to encode variant logic (e.g. `AppButton variant="danger"`). The `ui-*` utility classes in `src/styles/globals.css` (`ui-panel-raised`, `ui-card-interactive`, `ui-status-banner`) are part of the same surface and should be extended rather than duplicated.

## Evidence

tailwind.config.js (theme.extend colors/radius/shadow referencing var(--color-*)), postcss.config.js, src/components/ui (barrel exports used by App.tsx and LoadSpecificationModal.tsx), src/styles/globals.css (imported by src/main.tsx).
