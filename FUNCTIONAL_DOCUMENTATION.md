# Stop Cri Studio — Functional Documentation

## 1. Introduction

Stop Cri Studio is an **offline, browser-based OpenAPI 3.0 specification editor**. It lets technical users create, import, edit, persist, and export OpenAPI documents without any backend or network dependency. All data is stored locally in the browser (`localStorage`) and autosaves continuously. Specifications can be exported as YAML for use in any external tooling.

The application is built as a single-page React + TypeScript app (Vite, Tailwind CSS) and is structured around three top-level navigation areas inside the editor:

- **API Info** — top-level metadata (title, version, description, contact, license, servers).
- **Paths** — API endpoints with HTTP operations, path parameters, query parameters, request body, responses, and security requirements.
- **Schemas** — reusable data models stored under `components.schemas`, referenceable from request bodies and responses.

The product is built around four core principles:

1. **Offline-first**: everything runs locally; no account, no server.
2. **Autosave everywhere**: every change is persisted immediately.
3. **Consistent editing patterns**: the same tree-based field editor is reused across query parameters, request bodies, response models, and schemas.
4. **OpenAPI fidelity**: the in-memory model maps cleanly to a valid OpenAPI 3.0 export (YAML).

### 1.1 High-level functional map

| Area | Purpose |
|---|---|
| Welcome page | Entry point with three actions: Create, Load saved, Import file. |
| Specification editor shell | Header (title, version, save status, export), left sidebar (filter, paths, schemas), main content panel. |
| API Info panel | Edit top-level OpenAPI `info` block. |
| Paths panel | Manage paths, path parameters, and HTTP operations. |
| Operation editor | Per-operation editor with Query Parameters, Request Body, Responses, Security tabs/sections. |
| Schemas panel | Manage reusable schemas with the tree editor; show "Used in" usage list. |
| Sidebar navigation | Filterable lists of paths and schemas with quick selection and method badges. |
| Storage service | Autosave to `localStorage` with per-spec keys. |
| Import / Export | Load YAML/JSON, validate, and export YAML. |

### 1.2 Cross-cutting behaviors

- **Autosave**: every add/edit/remove on any entity (paths, operations, parameters, body, responses, security, schemas) triggers an immediate write to local storage.
- **Alphabetical ordering**: paths and schemas are case-insensitively sorted in every list and selector view.
- **Filtering**: a single sidebar search input filters both paths and schemas with substring matching and a debounce.
- **Validation**: file imports are validated as OpenAPI; schema names are validated for uniqueness and allowed characters; status code / media type combinations are validated for uniqueness.
- **Schema references**: object fields in request bodies and response models can reference `components.schemas` via `$ref`, with click-through navigation to the schema editor.

---

## 2. Functionalities and User Stories

Each functionality below maps to one or more existing user-story files in `UserStories/WP-XXX.md`. Stories are grouped by feature area for a user-centric overview.

### 2.1 Application entry and welcome

The Welcome page is the first screen shown on launch. It explains the product and offers three primary actions: create a new specification, load a saved one, or import a file.

- **WP-001 — First-time user sees Welcome page**: as a first-time user, I want a clear welcome screen on launch so I understand what Stop Cri Studio is and what I can do.
- **WP-002 — Create new OpenAPI specification**: as a technical user, I want to create a new specification by clicking "Create" so I can start documenting an API from scratch in the structured editor.
- **WP-007 — Load an existing OpenAPI file**: as a technical user, I want to import an existing YAML/JSON OpenAPI file from disk so I can review and edit previously created documentation.
- **WP-008 — Load and delete saved specifications**: as a returning user, I want to open a modal listing all locally saved specifications and delete the ones I no longer need so I can manage my projects efficiently.

### 2.2 Specification editor shell

The editor shell wraps every editing experience: a header with name, spec version, save status, and Export action; a left sidebar with filter and navigation; and a main content panel that swaps between Info, Paths, and Schemas.

- **WP-002 — Editor layout**: three-panel layout (sidebar, header, main panel) is shown immediately after Create.
- **WP-010 — Edit API info from header**: as a user, I want an edit icon in the header next to the spec title for direct access to API info, removing the need to navigate the sidebar.
- **WP-004 — Export specification as YAML**: as a technical user, I want a clearly visible Export button in the header so I can download a YAML file of the current specification.

### 2.3 Sidebar navigation, filtering, and ordering

The sidebar lists paths and schemas, supports filtering with a debounced search, shows count badges and HTTP method badges, and lets the user jump straight to any entity.

