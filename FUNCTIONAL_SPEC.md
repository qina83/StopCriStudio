# Stop Cri Studio — Functional Specification

> **Purpose of this document:** A technology-agnostic description of every implemented feature, screen, interaction, and edge case. Use it as the single source of truth to recreate this application from scratch in any framework.

---

## Table of contents

1. [Application overview](#1-application-overview)
2. [Data model & persistence](#2-data-model--persistence)
3. [Welcome screen](#3-welcome-screen)
4. [Load saved specification modal](#4-load-saved-specification-modal)
5. [Load file flow](#5-load-file-flow)
6. [Editor screen — layout](#6-editor-screen--layout)
7. [Editor — header bar](#7-editor--header-bar)
8. [Editor — left sidebar](#8-editor--left-sidebar)
9. [Info panel](#9-info-panel)
10. [Paths panel](#10-paths-panel)
11. [Path edit form](#11-path-edit-form)
12. [Path parameters](#12-path-parameters)
13. [HTTP operations](#13-http-operations)
14. [Query parameters](#14-query-parameters)
15. [Schemas panel](#15-schemas-panel)
16. [Export](#16-export)
17. [Auto-save](#17-auto-save)
18. [Global edge cases & constraints](#18-global-edge-cases--constraints)

---

## 1. Application overview

Stop Cri Studio is a **fully client-side, offline-first** web application for creating, editing, and exporting OpenAPI 3.0 specifications. There is no backend, no authentication, and no network requests. All data is stored in browser **local storage**.

The application has two top-level views:
- **Welcome screen** — entry point for creating and loading specifications.
- **Editor screen** — the full editing environment, entered after a specification is selected or created.

Navigation between views is managed by a single application state variable (`currentView`: `welcome` | `editor`).

---

## 2. Data model & persistence

### 2.1 Specification object

Each specification is stored as a flat JSON object with the following fields:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique ID, format `spec_[timestamp]_[random]` |
| `name` | string | Human-readable API name (maps to `info.title` in OpenAPI) |
| `specVersion` | string | The API's own version string (e.g., `1.0.0`), maps to `info.version` |
| `openAPIVersion` | string | Fixed at `"3.0.0"` for all specifications created in this app |
| `createdAt` | number | Unix timestamp (ms) |
| `updatedAt` | number | Unix timestamp (ms), updated on every save |
| `content` | object | Full OpenAPI content object stored in internal format (see §2.2) |

### 2.2 Internal content format

The `content` object mirrors the OpenAPI 3.0 structure (`openapi`, `info`, `paths`, `components.schemas`) with two internal extensions that are **removed at export time**:

- **`paths.[pathName].parameters`** — array of path parameter objects `{ name, type, description }`. Stored at the path level, not per-operation.
- **`paths.[pathName].[method]._queryParams`** — array of query parameter objects (see §14). Stored per-operation.

### 2.3 Local storage layout

| Key | Content |
|---|---|
| `stopCriStudio_specifications` | JSON array of metadata objects (id, name, specVersion, createdAt, updatedAt) — the index list |
| `stopCriStudio_specifications_[id]` | Full specification object for a single spec |

Metadata and full spec are kept separate so the "Load" modal can list all specs without loading every full document.

### 2.4 New specification defaults

When a new specification is created from scratch, it is initialised with:
- `name`: `"Untitled API"`
- `specVersion`: `"1.0.0"`
- `openAPIVersion`: `"3.0.0"`
- `content.paths`: empty object `{}`
- `content.components.schemas`: empty object `{}`

---

## 3. Welcome screen

### 3.1 Layout

The welcome screen fills the full viewport with a light gradient background. It has two vertical sections:

1. **Header area** (top, centered): application title "Stop Cri Studio" in large bold text, followed by a subtitle paragraph describing the app's purpose.
2. **Main action area** (centered in remaining space): a horizontal grid of three equal action cards.

The grid is responsive: single column on narrow screens, three columns on medium and wider screens.

### 3.2 Action cards

Each card is a white rounded box with a shadow. On hover it lifts slightly (upward transform), increases shadow depth, and the icon inside scales up. Keyboard focus shows a visible ring.

| Card | Icon | Heading | Body text | Action |
|---|---|---|---|---|
| Create | ✨ | Create | "Start a new OpenAPI specification from scratch" | Creates and opens a new spec immediately |
| Load | 📂 | Load | "Continue working on a saved specification" | Opens the Load Saved Specification modal (§4) |
| Load File | 📥 | Load File | "Import an OpenAPI YAML or JSON file" | Triggers a hidden file-picker input |

### 3.3 Error modal (file load errors)

When a file load attempt fails, a modal overlay appears over the welcome screen:

- **Overlay**: dark semi-transparent backdrop covering the whole screen.
- **Modal**: white rounded card, max width ~28rem, centered.
- **Title**: "⚠️ [error type]" in bold red text.
- **Body**: one or more error detail lines each as a paragraph.
- **Two buttons (side by side)**:
  - **"Try Another File"** (primary, blue): closes the error, immediately re-opens the file picker.
  - **"Close"** (secondary, slate): closes the error, does nothing else.

Error conditions that show this modal:
- File has an extension other than `.yaml`, `.yml`, or `.json` → title: `"Invalid file type"`.
- File content cannot be parsed as JSON or YAML → title: `"Error reading file"`.
- Parsed content fails OpenAPI validation → title: `"Invalid OpenAPI Specification"`, details list each field error.

---

## 4. Load saved specification modal

Triggered by the "Load" card on the welcome screen.

### 4.1 Layout

A modal dialog with a dark semi-transparent full-screen backdrop.

- **Header**: blue background, white text, title "Load Saved Specification".
- **Scrollable content area**: list of saved specification cards, or an empty state.
- **Footer**: "Cancel" and "Ok" buttons, right-aligned.

Max width: ~42rem. Max height: 80% of the viewport. Content area scrolls independently.

### 4.2 Specification list

Each saved specification is rendered as a clickable card with a border. The card contains:
- Specification **name** (large, bold).
- **Version and last-updated date**: `v[specVersion] • Updated [localeDateString]`.
- A **"Delete"** button on the right edge of the card (red text, transparent background).

**Selection**: clicking anywhere on the card (except the Delete button) selects it. The selected card highlights with a blue border and light blue background. Only one card can be selected at a time.

**Empty state**: when no saved specifications exist, the content area shows "No saved specifications yet" and a prompt to create or load a file.

### 4.3 Footer buttons

- **"Cancel"**: closes the modal, deselects any selection.
- **"Ok"**: disabled (greyed out, not-allowed cursor) when nothing is selected or when the list is empty. When enabled, loads the selected full spec from local storage and navigates to the editor.

### 4.4 Delete flow

1. User clicks "Delete" on a card. This opens a nested **delete confirmation modal** (on top of the load modal).
2. Delete confirmation shows: spec name, "Are you sure you want to delete [name]?", "⚠️ This action cannot be undone.", and two buttons: **"No"** (cancel) / **"Delete"** (red, confirms deletion).
3. On confirm: the spec is removed from local storage (both the metadata list and the full spec entry), the list updates, and any selection is cleared.
4. Clicking "No" returns to the load modal without any change.

---

## 5. Load file flow

### 5.1 File picker

The file input is hidden. Clicking "Load File" triggers it programmatically. The picker filters for `.yaml`, `.yml`, `.json` by default (browser-native filter).

### 5.2 Validation sequence

1. **Extension check**: the file's extension is extracted from its name. If it is not one of `.yaml`, `.yml`, `.json`, an error modal is shown immediately without reading the file.
2. **Parse**: file text is read. JSON is attempted first; if that fails, YAML is attempted. Any parse exception → error modal.
3. **OpenAPI validation**: the parsed object is checked for:
   - `openapi` field present and matching the pattern `3.(0|1).x` (only 3.0.x and 3.1.x accepted).
   - `info` object present, containing `title` (string) and `version` (string).
   - `paths` object present.
   - Each missing/invalid field produces a separate error entry in the form `"[field]: [message]"`.
4. **On success**: the specification is saved to local storage (triggering a new entry in the metadata index) and the editor opens with this specification.
5. **On all failures**: the error modal (§3.3) is shown. After dismissal the file picker resets so the same file can be re-selected.

### 5.3 Import of query parameters

When a valid file is loaded, any existing OpenAPI query parameters (parameters with `in: query`) inside operations are converted from OpenAPI format back to the internal `_queryParams` format so they can be edited natively in the Query Parameters panel.

---

## 6. Editor screen — layout

The editor screen uses a full-height flex column layout:

```
┌────────────────────────────────────────────────────────┐
│                      Header bar                        │
├────────────────────────────────────────────────────────┤
│          │                                             │
│  Left    │            Content panel                   │
│ Sidebar  │  (Info, Paths, or Schemas panel)            │
│          │                                             │
└────────────────────────────────────────────────────────┘
```

- The header has a fixed height above a flex row.
- The flex row fills all remaining height. The sidebar has a fixed width; the content panel fills the rest and scrolls independently.
- The sidebar and content panel do not scroll together.

---

## 7. Editor — header bar

A white bar with a bottom border. Always visible regardless of which content panel is active.

**Left side (left to right):**
1. **Back button** (arrow ←): returns to the welcome screen. The current specification object is cleared from state. Unsaved in-flight changes (within the 1-second debounce window) may be lost; the last auto-saved version remains in local storage.
2. **API name** (large bold text): reflects the current value of `specification.name`, updated live as the user edits it in the Info panel.
3. **API version** (small muted text below the name): `v[specVersion]`, also updated live.
4. **Edit API Information button** (pencil icon ✏️): navigates to the Info panel. The button turns blue when the Info panel is active; otherwise it is transparent with a slate hover state.

**Right side (left to right):**
1. **"⬇ Export" button** (green background): triggers the export (§16). Disabled (dimmed) and shows "⬇ Exporting..." while the export is running or while an auto-save is in progress.
2. **Saving indicator**: appears only while an auto-save is in progress. Shows an animated pulsing blue dot and the text "Saving..." on a pale blue background pill.

---

## 8. Editor — left sidebar

A dark (near-black) sidebar with white text. **Width: 32rem (512px).**

### 8.1 Header

Small label "SPECIFICATION" in uppercase, reduced opacity, at the top with a bottom border separator.

### 8.2 Filter input

A text input styled in dark slate. Placeholder: "Filter paths & schemas...".

- Filtering is **debounced at 300 ms** — the display list updates 300 ms after the user stops typing.
- Matching is **case-insensitive substring** applied to path names and schema names.
- When the input has a value, an **× clear button** appears at the right edge. Clicking it clears the filter immediately.
- When the filter produces no matches in either paths or schemas, a centred message "No matches found" appears.

### 8.3 Paths navigation item

A full-width button labelled "📍 Paths".

- When Paths is the active panel, the button has a blue background.
- When at least one path exists, a badge shows `[filteredCount]/[totalCount]`.
- Clicking navigates to the Paths panel **and resets it to list mode** (any open path edit form is closed). If a path is then selected from the sidebar list (§8.3.1), the edit form opens for that path.

#### 8.3.1 Paths accordion list

When the Paths panel is active, a filtered and alphabetically sorted list of paths appears below the Paths button, indented.

Each path item is a button showing:
- A collapse indicator: `▶` collapsed, `▼` expanded.
- The **path name** in monospace.
- A count badge with the number of defined HTTP methods.

**Selection**: clicking a path selects it (blue background), collapses all other paths, expands this one, and shows the Path Edit Form in the content panel. Only one path can be selected/expanded at a time.

**Expanded display**: when expanded, the path's defined HTTP methods appear as small coloured pill labels stacked below the path row, with a left border line for visual grouping (GET=blue, POST=green, PUT=yellow, DELETE=red, PATCH=purple, HEAD=gray, OPTIONS=indigo). These pills are display-only. Methods are shown in the fixed order: GET → POST → PUT → DELETE → PATCH → HEAD → OPTIONS.

### 8.4 Schemas navigation item

A full-width button labelled "📦 Schemas".

- When Schemas is the active panel, the button has a blue background.
- When at least one schema exists, a badge shows `[filteredCount]/[totalCount]`.
- When active, a filtered and alphabetically sorted list of schema names appears below, styled similarly to path items but non-clickable (display only).

---

## 9. Info panel

Activated by clicking the "📍 Paths" or "📦 Schemas" items (to navigate away), or by clicking the ✏️ header button's pair action (navigates to info), or initially.

### 9.1 Layout

White background, scrollable content area. Max-width ~42rem. Title "API Information" with a subtitle. A **saving banner** ("💾 Saving...") with a blue tint appears at the top of the form when auto-save is in progress.

### 9.2 Fields

| # | Label | Input type | Placeholder | Behaviour |
|---|---|---|---|---|
| 1 | Specification Name | Text input | "Enter specification name" | Free text. Edits immediately reflect in the header's API name. Auto-saves after 1 second. |
| 2 | Specification Version | Text input | "1.0.0" | Free text. Edits immediately reflect in the header's version. Auto-saves after 1 second. |
| 3 | OpenAPI Version | Read-only display | — | Always shows `3.0.0`. The surrounding element is not an input. |

All inputs have: visible border, rounded corners, blue ring on focus.

Changes to name/version also update `content.info.title` and `content.info.version` inside the OpenAPI content object to maintain consistency.

### 9.3 Info box

A static box at the bottom: "About OpenAPI 3.0" with a brief paragraph.

---

## 10. Paths panel

### 10.1 States

The Paths panel has three distinct visual states:

| State | Trigger | What is shown |
|---|---|---|
| **List view** | Default / navigating to Paths | List of all defined paths |
| **Create form view** | Clicking "+ Add Path" | Inline form (replaces list, no modal) |
| **Edit form view** | Clicking a path card or sidebar path item | The Path Edit Form (§11) |

Navigating away from the Paths panel and coming back **always resets to list view**.

### 10.2 List view

**Header**: "API Paths" title, subtitle, and a "+ Add Path" button (blue, top right). The button is hidden when the create form is shown.

**Empty state**: a dashed-border card with a 📍 icon, "No paths defined yet", hint to click Add Path.

**Paths list**: one card per path in insertion order (not sorted — unlike the sidebar). Each card is clickable and shows the path name in monospace and coloured method badges for defined operations.

### 10.3 Create form view

Shown inline after clicking "+ Add Path". Replaces the list area.

- Label "Path Name", monospace input, placeholder `/users`, hint text.
- Input is **auto-focused** when the form appears.
- **Enter key** in the input triggers path creation.
- **"Create Path" button** (blue, full width): disabled and grey when input is empty or whitespace only.
- **"Cancel" button** (slate text, full width): clears input, returns to list view.

On create (non-empty, trimmed path name):
1. The path is added to the specification with an empty operations object `{}`.
2. The path is immediately selected.
3. The view transitions to the Edit form view for the new path.

No path name validation is done here (no duplicate check, no format enforcement).

---

## 11. Path edit form

Shown inside the Paths panel content area (not a modal) when a path is selected.

### 11.1 Header

"Edit Path" (h2) and a **"✕" close button** (top right). Closing returns to list view and clears the selection.

### 11.2 Path name display with inline editing

The path name sits in a gray-background card box. In display mode:
- **"Path"** label above in small muted text.
- Path name in large, bold, monospace.
- **Pencil SVG icon button** on the right side. Clicking it enters edit mode.

**Edit mode**:
- The name is replaced by a styled text input (monospace, thick blue border).
- Input is **pre-filled and selected** (all text highlighted) so the user can type immediately.
- A green **✓** (confirm) button and a red **✕** (cancel) button appear to the right.
- Keyboard: **Enter** → save, **Escape** → cancel.
- Hint text below input: "Press Enter to save or Escape to cancel".

**Validation on save attempt**:
1. Empty/whitespace → error "Path name cannot be empty".
2. Invalid characters (not alphanumeric, `/`, `-`, `_`, `{`, `}`, `.`) → error "Path name contains invalid characters...".
3. Duplicate name (already exists in the spec, case-sensitive) → error "A path with the name '[name]' already exists. Please choose a different name."

**Error display**: a red panel with "⚠️ [message]" appears below the input. Input stays in edit mode.

**On success**:
- All operations under the old path key are moved to the new key.
- The old key is deleted.
- The `selectedPath` state updates to the new name.
- Edit mode exits, no error shown.

**No-op case**: if the trimmed new name is identical to the current name, edit mode exits silently with no save.

---

## 12. Path parameters

This section appears inside the Path Edit Form **between the path name card and the HTTP methods section**, but **only when the path string contains at least one template placeholder** (e.g., `{id}` in `/users/{id}`).

### 12.1 Auto-sync logic

Every time the path edit form renders (and on path name changes), the parameter list is synchronised:
- Placeholders extracted from the path name (the tokens inside `{…}`) define the canonical set.
- Parameters in the list that match a placeholder are **kept**.
- New placeholders not yet in the list are **automatically added** with type `string` and no description.
- Parameters in the list that have no matching placeholder become **orphaned** — they trigger a validation warning but are **not automatically removed**.
- If the sync would change the parameter list, `onPathParametersChange` is called to persist the update.

### 12.2 Validation errors

If validation errors exist, a red panel appears at the top of the parameters section listing each with "⚠️":
- `"Duplicate parameter names: [name1], [name2]"` — if two parameters share a name.
- `"Parameters not found in path: [name]. These parameters do not match any placeholders in the path."` — orphaned parameters.
- Path format errors from the format-validation utility.

These errors are **informational only** — they do not block saving or navigating.

### 12.3 Parameters table

A bordered rounded section with a dark header "Path Parameters".

**Column layout** (12-column grid):
- **Name** (3 cols): parameter name in `<code>` style, monospace, bold. Read-only.
- **Type** (2 cols): dropdown with options `string`, `number`, `integer`, `boolean`. Default `string`. Changes save immediately via auto-save.
- **Description** (7 cols): click-to-edit inline field.

**Description inline editing**:
- **Display**: shows description text, or "Click to add..." italic placeholder if empty. Clicking anywhere on the cell activates edit mode.
- **Edit**: text input with blue border, ✓ confirm button. Focus loss (blur), Enter, or Escape all exit edit mode and save the current value.

**Footer note**: "Path parameters are always required in OpenAPI specifications."

---

## 13. HTTP operations

Inside the Path Edit Form, after the path parameters section.

### 13.1 Method buttons row

A horizontal flex row of 7 equal-width buttons: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS (always in this order).

| State | Appearance | On click |
|---|---|---|
| **Not added** | Gray/slate background, method name + small "+" indicator | Opens "Add [METHOD] Operation?" confirm modal |
| **Added + not selected** | Colour-coded background (GET=blue, POST=green, PUT=yellow, DELETE=red, PATCH=purple, HEAD=gray, OPTIONS=indigo), method name + "✓" indicator | Selects the operation (shows detail panel below) |
| **Added + selected** | Same colour + visible ring highlight (ring + offset) | Deselects (hides detail panel) |

### 13.2 Add operation confirmation modal

- Blue header: "Add [METHOD] Operation?"
- Body: "Add a new [METHOD] operation to this path?"
- Buttons: **"No"** (cancel) / **"Yes"** (confirm).
- **On confirm**: operation is created with:
  - `summary`: `"[METHOD] operation"`
  - `description`: `""`
  - `tags`: `[]`
  - `responses`: `{ "200": { "description": "Successful response" } }`
  - The new method becomes automatically selected (operation detail panel opens).

### 13.3 Operation detail panel

A blue-tinted panel that appears below the method buttons when an added method is selected:
- **Method name** in very large bold text, coloured in the method's signature colour.
- **Summary** (shown if set): label + text.
- **Description** (shown if set): label + text.
- **"Delete [METHOD] Operation" button**: full-width, red, opens delete confirmation modal.
- **Query Parameters panel** (§14): rendered directly below the delete button.

### 13.4 Delete operation confirmation modal

- Red header: "Delete Operation"
- "Are you sure you want to delete the [METHOD] operation?"
- "⚠️ This action cannot be undone."
- Buttons: **"No"** (cancel) / **"Yes"** (confirm).
- On confirm: the operation key is deleted from the path object. The selected operation state becomes `null` (detail panel closes).

---

## 14. Query parameters

Embedded inside the operation detail panel (§13.3), below the delete button. Scoped per operation (each HTTP method has its own independent query parameter list).

### 14.1 Panel header

A bordered section with:
- "Query Parameters" label (bold, left).
- Method badge (colour-coded, e.g., "GET" in blue).
- Path name in small monospace (truncated if long).
- **"+ Add parameter"** button (blue text, right side).

### 14.2 Tree structure

Parameters are displayed as a **hierarchical tree** supporting nesting through `object` and `array` types.

**Empty state**: "No query parameters defined." followed by "Click '+ Add parameter' to get started."

**Tree node row** (per parameter):
- **Toggle button** (▶/▼): shown only for expandable nodes (object type, or array with object item type). The space is always reserved (invisible button) for non-expandable nodes to maintain alignment.
- **Parameter name**: monospace, bold.
- **Type badge**: coloured pill (string=emerald green, number/integer=sky blue, boolean=amber, object=violet, array=orange). Arrays display as "array of [itemType]".
- **"required" badge**: small red badge, only shown if `required: true`.
- **Action icons** (edit pencil, delete trash): hidden by default, fade in on row hover. Edit opens the Edit modal. Delete opens the delete confirmation.

**Indentation**: child nodes have 20px additional left padding per depth level.

**Expanded nodes show**:
- Their children (rendered recursively by the same tree rendering function).
- If no children exist: italic "No properties yet".
- Below children: an "Add property" link (for `object` parent) or "Add item property" link (for `array` with object items). Clicking opens the Add modal scoped to that parent node.

### 14.3 Supported parameter types

| Type | Is expandable | can have children | Child UI label |
|---|---|---|---|
| `string` | No | No | — |
| `number` | No | No | — |
| `integer` | No | No | — |
| `boolean` | No | No | — |
| `object` | Yes | Yes (properties) | "Add property" |
| `array` (item type = scalar) | No | No | — |
| `array` (item type = `object`) | Yes | Yes (item properties) | "Add item property" |

### 14.4 Add / Edit parameter modal

A centred overlay modal (max width ~32rem, max height 90vh, scrollable). Clicking the backdrop cancels.

**Header**: blue background. Title "Add parameter" or "Edit parameter".

**Fields** (shown conditionally):

| Field | Condition | Validation |
|---|---|---|
| Name | Always | Required. Must match `^[a-zA-Z_][a-zA-Z0-9_]*$`. Must be unique among siblings at the same tree level. |
| Type | Always | Dropdown: string, number, integer, boolean, object, array |
| Element type | Only when type = `array` | Dropdown: string, number, integer, boolean, object. When object is selected, a hint says to save and expand the node to define item properties. |
| Required | Always | Checkbox, default unchecked |
| Description | Always | Textarea, optional, no validation |
| Default value | When type is scalar (not object/array) | Type-validated: number/integer must be numeric; integer must be a whole number; boolean must be literal "true" or "false" |
| Pattern (regex) | Only when type = `string` | Validated by constructing a `RegExp` — error if it throws |
| Minimum | Only when type = `number` or `integer` | Must be a valid number; cannot be greater than Maximum |
| Maximum | Only when type = `number` or `integer` | Must be a valid number; cannot be less than Minimum |

**Keyboard**: pressing **Escape** cancels.

**On "Save"**:
- Validation runs first. If errors exist, they appear inline below each field with "⚠ [message]". The modal stays open.
- If valid: the parameter is added (or updated). The modal closes. When adding a child, the parent node auto-expands.

**On edit** (for expandable nodes): the node's existing children are preserved when the parent is updated (type changes that affect children — object changed to scalar — result in children being lost).

### 14.5 Delete confirmation

Clicking the delete icon opens a delete confirmation state. On confirm, the target parameter and all its nested children are removed.

### 14.6 Save behaviour

Query parameter changes use an **immediate save** (no debounce) to prevent loss of complex tree edits.

---

## 15. Schemas panel

### 15.1 Layout

White background, scrollable. Max-width ~42rem. Title "Schemas" and subtitle.

**"+ Add Schema" button** (blue, top right): rendered but clicking it has no functional effect. The schema creation feature is not yet implemented.

### 15.2 States

**Empty state**: a dashed-border card with 📦 icon, "No schemas defined yet", and a hint.

**Non-empty state**: a vertical list of schema cards. Each card shows the schema name in large monospace bold and the text "Schema definition" below. Cards are not clickable and cannot be edited.

Schemas can only enter the editor via the Load File flow (imported from existing YAML/JSON). The sidebar in the Schemas accordion also shows schema names for reference.

### 15.3 Info box

A static box at the bottom: "About Schemas" with an explanatory paragraph about reusable data models.

---

## 16. Export

### 16.1 Trigger and state

The "⬇ Export" button in the header. Disabled (opacity reduced, not-allowed cursor) when an export is in progress or an auto-save is in progress. Button label changes to "⬇ Exporting..." during the operation.

### 16.2 Output format

A **YAML file** is generated in-browser (no server) via:
1. Transform the internal content object to valid OpenAPI format (see §16.4).
2. Serialise to YAML string.
3. Create a Blob object with MIME type `application/x-yaml`.
4. Create a temporary object URL, attach it to a hidden `<a>` element, programmatically click it to trigger the download, then revoke the URL.

### 16.3 Filename

Derived from the specification name: special characters are sanitised to produce a filesystem-safe name with a `.yaml` extension. Falls back to `openapi.yaml` if the name is empty or produces no valid characters.

### 16.4 Content transformation (export only)

The following transforms happen to a deep copy of the content before serialisation:

1. **Path parameters** (`paths.[pathName].parameters` array): converted to OpenAPI format objects with `{ in: "path", name, required: true, schema: { type } }` plus an optional `description`. These are prepended to each operation's `parameters` array. The internal `parameters` array is then deleted from the path object.

2. **Query parameters** (`operation._queryParams` array): each internal query parameter is converted to `{ in: "query", name, [required], [description], schema: {...} }`. Schema structure:
   - Scalar: `{ type, [pattern], [minimum], [maximum], [default] }` (default value is coerced to the correct JS type).
   - Object: `{ type: "object", properties: { [propName]: schema, ... } }` (recursively built).
   - Array with scalar items: `{ type: "array", items: { type: itemType } }`.
   - Array with object items: `{ type: "array", items: { type: "object", properties: { ... } } }`.
   Query parameters are placed after path parameters in the `parameters` array. Any pre-existing non-conflicting parameters are placed last. The `_queryParams` field is deleted from the operation.

---

## 17. Auto-save

### 17.1 Mechanism

A **1-second debounced timer** is started whenever the specification state changes. If another change arrives before the timer fires, it resets. When the timer fires, the full specification JSON is written to local storage (both the metadata index and the per-spec entry).

**Exception**: changes to query parameters use an immediate save function that bypasses the debounce entirely.

### 17.2 Saving indicator

While any save is in progress, the header shows a pill-shaped indicator: an animated pulsing blue dot + "Saving..." text on a light blue background.

### 17.3 Error handling

If local storage throws (quota exceeded), the error is silently caught. The application does not currently surface a UI warning for this condition beyond logging to the console.

---

## 18. Global edge cases & constraints

| Scenario | Behaviour |
|---|---|
| Navigating back to welcome with unsaved changes | Last auto-saved version is retained. Changes within the 1-second debounce window since the last save may be lost. |
| Creating a spec with an empty path input (whitespace only) | "Create Path" button is disabled; no path is created. |
| Creating a path name that already exists | No validation at create time; the existing path is silently overwritten. |
| Renaming a path to an existing name | Blocked with a user-visible error message. |
| Renaming a path to the same name | Treated as a no-op; edit mode exits without saving. |
| Importing a 3.1.x file | Accepted, saved, and opened. The Info panel shows `3.0.0` (hardcoded display), but the actual `openAPIVersion` field retains the original version string. |
| Multiple browser tabs with the same app | No cross-tab synchronisation. The last tab to save wins. |
| Local storage quota exceeded | The save silently fails. No data corruption of other specs. |
| Path with 0 operations | Valid — empty path objects are allowed. The path card shows no badges. The path can be selected, renamed, and deleted. |
| Deleting an operation that has query parameters | The operation is removed from the path object, taking its `_queryParams` with it. |
| Path parameter type change | Immediately saved via auto-save debounce. No confirmation required. |
| Array query parameter with scalar item type | The parameter is NOT expandable. No "Add item property" option is shown. |
| Changing a query parameter type from object/array to scalar | Existing child properties are discarded on save. |
| Closing the query parameter modal via backdrop or Escape | All unsaved form state is discarded. No partial save occurs. |
| Sidebar filter while in Paths edit form | Filtering the sidebar does not close the edit form. The selected path may disappear from the sidebar list but the edit form remains open. |
| Exporting while auto-save is in progress | Export button is disabled. User must wait for save to complete. |
| Path with `{param}` but no corresponding parameter in list | The parameter is automatically added on edit form open with type `string`. |
| Removing `{param}` from path name by renaming | The old parameter becomes orphaned (validation warning shown). It is NOT automatically removed from the list. |
