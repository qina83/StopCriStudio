# ADR-0002: Two-level localStorage schema: metadata index plus per-specification records

- **Status**: inferred
- **Date**: 2026-10-30

## Context

The load modal must list every saved specification cheaply, while each full OpenAPI document can be large. Reading every document to render the list would be wasteful.

## Decision

Store a JSON array of `SpecificationMetadata` under the key `stopCriStudio_specifications`, and one full `OpenAPISpecification` JSON document per id under `stopCriStudio_specifications_<id>`. `saveSpecification` writes both (upserting the metadata entry); `deleteSpecification` removes both; `getAllSpecifications` reads only the index.

## Consequences

The index and the documents can diverge if one write fails (quota), so `saveSpecification` is best-effort with `console.error`. Any schema change is a breaking change for existing users: a migration/read-compat path is required. E2E fixtures must clear both the index key and every `${key}_*` prefix entry.

## Evidence

src/services/storageService.ts (STORAGE_KEY = 'stopCriStudio_specifications', getAllSpecifications/getSpecification/saveSpecification/deleteSpecification), e2e/app.spec.ts and e2e/helpers/editor.ts (reset logic over `${STORAGE_KEY}_` keys).