- **WP-009 — Filter paths and schemas**: as a user with large specs, I want a search input above the paths/schemas accordions so I can quickly narrow the lists.
- **WP-050 — Alphabetical ordering across the editor**: as a user, I want paths and schemas to be alphabetically ordered (case-insensitive, stable) in every list and selector.
- **WP-051 — Click schema item in sidebar**: as a user, I want sidebar schemas to be clickable so they open directly in the schema edit form, like path items.

### 2.4 API Info editing

The Info panel maps to the OpenAPI `info` object: title, version, description, contact, license, and the `servers` block.

- **WP-010 — Edit API information from header**: covered above; provides quick access from the header. The Info form supports editing all standard `info` fields with autosave.

### 2.5 Paths and operations management

Paths are the core resources of the spec. The user can create, rename, and delete paths; each path supports the seven HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS).

- **WP-003 — Define API paths and operations**: as a technical user, I want to add paths and define HTTP operations on each path so I can document all endpoints of my API.
- **WP-002.1 — Manage path form visibility**: as a technical user, I want the path list and form to toggle intelligently so I get a focused view when creating a path and a clear list otherwise.
- **WP-002.2 — Select created path and access operations**: as a technical user, I want a newly created path to be auto-selected with the operations section ready, so I can immediately add operations.
- **WP-002.3 — Manage operations in a path**: as a technical user, I want confirmation modals when adding/removing operations so I can manage HTTP methods safely.
- **WP-002.4 — Edit path with operation management form**: as a technical user, I want a dedicated edit form for each selected path showing all HTTP methods as interactive buttons so I can manage endpoints comprehensively in one view.
- **WP-005 — Edit path name inline**: as a technical user, I want to edit a path name directly in the form header (pencil icon) so I can rename endpoints without losing operations.

### 2.6 Path parameters

Path parameters are detected automatically from `{placeholders}` in the path string and managed per path.

- **WP-006 — Create path parameters**: as a technical user, I want `{id}`-style placeholders to be automatically recognized as path parameters and editable (name, type, description) so I can document dynamic segments correctly.

### 2.7 Query parameters (per operation)

Each operation has a Query Parameters section using a tree editor. Parameters can be scalar, object (with nested properties), or array (with element type).

- **WP-011 — Manage query parameters for an operation**: as a technical user, I want to add, edit, and remove query parameters per operation so each endpoint's query contract stays accurate.
- **WP-014 — Define and validate scalar query parameters**: as a technical user, I want scalar query parameters with type (string/number/integer/boolean) and validation rules (default, pattern, min/max) so I can document simple parameters precisely.
- **WP-016 — Define object-type query parameters**: as a technical user, I want object-type query parameters with nested properties so I can model complex query structures.
- **WP-017 — Define array-type query parameters**: as a technical user, I want array-type query parameters with a chosen element type so I can document parameters that accept multiple values.
- **WP-019 — Persistence and auto-save of query parameters**: as a technical user, I want every change to query parameters to autosave to local storage scoped by operation so I never lose work.
- **WP-020 — Export query parameters to YAML**: as a technical user, I want query parameters to be exported as a valid OpenAPI `parameters` array on the correct operation.
- **WP-021 — Use the query parameter tree editor**: as a technical user, I want a tree editor with operation context (method + path), root parameters visible by default, and primitives as leaves.

### 2.8 Request body (per operation)

The Request Body section is available only for body-eligible methods (PUT, POST, PATCH). It supports description, required flag, media type selection, and a tree editor for the body schema, including `$ref` to existing schemas.

- **WP-022 — Access request body for eligible operations**: as a technical user, I want the body section to be visible only for PUT/POST/PATCH so the UI matches OpenAPI semantics.
- **WP-023 — Configure request body metadata**: as a technical user, I want a description field and a required toggle that map to `requestBody.description` and `requestBody.required`.
- **WP-024 — Select media type for request body**: as a technical user, I want to pick from common media types (`application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`, `application/octet-stream`) or enter a custom one.
- **WP-025 — Manage body schema parameters**: as a technical user, I want a tree editor for body properties with the same pattern as query parameters (name, type, required, description), supporting scalar, object, and array types.
- **WP-026 — Export request body to YAML**: as a technical user, I want the request body exported under the correct operation, with `description` only when set and `required` always explicit.
- **WP-037 — Reference a schema in a body object field**: as a technical user, I want object-typed body fields to optionally use `$ref` to a schema in `components/schemas` via a (searchable) dropdown.
- **WP-055 — Create reusable schema from inline body**: as a technical user, I want to extract an inline request body object structure into a reusable schema entry, with a name prompt.

