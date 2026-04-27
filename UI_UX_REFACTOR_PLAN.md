# Stop Cri Studio UI/UX Refactor Plan

## 1. Purpose

This document translates the UI review into an implementation-ready plan for future agents.

Use this file as the working specification for improving:

- coherence
- UX
- UI

This is not a product requirements document for new features. It is a design and implementation plan for improving the existing application without changing its core behavior.

## 2. Context

The current app is a React 19 + TypeScript + Vite frontend-only OpenAPI editor. The product already has substantial functional coverage, but the interface has grown screen by screen. The result is a UI that is usable, but visually inconsistent and harder to navigate than necessary.

The main structural issue is not missing functionality. It is the absence of a shared interface system across the welcome flow, editor shell, dense data-entry panels, and modal flows.

## 3. Document Goals

Any agent implementing this plan should aim to:

1. make the product feel designed as one system rather than a set of independent screens
2. reduce cognitive load in the editor, especially in dense forms and nested data editors
3. standardize styling, states, and interaction patterns so future features inherit a coherent base
4. improve responsiveness and layout balance without rewriting the full application architecture
5. preserve current feature behavior unless this document explicitly calls for behavior changes

## 4. Product Constraints

These constraints should be preserved unless the user explicitly asks otherwise:

- The app remains offline-first and frontend-only.
- Existing core flows remain intact: welcome, create, load, load file, edit, autosave, export.
- Changes should be incremental and safe. Avoid broad rewrites unrelated to UI/UX improvements.
- Existing data model and storage behavior should remain stable.
- Existing functionality in path editing, schema editing, request bodies, responses, and query parameters should not regress.

## 5. Source Areas Reviewed

The recommendations in this document are based on the current implementation in:

- [src/App.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/App.tsx)
- [src/components/SpecificationEditor/SpecificationEditor.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/SpecificationEditor/SpecificationEditor.tsx)
- [src/components/Sidebar/Sidebar.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/Sidebar/Sidebar.tsx)
- [src/components/InfoPanel/InfoPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/InfoPanel/InfoPanel.tsx)
- [src/components/PathsPanel/PathsPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/PathsPanel/PathsPanel.tsx)
- [src/components/PathsPanel/PathEditForm.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/PathsPanel/PathEditForm.tsx)
- [src/components/QueryParameters/QueryParametersPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/QueryParameters/QueryParametersPanel.tsx)
- [src/components/RequestBody/RequestBodyPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/RequestBody/RequestBodyPanel.tsx)
- [src/components/Responses/ResponsesPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/Responses/ResponsesPanel.tsx)
- [src/components/SchemasPanel/SchemasPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/SchemasPanel/SchemasPanel.tsx)
- [src/components/LoadSpecificationModal.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/LoadSpecificationModal.tsx)
- [src/styles/globals.css](/Users/cristianogiulioni/Code/StopCriStudio/src/styles/globals.css)
- [tailwind.config.js](/Users/cristianogiulioni/Code/StopCriStudio/tailwind.config.js)

## 6. Current Problems To Solve

### 6.1 Coherence problems

- The same semantic objects use different visual treatments in different areas.
- HTTP method colors are inconsistent between the sidebar and the content panels.
- Focus, hover, and disabled states are not standardized.
- Buttons do not follow a reliable primary, secondary, danger hierarchy.
- The app mixes emoji, text symbols, and inline SVG for iconography.
- There is no meaningful token layer in Tailwind for surfaces, borders, text tiers, or state colors.

### 6.2 UX problems

- The editor shell gives too much width and emphasis to the sidebar.
- Dense editors expose too many decisions at once.
- Active context is not always clear: selected path, current view mode, schema-edit mode, saving state.
- Modal flows are repetitive and stack on top of each other without a shared pattern.
- Empty states and first-use guidance are weaker than they should be.
- Responsive behavior is limited, especially in the editor layout.

### 6.3 UI problems

- The welcome screen and the editor feel like different products.
- Surface hierarchy is weak because many panels share similar white-card styling.
- Typography is functional but generic, with insufficient hierarchy between titles, controls, labels, and code-like content.
- Hover and motion patterns are inconsistent.

## 7. Guiding Design Principles

