# Open questions

Answer only the questions below. Run `make refinment <repo-path>` to record decisions as ADRs and refresh the playbook.

- **Q1:** There is no unit-test runner in the repository (no vitest/jest dependency, config or npm script), so pure logic in src/utils (openAPILoader, exportService, schemaUtils, pathParameterUtils) is verified only indirectly through Playwright. Should a unit runner be introduced (e.g. Vitest with a `test:unit` script and a new mandatory gate), or is end-to-end coverage the deliberate standard?
  **Answer:** _Pending_

- **Q2:** Import accepts OpenAPI 3.0.x and 3.1.x, but the internal type pins `openAPIVersion` to '3.0.0' and export dumps `content` unchanged. Is 3.1 document support (and 3.1-specific constructs such as type arrays, `webhooks`) in scope, and should export normalise to 3.0.0 or preserve the imported version? The answer changes the type model and the export pipeline.
  **Answer:** _Pending_

- **Q3:** `.github/agents/` exists but no `.github/workflows/` is present in the repository snapshot, so it is unclear whether type-check/lint/build/e2e are enforced by an external pipeline and with which Node/pnpm versions (package.json declares neither `engines` nor `packageManager`). Should the gates be wired into an in-repo CI workflow, and if so which runtime versions are canonical?
  **Answer:** _Pending_
