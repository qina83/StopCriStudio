# ADR-0004: Single `useSpecification` hook owns state, mutations and debounced autosave

- **Status**: inferred
- **Date**: 2026-10-30

## Context

Dozens of panels edit one specification object and every edit must be persisted without an explicit "save" action. Passing setters through many components would couple UI to the document shape.

## Decision

`src/hooks/useSpecification.ts` holds the specification in `useState`, exposes intent-named mutators (`updateInfo`, `addPath`, `addOperation`, `deleteOperation`, `deletePath`, `updatePathParameters`, `updatePathParameter`, …), and autosaves through `saveSpecification` 1000 ms after the last change when `isDirty`. A second mutator, `updateSpecificationAndSave`, persists synchronously for flows that require it. Components never touch `localStorage` and never construct `content` from scratch.

## Consequences

New editable concepts require a new mutator in this hook (functional `setSpecification`, immutable spread, `updatedAt: Date.now()`), not ad-hoc component state. Autosave means there is no undo/confirmation for ordinary edits; destructive actions therefore need `ConfirmDialog`. Storage errors surface as `storageError` rather than throwing.

## Evidence

src/hooks/useSpecification.ts (AUTOSAVE_DELAY = 1000, isDirty/isSaving/storageError, updateSpecificationAndSave comment "WP-019"), src/components/LoadSpecificationModal.tsx (ConfirmDialog for deletion), src/services/storageService.ts.