All implementation should align with these principles:

### 7.1 One visual language

The welcome screen, editor shell, forms, and modal dialogs should feel related. Different sections can have different density, but not different design identities.

### 7.2 Clear hierarchy

Users should be able to tell at a glance:

- where they are
- what object is selected
- what action is primary
- whether work is saved
- what the next likely step is

### 7.3 Progressive disclosure

Nested editors should not confront users with every possible control at once. Advanced detail should be exposed when needed.

### 7.4 Consistency over novelty

The current app does not need a fashionable redesign. It needs a disciplined, repeatable interaction system.

### 7.5 Safe iteration

Prioritize changes that can be landed incrementally with low feature risk.

## 8. Implementation Rules For Other Agents

Agents executing this plan should follow these rules:

1. Do not redesign business logic unless needed to support the UI structure.
2. Prefer shared styling primitives or helper classes over repeated Tailwind class strings.
3. Preserve accessibility basics: visible focus, semantic labels, sufficient contrast, keyboard operability.
4. Avoid introducing a full component library unless the user explicitly requests it.
5. Avoid changing the storage model, export format, or specification data flow.
6. If a UI change affects behavior, document the behavior change in the final response.
7. Validate with `pnpm type-check` and `pnpm lint` after meaningful edits.

## 9. Design System Specification

This section defines the target shared system that should emerge from the refactor.

### 9.0 Implementation note

The target is not a full component library. The target is a stable internal UI foundation with:

- named tokens
- predictable variants
- consistent state behavior
- limited but explicit reusable patterns

If an agent introduces helper utilities or shared presentational wrappers, they should remain small and local to this app.

### 9.1 Tokens to define

Add a lightweight token layer in [tailwind.config.js](/Users/cristianogiulioni/Code/StopCriStudio/tailwind.config.js) and, where useful, supporting CSS variables in [src/styles/globals.css](/Users/cristianogiulioni/Code/StopCriStudio/src/styles/globals.css).

Minimum token categories:

- app background
- panel background
- elevated surface background
- subtle surface background
- border default
- border strong
- text primary
- text secondary
- text muted
- primary action
- primary action hover
- danger action
- danger action hover
- success status
- warning status
- focus ring
- sidebar background
- sidebar surface
- sidebar border

### 9.1.1 Required token names

Unless there is a strong technical reason to differ, use these semantic names in Tailwind theme extension or CSS variables:

#### Color tokens

- `app.bg`
- `app.bgAccent`
- `surface.base`
- `surface.subtle`
- `surface.raised`
- `surface.inverse`
- `border.default`
- `border.strong`
- `border.inverse`
- `text.primary`
- `text.secondary`
- `text.muted`
- `text.inverse`
- `action.primary`
- `action.primaryHover`
- `action.secondary`
- `action.secondaryHover`
- `action.danger`
- `action.dangerHover`
- `state.success`
- `state.successBg`
- `state.warning`
- `state.warningBg`
- `state.error`
- `state.errorBg`
- `state.info`
- `state.infoBg`
- `focus.ring`
- `sidebar.bg`
- `sidebar.surface`
- `sidebar.border`
- `sidebar.text`
- `sidebar.textMuted`

#### Radius tokens

- `radius.sm`
- `radius.md`
- `radius.lg`
- `radius.xl`

#### Shadow tokens

- `shadow.panel`
- `shadow.raised`
- `shadow.modal`

#### Spacing intent tokens

If spacing is represented in CSS variables or helper classes, standardize at least:

- `space.panelX`
- `space.panelY`
- `space.sectionGap`
- `space.controlGap`

### 9.1.2 HTTP method token map

HTTP methods must use one mapping across sidebar, path editor, badges, and lists.

Recommended semantic mapping:

| Method | Text token | Background token | Border token |
|---|---|---|---|
| GET | blue-800 | blue-100 | blue-200 |
| POST | green-800 | green-100 | green-200 |
| PUT | amber-800 | amber-100 | amber-200 |
| DELETE | red-800 | red-100 | red-200 |
| PATCH | violet-800 | violet-100 | violet-200 |
| HEAD | slate-800 | slate-200 | slate-300 |
| OPTIONS | indigo-800 | indigo-100 | indigo-200 |

