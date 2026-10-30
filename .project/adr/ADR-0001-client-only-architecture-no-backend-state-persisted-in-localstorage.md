# ADR-0001: Client-only architecture: no backend, state persisted in localStorage

- **Status**: inferred
- **Date**: 2026-10-30

## Context

The product must let users author OpenAPI specifications with zero infrastructure. No server code, API client, authentication or database exists in the repository; `package.json` has only react, react-dom and js-yaml as runtime dependencies, and `vite.config.ts` contains just the React plugin and a dev server on port 5173.

## Decision

The application is a purely client-side SPA. All persistence is browser `localStorage`, accessed exclusively through `src/services/storageService.ts`. Nothing in runtime code performs network I/O; import/export uses the File API and Blob downloads.

## Consequences

Data is per-browser and per-origin: clearing site data destroys specifications. There is no sharing, sync or server-side validation, so the client must validate OpenAPI content itself (`validateOpenAPIContent`). Any future sync/back-end is an architectural change requiring a new ADR. Testing must reset `localStorage` between cases (`e2e/helpers/editor.ts`).

## Evidence

src/App.tsx ("Offline OpenAPI Workspace"), src/services/storageService.ts, src/utils/openAPILoader.ts, src/utils/exportService.ts (Blob + document.createElement('a')), package.json dependencies, vite.config.ts, e2e/app.spec.ts (localStorage assertions).
