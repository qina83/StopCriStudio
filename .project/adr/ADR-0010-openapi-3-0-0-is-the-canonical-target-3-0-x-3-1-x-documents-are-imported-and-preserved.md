# ADR-0010: OpenAPI 3.0.0 is the canonical target; 3.0.x/3.1.x documents are imported and preserved

- **Status**: inferred
- **Date**: 2026-10-30

## Context

`src/types/index.ts` declares `export type OpenAPIVersion = '3.0.0'` with the comment "fixed at 3.0 for this editor", yet `validateOpenAPIContent` accepts `/^3\.(0|1)\.\d+$/` and derives `openAPIVersion` from the imported document before casting it to `'3.0.0'`.

## Decision

The editor's canonical target is OpenAPI 3.0.0: new documents are created with `openapi: '3.0.0'`, and the internal type is the literal `'3.0.0'`. Import accepts 3.0.x and 3.1.x documents and keeps the original `openapi` string inside `content`, so export does not silently downgrade an imported 3.1 document even though the typed metadata says 3.0.0.

## Consequences

The `openAPIVersion` cast is a known type-safety hole: any code that branches on `specification.openAPIVersion` to decide serialisation behaviour would be wrong for 3.1 documents — branch on `content.openapi` instead. Features that differ between 3.0 and 3.1 (e.g. `webhooks`, nullable/type arrays) are out of scope until this policy is settled explicitly.

## Evidence

src/types/index.ts (OpenAPIVersion, `openAPIVersion: OpenAPIVersion // Fixed at 3.0.0`), src/services/storageService.ts (createNewSpecification → openapi: '3.0.0'), src/utils/openAPILoader.ts (version regex, `openAPIVersion as '3.0.0'`), src/utils/exportService.ts (content cloned unchanged).