Rule:

- use one badge style everywhere
- if stronger emphasis is needed, change border or weight first, not the entire color language

### 9.2 Typography rules

Typography should be standardized into a small scale:

- page title
- panel title
- section title
- field label
- body text
- help text
- monospace technical text

Requirements:

- Titles should have consistent spacing and weight across panels.
- Labels should be visually distinct from help text.
- Paths, schema names, refs, and other technical identifiers should use monospace consistently.

### 9.2.1 Type scale contract

Unless existing constraints require adjustment, use this scale:

| Usage | Tailwind target |
|---|---|
| page title | `text-3xl` or `text-4xl`, `font-bold` |
| panel title | `text-2xl`, `font-bold` |
| section title | `text-lg`, `font-semibold` |
| control label | `text-sm`, `font-semibold` |
| body text | `text-sm` or `text-base` |
| help text | `text-xs` or `text-sm`, muted |
| technical monospace | `text-sm`, `font-mono` |

Rule:

- do not invent one-off title sizes unless the screen is a special marketing surface

### 9.3 Button system

Define at least these button variants:

- primary
- secondary
- tertiary or ghost
- danger
- icon-only

Requirements:

- Primary buttons should always represent the most important action in a local context.
- Destructive actions should use the danger variant only.
- Icon-only buttons should have consistent size, hover, focus, and disabled states.
- Disabled buttons should have an explicit disabled treatment, not only a color shift.

### 9.3.1 Button contract

Agents may implement this as helper functions, shared class constants, or lightweight wrapper components. Whatever form is chosen, these variants should exist with stable semantics:

| Variant | Purpose |
|---|---|
| `primary` | create, confirm, continue, save, export |
| `secondary` | neutral companion action in the same area |
| `ghost` | low-emphasis inline action |
| `danger` | destructive action |
| `icon` | icon-only action with accessible label |

Suggested API if wrapper components are introduced:

```ts
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
type ButtonSize = 'sm' | 'md' | 'lg'

interface AppButtonProps {
	variant?: ButtonVariant
	size?: ButtonSize
	disabled?: boolean
	loading?: boolean
	leadingIcon?: React.ReactNode
	trailingIcon?: React.ReactNode
}
```

Rules:

- `loading` must preserve width as much as possible to reduce layout shift
- icon-only buttons must require `aria-label`
- destructive confirmation dialogs should not place danger action first in tab order unless there is a deliberate accessibility reason

### 9.4 Input system

Standardize:

- text input
- textarea
- select
- checkbox
- validation state
- read-only state
- help text

Requirements:

- Focus treatment should be shared across light and dark surfaces.
- Invalid state should be visually obvious and consistent.
- Sidebar filter inputs should still belong to the same system even if they use darker backgrounds.

### 9.4.1 Input contract

If wrappers are introduced, keep them small and presentation-focused.

Suggested API shape:

```ts
interface FieldShellProps {
	label?: string
	helpText?: string
	error?: string | null
	required?: boolean
	htmlFor?: string
}
```

Standard behaviors:

- label above control
- help text below control when present
- error text replaces or sits below help text consistently
- invalid fields use border, background, and text support, not border-only signaling
- read-only fields should visually differ from disabled fields

### 9.4.2 Focus behavior

Focus styles should follow one rule:

- default border remains visible
- focus ring uses one semantic ring color
- ring thickness should be consistent across buttons, inputs, and interactive cards

Do not mix `focus:ring-2` and `focus:ring-4` arbitrarily.

### 9.5 Badge and tag system

Define consistent badge treatments for:

- HTTP methods
- parameter types
- status labels like required or saving
- count chips

Requirements:

- HTTP method color mappings must be consistent everywhere in the app.
- The same method should not appear as a dark solid badge in one place and a light pastel badge in another unless there is a deliberate hierarchy rule.

### 9.5.1 Badge contract

Suggested stable variants:

- `method`
- `type`
- `status`
- `count`

Suggested API if implemented as a component:

```ts
interface BadgeProps {
	variant: 'method' | 'type' | 'status' | 'count'
	tone?: string
}
```

Rules:

- count badges should not look like status badges
- required or saving labels should be status badges, not repurposed method badges

### 9.6 Icon system

