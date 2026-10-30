# ADR-0008: End-to-end Playwright verification against the live dev server

- **Status**: documented
- **Date**: 2026-10-30

## Context

The only automated verification in the repository is a Playwright suite; there is no unit-test runner configured in `package.json` or a `vitest`/`jest` config.

## Decision

Behaviour is verified end-to-end in a real browser against the real Vite dev server, driven by accessibility selectors. Specs run Chromium-only, fully parallel, with `resetAppState` clearing the documented storage keys. A separate serial spec (`e2e/screenshots.spec.ts`) generates the documentation screenshots consumed from `docs/screenshots/`.

## Consequences

Accessible names, labels, placeholders and modal DOM structure (`.fixed.inset-0`) are effectively a public API; renaming copy breaks tests. Pure utilities in `src/utils` are only covered indirectly, so refactors of import/export logic need e2e coverage added first. Feedback loops are slow (dev-server boot, full app navigation per test), which pushes logic into pure helpers that can at least be reasoned about deterministically.

## Evidence

playwright.config.ts (testDir './e2e', chromium, webServer 'pnpm dev --host 127.0.0.1', baseURL 127.0.0.1:5173), package.json scripts (test:e2e, test:e2e:headed — no unit script), e2e/helpers/editor.ts, e2e/screenshots.spec.ts (writes to docs/screenshots), docs/screenshots/.