### 2.9 Responses (per operation)

Each operation has a Responses section supporting multiple status codes and multiple media types per code, with inline or referenced models, and a collapsible structure preview.

- **WP-040 — Access operation response panel**: as a technical user, I want a Responses section for every operation with operation context and an empty state.
- **WP-041 — Add responses with multiple status codes and media types**: as a technical user, I want to add responses by status code (e.g. 200, 404, default) and define one or more media types per code without overwriting.
- **WP-042 — Define response model as inline schema**: as a technical user, I want to model a response payload inline using the same tree editor as the request body.
- **WP-043 — Define response model as schema reference**: as a technical user, I want to set a response model via `$ref` to an entry in `components.schemas`.
- **WP-044 — Edit and remove operation responses**: as a technical user, I want to edit status code, media type, description, and model source, with uniqueness checks on (status + media) combinations.
- **WP-045 — Persist and load operation responses**: as a technical user, I want responses to autosave and to be restored from local storage and imported files.
- **WP-046 — Export operation responses to YAML/JSON**: as a technical user, I want each operation's `responses` object exported with all status codes, media types, descriptions, and inline/reference schemas.
- **WP-047 — Delete only the selected media type**: as a technical user, deleting a response row must remove only that (status, media type) entry, collapsing the status code if it was the last one.
- **WP-048 — Collapsible response structure preview**: as a technical user, I want each response row to be expandable to inspect the schema without entering edit mode.
- **WP-049 — Open schema form from response `$ref`**: as a technical user, I want a `$ref` shown in a response to be a clickable link that opens the referenced schema in edit mode.
- **WP-056 — Create reusable schema from inline response**: as a technical user, I want to extract an inline response object structure into a new reusable schema, with a name prompt.

### 2.10 Security (per operation)

Security requirements are managed per operation. Supported scheme types are `apiKey` (header/query/cookie) and `http` (basic/bearer). Both the per-operation `security` array and the `components.securitySchemes` are managed together.

- **WP-027 — Access the security panel**: as a technical user, I want a Security section in the operation editor for all HTTP methods, styled consistently with Query Parameters.
- **WP-028 — Add an `apiKey` security requirement**: as a technical user, I want to define an `apiKey` requirement by name and location (header/query/cookie).
- **WP-029 — Add an `http` security requirement**: as a technical user, I want to define an `http` requirement by scheme identifier and scheme type (basic/bearer), optionally with a bearer format.
- **WP-030 — Edit and remove security requirements**: as a technical user, I want inline edit and delete actions on each requirement with the same form used for creation.
- **WP-031 — Persist operation security**: as a technical user, I want security changes to autosave together with the `components.securitySchemes` definitions.
- **WP-032 — Export operation security to YAML**: as a technical user, I want a `security` array under each operation with at least one requirement, formatted as a Security Requirement Object (scheme name → empty scopes array).
- **WP-033 — Load operation security**: as a technical user, I want `security` arrays parsed and matched to scheme definitions when loading from file or local storage so I can keep working without data loss.

### 2.11 Schemas (`components.schemas`)

The Schemas panel manages reusable data models with the same tree editor used for request bodies and responses. Schemas can be created, edited, deleted, and referenced from elsewhere.

- **WP-034 — Create a reusable schema**: as a technical user, I want an "Add Schema" action that prompts for a validated name (alphanumerics, hyphens, underscores, unique) and opens the tree editor.
- **WP-035 — Edit an existing schema**: as a technical user, I want to open and edit any schema, including renaming it with the same validation rules.
- **WP-036 — Delete a schema**: as a technical user, I want to delete a schema with a confirmation prompt; it is removed from `components/schemas` immediately.
- **WP-038 — Persist and load schemas**: as a technical user, I want schemas to autosave to local storage and be restored on reload or file import.
- **WP-039 — Export schemas to OpenAPI**: as a technical user, I want every schema to appear in `components.schemas` of the exported file with names, types, required arrays, descriptions, and nesting preserved.
- **WP-052 — Show schema usage list ("Used in")**: as a technical user, I want the schema form to show all operations that reference the schema (including nested usages) so I can assess impact.
- **WP-053 — Prompt for reference strategy on rename**: as a technical user, when I change a schema name I want a modal asking whether to (a) rename all references or (b) create a new schema and keep references unchanged.
- **WP-054 — Rename creates copy and blocks conflicts**: as a technical user, if I choose "create new schema" the new schema is cloned from current edits, the original is untouched, and name conflicts are blocked.
- **WP-057 — Validate and safely persist schema extraction**: as a technical user, when extracting an inline structure into a schema, I want validation against empty/invalid/duplicate names, with no partial writes, and atomic save of the new schema and the `$ref` replacement.