Replace the mixed emoji and text-symbol approach with one unified icon strategy.

Recommended approach:

- use inline SVG components or a lightweight icon package if approved by the user
- keep icons visually simple and consistent in stroke or fill style

Targets for cleanup include:

- welcome cards
- back button
- export button
- edit buttons
- close buttons
- sidebar section icons

### 9.6.1 Recommended icon set and fallback

Preferred order:

1. existing inline SVG components if kept consistent
2. a lightweight icon package already acceptable to the user

Do not:

- mix emoji with SVG in the same primary surfaces
- use bare text arrows as production iconography when equivalent icons exist

## 9.7 Shared UI primitives

If agents decide to add reusable presentational components, keep them limited to this set unless there is a strong reason to expand:

- `AppButton`
- `AppIconButton`
- `FieldShell`
- `TextInput`
- `TextArea`
- `SelectInput`
- `Badge`
- `SectionHeader`
- `EmptyState`
- `ModalShell`
- `PanelShell`

These do not all need to be separate files. The intent is to standardize behavior, not force abstraction.

## 9.8 Modal specification

All modals should converge on one shell contract.

### 9.8.1 Modal shell requirements

- full-screen backdrop
- centered dialog
- consistent max-width variants
- internal structure: header, body, footer
- visible close affordance where appropriate
- escape closes where safe
- click-outside closes only when safe for that flow

### 9.8.2 Modal size variants

Suggested stable sizes:

- `sm`: confirmations
- `md`: forms with a few controls
- `lg`: complex editors
- `xl`: schema or request-body heavy flows

### 9.8.3 Footer action order

Default footer order on left-to-right layouts:

- low-emphasis dismiss or cancel action
- primary or danger action on the far right

### 9.8.4 Modal API suggestion

```ts
type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface ModalShellProps {
	open: boolean
	title: string
	size?: ModalSize
	onClose: () => void
	closeOnBackdrop?: boolean
	footer?: React.ReactNode
}
```

## 9.9 Panel specification

The editor should use a small set of shell patterns for panel consistency.

### 9.9.1 Panel shell requirements

- consistent internal horizontal padding
- consistent top title block spacing
- content sections separated by repeatable spacing values
- optional sticky action row only where it clearly reduces friction

### 9.9.2 Section header contract

Suggested structure:

- title
- optional description
- optional right-aligned action area

This should be used in Info, Paths, Schemas, and dense editor subsections instead of each section inventing its own title row.

## 9.10 Empty state specification

Empty states should not be plain text placeholders unless there is a good reason.

Minimum structure:

- concise title
- one-sentence explanation
- optional action button if the empty state has a clear next step

Use cases:

- no saved specifications
- no paths yet
- no schemas yet
- no search matches
- no selected path or schema

## 9.11 Save-state specification

The app currently uses distributed saving indicators. Move toward a shared save-state language.

### Required save states

- idle
- saving
- saved recently
- error if save ever becomes observable as failed

### Rules

- saving state should be visible in the editor shell
- panel-level duplicates should only exist if they add local clarity
- status treatment should use the shared badge or status system

## 10. Execution Plan

This plan is intentionally phased so agents can implement the work without creating unnecessary merge conflicts.

### Phase 1: Foundations

#### Goal

Create the shared styling and interaction baseline.

#### Scope

- [tailwind.config.js](/Users/cristianogiulioni/Code/StopCriStudio/tailwind.config.js)
- [src/styles/globals.css](/Users/cristianogiulioni/Code/StopCriStudio/src/styles/globals.css)
- any small shared utility or style helper added under [src](/Users/cristianogiulioni/Code/StopCriStudio/src)

#### Work

- add semantic color and surface tokens
- define reusable class patterns or helper abstractions for buttons, inputs, chips, and section headers
- normalize focus ring behavior
- normalize disabled state behavior
- establish the icon direction

#### Engineering output expected

- updated theme tokens in [tailwind.config.js](/Users/cristianogiulioni/Code/StopCriStudio/tailwind.config.js)
- supporting global utility classes or variables in [src/styles/globals.css](/Users/cristianogiulioni/Code/StopCriStudio/src/styles/globals.css)
- optional shared UI file or style helper if needed

