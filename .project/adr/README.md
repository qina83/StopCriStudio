# Decision log

Index of reconstructed architectural decisions. The `inferred` status indicates a reconstruction that should be validated with the team.

| ID | Decision | Status |
| -- | -------- | ------ |
| ADR-0001 | Client-only architecture: no backend, state persisted in localStorage | inferred |
| ADR-0002 | Two-level localStorage schema: metadata index plus per-specification records | inferred |
| ADR-0003 | Internal editing model extends OpenAPI with underscore-prefixed transient fields | inferred |
| ADR-0004 | Single `useSpecification` hook owns state, mutations and debounced autosave | inferred |
| ADR-0005 | Visual schema editing limited to object schemas; composition is read-only | documented |
| ADR-0006 | Export enforces Italian AgID OpenAPI guidelines (operationId, tags, responses) | documented |
| ADR-0007 | Tailwind semantic design tokens plus an in-repo `ui` primitive layer | inferred |
| ADR-0008 | End-to-end Playwright verification against the live dev server | documented |
| ADR-0009 | Pure transformation utilities with result-object error handling at the format boundary | inferred |
| ADR-0010 | OpenAPI 3.0.0 is the canonical target; 3.0.x/3.1.x documents are imported and preserved | inferred |
