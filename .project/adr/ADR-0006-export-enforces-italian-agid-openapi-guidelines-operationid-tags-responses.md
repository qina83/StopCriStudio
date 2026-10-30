# ADR-0006: Export enforces Italian AgID OpenAPI guidelines (operationId, tags, responses)

- **Status**: documented
- **Date**: 2026-10-30

## Context

Specifications authored in the tool are consumed by Italian public-administration API tooling, which enforces rules that a generic OpenAPI editor does not: every operation needs an `operationId`, declared tags, and a non-empty `responses` object.

## Decision

Export normalises operations to satisfy the Italian (AgID) guidelines instead of requiring the user to do it: `generateOperationId(method, path)` produces deterministic ids (`GET /users/{id}` → `getUsersById`, `GET /` → `getRoot`), empty `summary`/`description` are dropped after trimming, `tags` defaults to `['non-empty']` when none survive cleaning, and a missing/empty `responses` falls back to `{ '200': { description: 'Successful response' } }`.

## Consequences

Exported YAML differs from the in-memory document by design; round-trip import of an exported file yields the normalised values, which is acceptable. Changes to `generateOperationId` alter the public identity of operations, so they must be treated as breaking. Any new guideline rule belongs in `transformForExport`, not in components.

## Evidence

src/utils/exportService.ts — comments "Italian Guidelines (operation-operationId)", "(operation-tag-defined)", "WP-046: Ensure each operation exports a valid responses object", and the generateOperationId/sanitizeIdentifier/capitalize helpers.