#### Deliverables

- consistent tokens available to all components
- at least one shared pattern for buttons and one for inputs
- no new component should need ad hoc focus or disabled styling

#### Acceptance criteria

- Button and input styles can be reused without copy-pasting unrelated Tailwind strings.
- Focus states are visually consistent across the app.
- HTTP method badges have a single visual system.

### Phase 2: Core Controls And High-Level Consistency

#### Goal

Apply the new system to the welcome flow and shared controls so the product starts feeling coherent immediately.

#### Scope

- [src/App.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/App.tsx)
- [src/components/LoadSpecificationModal.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/LoadSpecificationModal.tsx)
- [src/components/InfoPanel/InfoPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/InfoPanel/InfoPanel.tsx)

#### Work

- restyle the welcome cards so they align with the editor visual language
- replace emoji-based or text-symbol iconography with the unified icon system
- standardize card, modal, and button structure
- improve empty states and disabled states

#### Engineering output expected

- updated [src/App.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/App.tsx)
- updated [src/components/LoadSpecificationModal.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/LoadSpecificationModal.tsx)
- updated [src/components/InfoPanel/InfoPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/InfoPanel/InfoPanel.tsx)

#### Deliverables

- welcome and load flows share the same UI vocabulary as the editor
- action hierarchy becomes immediately clearer

#### Acceptance criteria

- The welcome screen and modal dialogs no longer feel visually disconnected from the editor.
- The primary action on each screen is visually obvious.

### Phase 3: Editor Shell Refactor

#### Goal

Improve navigation clarity and rebalance the screen.

#### Scope

- [src/components/SpecificationEditor/SpecificationEditor.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/SpecificationEditor/SpecificationEditor.tsx)
- [src/components/Sidebar/Sidebar.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/Sidebar/Sidebar.tsx)

#### Work

- reduce sidebar visual dominance
- revisit sidebar width and internal spacing
- make active item and selected object more obvious
- improve save-state visibility and placement
- align header action styling with the design system

#### Engineering output expected

- updated [src/components/SpecificationEditor/SpecificationEditor.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/SpecificationEditor/SpecificationEditor.tsx)
- updated [src/components/Sidebar/Sidebar.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/Sidebar/Sidebar.tsx)

#### Deliverables

- more balanced editor shell
- clearer orientation for current panel and selected object

#### Acceptance criteria

- The sidebar no longer feels disproportionately heavy on standard laptop widths.
- The user can identify the active panel, selected path or schema, and save state without scanning multiple areas.

### Phase 4: Paths Workflow Simplification

#### Goal

Reduce friction in the most central editing flow.

#### Scope

- [src/components/PathsPanel/PathsPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/PathsPanel/PathsPanel.tsx)
- [src/components/PathsPanel/PathEditForm.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/PathsPanel/PathEditForm.tsx)

#### Work

- make list mode versus edit mode easier to understand
- strengthen the selected-path treatment
- improve section hierarchy within the path editor
- reduce clutter around operation management
- make destructive actions more explicit and localized

#### Engineering output expected

- updated [src/components/PathsPanel/PathsPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/PathsPanel/PathsPanel.tsx)
- updated [src/components/PathsPanel/PathEditForm.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/PathsPanel/PathEditForm.tsx)

#### Deliverables

- cleaner path selection and editing workflow
- clearer relationship between path, operations, parameters, request body, responses, and security

#### Acceptance criteria

- A user can clearly tell whether they are browsing paths or editing a selected path.
- The path editor has a visible primary action structure and better content grouping.

### Phase 5: Dense Editor UX Improvements

#### Goal

Make nested parameter and schema editing easier to read and reason about.

#### Scope

- [src/components/QueryParameters/QueryParametersPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/QueryParameters/QueryParametersPanel.tsx)
- [src/components/RequestBody/RequestBodyPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/RequestBody/RequestBodyPanel.tsx)
- [src/components/Responses/ResponsesPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/Responses/ResponsesPanel.tsx)

#### Work

- improve visual grouping in tree editors
- reduce simultaneous decisions in edit modals
- clarify object versus array versus scalar editing states
- improve readability of nested structures and references
- standardize validation and inline error presentation

#### Engineering output expected

