# ADR-0005: Visual schema editing limited to object schemas; composition is read-only

- **Status**: documented
- **Date**: 2026-10-30

## Context

The editor supports a fixed subset of OpenAPI. Imported or authored schemas may use composition (`oneOf`/`anyOf`/`allOf`) or non-object top-level types that the property-tree UI cannot represent, and silently flattening them would corrupt the user's document.

## Decision

The visual schema/property editor only handles `type: object` top-level schemas built from scalar/object/array properties, optionally with `$ref` to `#/components/schemas/<name>`. Anything else is treated as read-only: `parseEditableObjectSchema` returns `{ editable: false, properties: [], reason }` with a human-readable reason, and `parseBodyParamFromSchema` throws for `oneOf/anyOf/allOf`, which is caught and converted into that result. Raw schema content is preserved in `content.components.schemas`.

## Consequences

The UI must present a non-editable state with the reason rather than an empty builder. Schema renames must keep references consistent across request bodies (`renameSchemaRefsInRequestBodies`) and are restricted to names matching `^[a-zA-Z0-9_-]+$` (`isValidSchemaName`). Supporting composition is a scoped feature requiring new helpers plus round-trip import/export support.

## Evidence

src/utils/schemaUtils.ts (ParsedSchema { editable, properties, reason }, 'Uses oneOf/anyOf/allOf, which is not supported by the visual editor.', 'Top-level schema must be type: object for visual editing.', isValidSchemaName, buildSchemaRef, renameSchemaRefsInRequestBodies), src/types/index.ts (BodyParameter union).
