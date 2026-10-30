# Stack & Operations

All facts below come from `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`,
`playwright.config.ts`, `eslint.config.js`, `postcss.config.js`, `tailwind.config.js`.

## Runtime

| Concern | Choice | Evidence |
| --- | --- | --- |
| Language | TypeScript 5.9 (`^5.4.0`), ESM (`"type": "module"`) | `package.json`, `tsconfig.json` |
| UI | React 19.2 + ReactDOM 19.2 | `package.json`, `src/main.tsx` |
| Build/dev server | Vite 5.4 with `@vitejs/plugin-react` | `vite.config.ts` |
| Styling | Tailwind CSS 3.4 + PostCSS 8.5 + Autoprefixer 10.4 | `postcss.config.js`, `tailwind.config.js`, `src/styles/globals.css` |
| YAML | `js-yaml` 4.1.1 (`load` on import, `dump` on export) | `src/utils/openAPILoader.ts`, `src/utils/exportService.ts` |
| Persistence | Browser `localStorage` only — no backend, no HTTP client | `src/services/storageService.ts` |

No router, no state-management library, no form library, no HTTP client, no UI kit is installed.
Tailwind's `theme.extend` maps semantic names (`bg-surface-base`, `text-text-primary`,
`border-border-default`, `text-action-primary`, `state-error`, `sidebar-*`, `focus-ring`,
`shadow-panel|raised|modal`, `radius-*`) onto CSS custom properties `--color-*`, `--radius-*`,
`--shadow-*` that must be declared in the global stylesheet.

## Tooling

| Tool | Version | Config |
| --- | --- | --- |
| Package manager | pnpm (lockfile v9, `autoInstallPeers: true`) | `pnpm-lock.yaml` |
| ESLint 9 flat config | 9.39 with `@eslint/js`, `typescript-eslint` 7, `eslint-plugin-react` 7.37, `eslint-plugin-react-hooks` 5 | `eslint.config.js` |
| Playwright Test | 1.59 (`@playwright/test`) | `playwright.config.ts` |
| TypeScript | 5.9, `noEmit`, project reference `tsconfig.node.json` | `tsconfig.json` |

Node baseline: ESLint 9 requires `^18.18.0 || ^20.9.0 || >=21.1.0`; Playwright requires
`>=18` (see `pnpm-lock.yaml` `engines`). No `engines` field is declared in `package.json` —
assume Node 20 LTS.

## Commands

| Purpose | Command |
| --- | --- |
| Install (reproducible) | `pnpm install --frozen-lockfile` |
| Dev server (port 5173, auto-opens) | `pnpm dev` |
| Type check | `pnpm type-check` (`tsc --noEmit`) |
| Lint | `pnpm lint` (`eslint src --ext ts,tsx`) |
| Lint + autofix | `pnpm lint:fix` |
| Production build | `pnpm build` (`tsc && vite build`) |
| Preview build | `pnpm preview` |
| E2E suite (starts Vite itself) | `pnpm test:e2e` |
| E2E headed | `pnpm test:e2e:headed` |
| Single spec | `pnpm test:e2e e2e/app.spec.ts` |
| Skip screenshot regeneration | `pnpm test:e2e --grep-invert "capture all manual screenshots"` |
| Install browser once | `pnpm exec playwright install chromium` (no script defined — gap) |

## TypeScript specifics that affect how you write code

- `jsx: "react"` with `jsxFactory: React.createElement` → **every `.tsx` file must import React**
  (`import React, { useState } from 'react'`). Do not switch to the automatic runtime without an
  explicit decision.
- `moduleResolution: "bundler"`, `isolatedModules: true` → type-only re-exports must use
  `export type` if added.
- `noUnusedLocals` / `noUnusedParameters` / `noImplicitReturns` are on: unused imports fail the
  build (`pnpm build` compiles first).
- `include: ["src"]` → `e2e/**`, `playwright.config.ts` and `vite.config.ts` are **not**
  type-checked by `pnpm type-check`; they are covered by `tsconfig.node.json` (config files) and
  by the Playwright TS transform at runtime only.

## ESLint specifics

- Flat config, `ignores: ['dist']`, browser globals, `react` + `react-hooks` recommended rules,
  plus `tseslint.configs.recommended`.
- `react/jsx-uses-react` and `react/react-in-jsx-scope` are off (classic runtime is used via
  `jsxFactory`, so the import is still required by `tsc`).
- The npm script only lints `src`, so `e2e/` and root config files are **not linted** — a known
  gap; extend the script deliberately if you want coverage there.

## Playwright specifics

- `testDir: './e2e'`, Chromium only, `fullyParallel: true`.
- `baseURL: 'http://127.0.0.1:5173'`; the web server is started automatically with
  `pnpm dev --host 127.0.0.1` (120 s timeout, reused locally when not in CI).
- CI behaviour: `forbidOnly`, 2 retries, HTML + list reporters; trace on first retry.
- Shared fixtures live in `e2e/helpers/editor.ts` (`resetAppState`, `createPath`, `addOperation`).
- `e2e/screenshots.spec.ts` is a **serial** documentation job that writes PNGs into
  `docs/screenshots/` and mutates the app heavily; it is not a behavioural assertion suite.
- `test-results/` exists at the repository root as Playwright output; it must not be committed as
  a source of truth.
- Selectors are accessibility-based (`getByRole`, `getByLabel`, `getByPlaceholder`), and modals
  are located with `.fixed.inset-0` + `.last()`. Keep those structures stable or update helpers.

## Known operational gaps

- No unit/integration test runner (no Vitest/Jest config or script): `src/utils/*` pure functions
  are only exercised through the UI.
- No CI workflow files in the snapshot (`.github/agents/` exists, `.github/workflows/` does not).
- No formatter (Prettier/EditorConfig) configured; style is enforced by review only.
- No `engines`/`packageManager` field pinning Node or pnpm versions.
- No migration strategy for `localStorage` documents written by older schemas.