- updated [src/components/QueryParameters/QueryParametersPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/QueryParameters/QueryParametersPanel.tsx)
- updated [src/components/RequestBody/RequestBodyPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/RequestBody/RequestBodyPanel.tsx)
- updated [src/components/Responses/ResponsesPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/Responses/ResponsesPanel.tsx)

#### Deliverables

- tree-based editors with stronger hierarchy and lower visual noise
- more consistent modal forms across data editors

#### Acceptance criteria

- Nested structures are easier to scan without changing the underlying data model.
- Error and help states look and behave consistently across these panels.

### Phase 6: Schema Management UX

#### Goal

Make schema editing feel like one coherent workflow.

#### Scope

- [src/components/SchemasPanel/SchemasPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/SchemasPanel/SchemasPanel.tsx)

#### Work

- improve create, edit, rename, and usage-review flows
- make rename strategy decisions easier to understand
- align schema modals with the broader modal system
- improve list readability and selected-schema treatment

#### Engineering output expected

- updated [src/components/SchemasPanel/SchemasPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/SchemasPanel/SchemasPanel.tsx)

#### Deliverables

- more understandable schema lifecycle flow
- lower friction when renaming or inspecting schema usage

#### Acceptance criteria

- The schema panel communicates create, edit, usage, and rename decisions clearly.
- Schema-related overlays no longer feel like separate UI systems.

### Phase 7: Modal Unification

#### Goal

Create one modal language across the app.

#### Scope

- all confirmation and edit modals in the files above

#### Work

- standardize header structure, body spacing, button order, overlay styling, and close behavior
- standardize destructive confirmations
- review z-index layering and nested modal behavior

#### Deliverables

- one shared modal pattern
- cleaner destructive confirmations

#### Acceptance criteria

- All modals share consistent spacing, action order, and tone.
- Nested modal situations remain understandable and visually stable.

### Phase 8: Responsive Pass

#### Goal

Make the app usable on narrower screens and smaller laptops.

#### Scope

- welcome screen
- editor shell
- major modal layouts
- path and schema panels where layout assumptions are wide-screen specific

#### Work

- reduce fixed layout assumptions
- make sidebar behavior adapt to narrower widths
- ensure dense forms do not become unusable on small screens
- ensure button rows and modal footers wrap cleanly

#### Deliverables

- improved usability below large desktop sizes

#### Acceptance criteria

- The editor remains functional at common laptop widths without severe crowding.
- Major flows remain operable on tablet-ish widths, even if not optimized for phone use.

### Phase 9: Polish Pass

#### Goal

Finish the system with refinement rather than new structure.

#### Work

- refine spacing rhythm
- refine typographic contrast
- align micro-interactions and transitions
- ensure empty states and helper text feel intentional
- clean up low-signal visual noise

#### Acceptance criteria

- The app feels cohesive end to end.
- No major area still looks like legacy styling next to newly refactored sections.

## 11. Priority Order

If the full plan cannot be done at once, use this order:

1. Foundations
2. Core controls and consistency
3. Editor shell refactor
4. Paths workflow simplification
5. Dense editor UX improvements
6. Schema management UX
7. Modal unification
8. Responsive pass
9. Polish pass

## 12. Suggested Work Breakdown For Agents

To minimize conflicts, agents should claim work in slices like these:

### Slice A

- token system
- shared button and input styling
- icon system setup

Target files:

- [tailwind.config.js](/Users/cristianogiulioni/Code/StopCriStudio/tailwind.config.js)
- [src/styles/globals.css](/Users/cristianogiulioni/Code/StopCriStudio/src/styles/globals.css)
- any newly introduced shared presentational helpers

### Slice B

- welcome screen
- load modal
- info panel

Target files:

- [src/App.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/App.tsx)
- [src/components/LoadSpecificationModal.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/LoadSpecificationModal.tsx)
- [src/components/InfoPanel/InfoPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/InfoPanel/InfoPanel.tsx)

### Slice C

- specification editor header
- sidebar
- save-state presentation

Target files:

- [src/components/SpecificationEditor/SpecificationEditor.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/SpecificationEditor/SpecificationEditor.tsx)
- [src/components/Sidebar/Sidebar.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/Sidebar/Sidebar.tsx)