### 2.12 Persistence, import, and export

Persistence is automatic and offline; import and export cover YAML and JSON OpenAPI 3.0.

- **Storage service**: each specification is stored under a per-spec key (`stopCriStudio_specifications_{id}`), plus a metadata index. All editor actions trigger immediate save.
- **WP-007 — Import** (YAML/JSON): validated on load with friendly error reporting; the imported spec is also saved to local storage.
- **WP-004 — Export** as YAML: header action that downloads the current specification.
- **WP-019 / WP-031 / WP-038 / WP-045** — autosave coverage for query parameters, security, schemas, and responses respectively.
- **WP-020 / WP-026 / WP-032 / WP-039 / WP-046** — export coverage for query parameters, request bodies, security, schemas, and responses respectively.
- **WP-033 / WP-038 / WP-045** — load coverage from file and local storage for security, schemas, and responses respectively.

---

## 3. Quick reference: all user stories by ID

| ID | Feature area | Title |
|---|---|---|
| WP-001 | Welcome | First-time user sees Welcome page |
| WP-002 | Welcome / Editor shell | User creates new OpenAPI specification |
| WP-002.1 | Paths | Manage path form visibility |
| WP-002.2 | Paths | Select created path and access operations |
| WP-002.3 | Paths | Manage operations in path |
| WP-002.4 | Paths | Edit path with operation management form |
| WP-003 | Paths | Define API paths and operations |
| WP-004 | Export | Export specification as YAML |
| WP-005 | Paths | Edit path name inline |
| WP-006 | Path parameters | Create path parameters |
| WP-007 | Import | Load existing OpenAPI file |
| WP-008 | Storage | Load and delete saved specifications |
| WP-009 | Sidebar | Filter paths and schemas |
| WP-010 | API Info | Edit API information from header |
| WP-011 | Query parameters | Manage query parameters |
| WP-014 | Query parameters | Scalar parameters and validation |
| WP-016 | Query parameters | Object-type parameters |
| WP-017 | Query parameters | Array-type parameters |
| WP-019 | Query parameters | Persistence and auto-save |
| WP-020 | Query parameters | Export to YAML |
| WP-021 | Query parameters | Tree editor UX |
| WP-022 | Request body | Access for eligible operations |
| WP-023 | Request body | Configure metadata |
| WP-024 | Request body | Select media type |
| WP-025 | Request body | Manage body schema parameters |
| WP-026 | Request body | Export to YAML |
| WP-027 | Security | Access security panel |
| WP-028 | Security | Add apiKey requirement |
| WP-029 | Security | Add http requirement |
| WP-030 | Security | Edit and remove requirements |
| WP-031 | Security | Persist to local storage |
| WP-032 | Security | Export to YAML |
| WP-033 | Security | Load from file or storage |
| WP-034 | Schemas | Create reusable schema |
| WP-035 | Schemas | Edit existing schema |
| WP-036 | Schemas | Delete schema |
| WP-037 | Request body / Schemas | Reference a schema in body object field |
| WP-038 | Schemas | Persist and load schemas |
| WP-039 | Schemas | Export schemas |
| WP-040 | Responses | Access response panel |
| WP-041 | Responses | Add responses with multi status codes/media |
| WP-042 | Responses | Inline schema response model |
| WP-043 | Responses | Schema reference response model |
| WP-044 | Responses | Edit and remove responses |
| WP-045 | Responses | Persist and load responses |
| WP-046 | Responses | Export responses |
| WP-047 | Responses | Delete only selected media type |
| WP-048 | Responses | Collapsible structure preview |
| WP-049 | Responses / Schemas | Open schema form from response `$ref` |
| WP-050 | Sidebar / Lists | Alphabetical ordering across editor |
| WP-051 | Sidebar / Schemas | Click schema item in sidebar |
| WP-052 | Schemas | Show schema usage ("Used in") |
| WP-053 | Schemas | Prompt for reference strategy on rename |
| WP-054 | Schemas | Create copy on rename / block conflicts |
| WP-055 | Request body / Schemas | Create reusable schema from inline body |
| WP-056 | Responses / Schemas | Create reusable schema from inline response |
| WP-057 | Schemas | Validate and safely persist schema extraction |

For full acceptance criteria of each story, see the corresponding file under `UserStories/WP-XXX.md`.
