# ADR-0003: Internal editing model extends OpenAPI with underscore-prefixed transient fields

- **Status**: inferred
- **Date**: 2026-10-30

## Context

OpenAPI's `parameters` array mixes path and query parameters, `requestBody` is media-type keyed, and `security` is an array of requirement objects. The visual editor needs typed, per-concern collections (query parameters with nested objects/arrays, a single request body with a property tree, one security requirement per scheme) that map awkwardly onto the raw format.

## Decision

On import, split raw OpenAPI into internal keys: `operation._queryParams: QueryParameter[]`, `operation._requestBody: RequestBody`, `operation._security: OperationSecurityRequirement[]` (path-level `parameters` stays as the internal `PathParameter[]`). The editor and hook operate on those internal shapes. On export, `transformForExport` rebuilds standard OpenAPI (`parameters` merged path-first, `requestBody.content[mediaType].schema`, `security: [{ scheme: [] }]`, `components.securitySchemes`) and deletes every `_`-prefixed key.

## Consequences

The `content` object is *not* valid OpenAPI while editing, so never export or display it verbatim. Every new editor concern needs symmetric code in `openAPILoader.ts` and `exportService.ts`, and any leaked `_` key is a data-quality bug (users would get non-conformant YAML). Imported constructs the editor cannot represent must survive as untouched raw values.

## Evidence

src/utils/openAPILoader.ts (importQueryParameters, importRequestBody, importSecurity), src/utils/exportService.ts (transformForExport, `delete operation._queryParams`, `delete operation._requestBody`, `delete operation._security`, `delete pathObj.parameters`), src/types/index.ts comments (WP-011/019/022-026/027-033).
