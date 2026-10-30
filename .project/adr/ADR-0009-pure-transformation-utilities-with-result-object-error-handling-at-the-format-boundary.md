# ADR-0009: Pure transformation utilities with result-object error handling at the format boundary

- **Status**: inferred
- **Date**: 2026-10-30

## Context

OpenAPI transformation logic (parse YAML/JSON, validate, split into internal fields, rebuild on export) is substantial and independent from rendering. Placing it in components would make it untestable given the absence of a unit-test runner and would entangle UI with the document format.

## Decision

All format-level logic lives in framework-free modules under `src/utils/` (`openAPILoader.ts`, `exportService.ts`, `pathParameterUtils.ts`, `schemaUtils.ts`) with explicit result types instead of exceptions: `LoadResult { success, spec?, errors?: ValidationError[] }` at the load boundary, `ParsedSchema { editable, properties, reason? }` at the schema boundary. React components consume these results and render messages.

## Consequences

Utils must stay import-side-effect free and must not import React (except `exportService`, which owns the Blob/download side effect). Error messages produced by utils are user-facing strings, so they must stay English and actionable. New validation rules go into `validateOpenAPIContent` and surface through the same modal, never via `throw` into render.

## Evidence

src/utils/openAPILoader.ts (ValidationError, LoadResult, validateOpenAPIContent), src/utils/schemaUtils.ts (ParsedSchema, try/catch → reason), src/App.tsx (loadError/loadErrorDetails rendered in ModalShell), src/utils/pathParameterUtils.ts (validatePathFormat → { valid, error }).