### Slice D

- paths panel
- path edit form

Target files:

- [src/components/PathsPanel/PathsPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/PathsPanel/PathsPanel.tsx)
- [src/components/PathsPanel/PathEditForm.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/PathsPanel/PathEditForm.tsx)

### Slice E

- query parameters panel
- request body panel
- responses panel

Target files:

- [src/components/QueryParameters/QueryParametersPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/QueryParameters/QueryParametersPanel.tsx)
- [src/components/RequestBody/RequestBodyPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/RequestBody/RequestBodyPanel.tsx)
- [src/components/Responses/ResponsesPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/Responses/ResponsesPanel.tsx)

### Slice F

- schemas panel
- schema rename strategy flow

Target files:

- [src/components/SchemasPanel/SchemasPanel.tsx](/Users/cristianogiulioni/Code/StopCriStudio/src/components/SchemasPanel/SchemasPanel.tsx)

### Slice G

- modal normalization across app
- responsive cleanup
- final polish

Target files:

- shared modal implementations if introduced
- all touched screens for cleanup and consistency pass

## 12.1 Recommended branch and sequencing discipline

If multiple agents work concurrently:

1. Slice A should land first.
2. Slice B and Slice C can proceed once tokens and primitive direction are stable.
3. Slice D, E, and F should branch after the shared primitives exist.
4. Slice G should run last as an integration pass, not as the first styling pass.

## 13. Risks And Watchouts

Agents should pay attention to these risks:

- Shared style refactors can unintentionally change behavior if they are coupled too tightly to component logic.
- The path editor and dense nested editors have high regression risk because they contain complex state and modal flows.
- Replacing iconography should not remove accessible labels.
- Modal standardization should not break nested confirmations or current close behavior.
- Responsive work must not make the editor harder to use on desktop in an attempt to support smaller widths.

## 14. Validation Checklist

After any meaningful implementation, validate these items:

### Functional validation

- create a new specification
- load a saved specification
- delete a saved specification
- import a valid file
- trigger an invalid file error
- edit specification info
- navigate between info, paths, and schemas
- create a path
- select a path
- add and delete operations
- edit query parameters
- edit request body fields
- edit responses
- create and edit schemas
- export a specification
- verify autosave feedback remains understandable

### Quality validation

- run `pnpm type-check`
- run `pnpm lint`
- visually inspect active, hover, focus, disabled, error, and empty states
- verify keyboard access for major controls and dialogs

### Contract validation

- method badges use one consistent mapping across the app
- iconography no longer mixes emoji and SVG on primary product surfaces
- modals share one action order and shell structure
- input and button states are reusable rather than redefined locally in each file
- save-state treatment is understandable from the editor shell alone

## 15. Definition Of Done

This initiative should be considered complete only when:

1. the app has a shared visual system rather than repeated local styling decisions
2. the editor shell is more balanced and easier to navigate
3. dense editors are easier to scan and operate
4. modal behavior is standardized
5. the interface remains functionally equivalent unless behavior changes were intentional and documented
6. major flows pass lint and type-check validation

## 16. Out Of Scope Unless Requested

The following are not part of this plan unless explicitly requested:

- changing the application architecture to a different framework
- adding a backend or sync service
- redesigning the OpenAPI data model
- implementing a complete design system package external to the app
- adding unrelated new product features

## 17. Recommended Next Step

The best first implementation step is Phase 1 plus the start of Phase 2:

- define tokens
- standardize buttons and inputs
- align the welcome and modal flows with that system

This gives immediate visible improvement while creating a foundation for the more complex editor refactors.

## 18. Implementation Handoff Prompt Template

Use this template when handing a slice to another agent:

```md
Implement Slice [X] from UI_UX_REFACTOR_PLAN.md.

Requirements:
- Follow the token and component contracts in sections 9 through 12.
- Preserve current behavior unless a change is necessary for clarity.
- Keep changes scoped to the listed target files.
- Reuse shared primitives if they already exist; do not duplicate styling patterns.
- Run pnpm type-check and pnpm lint after edits.

Report back with:
1. files changed
2. any intentional behavior changes
3. validation results
4. remaining follow-up needed for the next slice
```