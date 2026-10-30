# Gates

Checks that agents must run or respect before proposing a change.

| Gate | Command | Mandatory | Description |
| ---- | ------- | --------- | ----------- |
| frozen-lockfile-install | `pnpm install --frozen-lockfile` | yes | Verifies that `package.json` and `pnpm-lock.yaml` agree and that no uncommitted dependency was added. Run first in any clean environment and whenever a dependency is touched. Fails if a dependency was added without updating the lockfile (or vice versa). Runtime dependency additions additionally require an ADR (see CONSTITUTION C7). |
| type-check | `pnpm type-check` | yes | Runs `tsc --noEmit` over `src` with `strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`. Blocks any change with a type error, an unused import/variable, or a missing return. Note: `e2e/**` and root config files are not covered by this tsconfig — run the E2E gate for those. |
| production-build | `pnpm build` | yes | Full production build: `tsc && vite build` (Tailwind/PostCSS pipeline included). Catches type errors that `type-check` would also catch plus bundling failures (bad imports, unresolved modules, CSS/PostCSS misconfiguration). Must pass before proposing a change; a build that emits warnings about missing modules is a failure. |
| lint | `pnpm lint` | yes | Runs ESLint 9 flat config (`eslint src --ext ts,tsx`) with @eslint/js recommended, react, react-hooks and typescript-eslint recommended rules. Blocks unused directives, hook-dependency violations and React anti-patterns. Known gap: the script only covers `src`, so `e2e/**` and root config files are unchecked — review them manually in the review workflow. |
| e2e-ci-mode | `CI=1 pnpm test:e2e` | no | Mirrors the pipeline configuration baked into `playwright.config.ts` (`forbidOnly`, 2 retries, HTML + list reporters, no dev-server reuse). Run before proposing a change that touches tests or the editor flow, so a `test.only` or a flaky-on-retry assertion is caught locally. Non-blocking for small docs-only changes, but required for any change under `e2e/`. |
| e2e-behavioural | `pnpm test:e2e --grep-invert "capture all manual screenshots"` | yes | Runs the behavioural Playwright suite in Chromium against a real Vite dev server (started automatically on 127.0.0.1:5173). The screenshot job is excluded because it regenerates `docs/screenshots/*.png` and only asserts visibility along the way. Run the full `pnpm test:e2e` (including screenshots) when UI copy, layout or the editor flow changed, so the documentation screenshots stay accurate. |

## Detail

### frozen-lockfile-install

Verifies that `package.json` and `pnpm-lock.yaml` agree and that no uncommitted dependency was added. Run first in any clean environment and whenever a dependency is touched. Fails if a dependency was added without updating the lockfile (or vice versa). Runtime dependency additions additionally require an ADR (see CONSTITUTION C7).

```bash
pnpm install --frozen-lockfile
```

### type-check

Runs `tsc --noEmit` over `src` with `strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`. Blocks any change with a type error, an unused import/variable, or a missing return. Note: `e2e/**` and root config files are not covered by this tsconfig — run the E2E gate for those.

```bash
pnpm type-check
```

### production-build

Full production build: `tsc && vite build` (Tailwind/PostCSS pipeline included). Catches type errors that `type-check` would also catch plus bundling failures (bad imports, unresolved modules, CSS/PostCSS misconfiguration). Must pass before proposing a change; a build that emits warnings about missing modules is a failure.

```bash
pnpm build
```

### lint

Runs ESLint 9 flat config (`eslint src --ext ts,tsx`) with @eslint/js recommended, react, react-hooks and typescript-eslint recommended rules. Blocks unused directives, hook-dependency violations and React anti-patterns. Known gap: the script only covers `src`, so `e2e/**` and root config files are unchecked — review them manually in the review workflow.

```bash
pnpm lint
```

### e2e-ci-mode

Mirrors the pipeline configuration baked into `playwright.config.ts` (`forbidOnly`, 2 retries, HTML + list reporters, no dev-server reuse). Run before proposing a change that touches tests or the editor flow, so a `test.only` or a flaky-on-retry assertion is caught locally. Non-blocking for small docs-only changes, but required for any change under `e2e/`.

```bash
CI=1 pnpm test:e2e
```

### e2e-behavioural

Runs the behavioural Playwright suite in Chromium against a real Vite dev server (started automatically on 127.0.0.1:5173). The screenshot job is excluded because it regenerates `docs/screenshots/*.png` and only asserts visibility along the way. Run the full `pnpm test:e2e` (including screenshots) when UI copy, layout or the editor flow changed, so the documentation screenshots stay accurate.

```bash
pnpm test:e2e --grep-invert "capture all manual screenshots"
```
