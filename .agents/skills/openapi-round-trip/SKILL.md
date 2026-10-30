---
name: openapi-round-trip
description: "Load when adding, changing or debugging any OpenAPI construct that must survive import and export (query parameters, request bodies, security, responses, path parameters, schemas, new fields). Covers the internal `_`-prefixed representation and the transforms in src/utils/openAPILoader.ts and src/utils/exportService.ts."
---

# Adding an OpenAPI construct without breaking round-trip

The editor never stores a valid OpenAPI document. `content` is OpenAPI **plus** internal keys that
are created on import and removed on export. Any change must be symmetric.

## The contract

| Layer | Location | Direction |
| --- | --- | --- |
| Raw document | `OpenAPISpecification.content` | free-form `Record<string, unknown>` |
| Internal shape | `_queryParams`, `_requestBody`, `_security` on each operation; path-level `parameters` as `PathParameter[]` | editor-facing, typed in `src/types/index.ts` |
| Export | `transformForExport` → `js-yaml.dump(..., { lineWidth: -1, noRefs: true })` | must be valid OpenAPI 3.x |

Import chain (order matters): `importSecurity(importRequestBody(importQueryParameters(spec)))`
in `loadOpenAPIFile`.

## Procedure

1. **Type it.** Add/extend the variant in `src/types/index.ts` next to the related section
   (`QueryParameter*`, `RequestBody`/`BodyParameter*`, `SecurityScheme*`). Use a `type`
   discriminator and a `*Base` interface for shared fields.
2. **Import it.** Add `import<Thing>(content)` in `src/utils/openAPILoader.ts`:
   - deep clone: `JSON.parse(JSON.stringify(content))`;
   - guard: `if (!result.paths || typeof result.paths !== 'object') return result`;
   - walk `HTTP_METHODS = ['get','post','put','delete','patch','head','options']` (module constant)
     and skip non-object operations;
   - capture into the `_`-prefixed key, then `delete` the raw key you replaced;
   - reuse `openAPISchemaToBodyParam` / `openAPISchemaToQueryParam` rather than a new walker;
   - add the call to the import chain in `loadOpenAPIFile`.
3. **Export it.** Extend `transformForExport` (or a helper like `buildRequestBodyExport`,
   `queryParamToOpenAPI`, `buildSecuritySchemesExport`):
   - produce the standard OpenAPI shape (`in`/`name`/`schema`, `content[mediaType].schema`,
     `[{ schemeName: [] }]`, `components.securitySchemes`);
   - `delete` the internal key on **every** operation, unconditionally (follow
     `delete operation._queryParams`);
   - keep ordering: guideline normalisation (`operationId`, `tags`, `responses`) happens before
     parameter assembly; do not break the merge that puts path parameters first and filters
     duplicates.
4. **Guard the guidelines.** Export must still yield a non-empty `operationId`, non-empty `tags`,
   non-empty `responses`, and no `undefined`/empty-string values — spread optional fields
   (`...(description ? { description } : {})`).
5. **Respect the unsupported.** If the construct cannot be edited visually, keep it untouched in
   `content` and surface `{ editable: false, reason }` (see `parseEditableObjectSchema`). Never
   drop user data to make the editor simpler.
6. **Prove it end-to-end.** Add/extend an `e2e` spec (see the `playwright-e2e-spec` skill) that
   imports a document containing the construct, asserts it appears in the editor, exports, and
   asserts the internal key is gone from the produced YAML when observable.

## Reference fixtures

Minimal valid document used by `e2e/app.spec.ts`:

```yaml
openapi: 3.0.0
info:
  title: Imported Petstore
  version: 2.1.0
paths: {}
components:
  schemas: {}
```

## Pitfalls observed in this codebase

- `content.parameters` at path level is internal (`PathParameter[]`) and must be deleted on export;
  operation-level `parameters` is the exported array.
- `_requestBody` is only meaningful for `BODY_ELIGIBLE_METHODS` (`PUT`, `POST`, `PATCH`) — export
  the body for those, but always delete `_requestBody`.
- `openAPIVersion` is the literal `'3.0.0'` while imports may be 3.1.x; branch on `content.openapi`,
  never on `specification.openAPIVersion`.
- `JSON.parse(JSON.stringify())` is the accepted deep-copy idiom here; do not introduce structured
  clone assumptions about non-JSON values.
- After changing a schema name, refs are fixed by `renameSchemaRefsInRequestBodies`
  (`src/utils/schemaUtils.ts`) — reuse `buildSchemaRef`/`getSchemaNameFromRef`.
