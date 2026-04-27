# PRD: Query Parameters Management

## 1. Product overview

### 1.1 Document title and version

- PRD: Query Parameters Management
- Version: 1.0
- Timeline: Phase 2 of Stop Cri Studio
- Last updated: April 3, 2026

### 1.2 Product summary

Query Parameters Management enables technical users to define complex query parameters for individual API operations. This feature extends the existing path parameters capability to support query string parameters, which often require more sophisticated type definitions including nested objects and arrays.

The feature provides a tree-based interface for defining query parameter structures that can include primitive types (string, number, integer, boolean), objects with nested properties (recursively), and arrays with typed elements. Each query parameter is specific to a particular HTTP operation (GET /users, POST /users, etc.) and includes support for validation constraints, descriptions, and default values.

## 2. Goals

### 2.1 Business goals

- Enable users to comprehensively document complex query parameter structures in APIs
- Provide an intuitive interface for defining recursive object and array types
- Maintain consistency with existing path parameters implementation
- Improve API documentation completeness and accuracy

### 2.2 User goals

- Quickly add and modify query parameters for API operations
- Define complex object structures with nested properties without manual code editing
- Understand parameter types and constraints at a glance through visual hierarchy
- Export properly formatted query parameters in OpenAPI YAML

### 2.3 Non-goals

- Global, reusable parameter definitions (deferred to future phase)
- Cross-operation parameter copying or templating (future consideration)
- Deprecation tracking or versioning of parameters (out of scope)
- Parameter import/export as separate files (future phase)

## 3. User personas

### 3.1 Key user types

- Backend API developers documenting query parameters
- API architects designing complex filtering/search operations
- Technical product managers defining API contracts
- Senior engineers requiring precise type definitions

### 3.2 Basic persona details

- **Backend Developer**: 3+ years of API experience, familiar with JSON/OpenAPI structures, needs to rapidly document query parameters with complex types. Works solo or in small teams.
- **API Architect**: Senior technical user, deeply familiar with API standards, requires precise control over parameter types and constraints. Creates specifications that serve as team standards.

### 3.3 Role-based access

- **End User**: Full read/write access to query parameters for operations in personally created specifications. No multi-user access control required at this phase.

## 4. Functional requirements

### 4.1 Query parameter creation and management (Priority: Critical)

- Users can add query parameters to individual API operations (specific method + path combination)
- Query parameters are managed at the operation level: GET /users, POST /users might have different query parameters
- Each query parameter has a unique name within the operation's query parameters
- Users can add, edit, and remove query parameters without warnings or confirmations
- Query parameters are automatically persisted to local storage on any change

### 4.2 Parameter type system (Priority: Critical)

- Base types supported: `string`, `number`, `integer`, `boolean`
- Complex types supported: `object` (with nested properties), `array` (with element types)
- Users can define object structures with any number of nested properties
- Nested properties can be of any type: base types, objects, or arrays (recursive support)
- Array types require definition of element type (single type for all elements)
- If array element type is object, user defines the object structure inline

### 4.3 Validation constraints (Priority: High)

- **Required field**: User can mark parameters as required or optional (defaults to optional)
- **Minimum value**: For number/integer types, user can specify minimum value
- **Maximum value**: For number/integer types, user can specify maximum value
- **Pattern**: For string types, user can specify regex pattern for validation
- **Default value**: User can define a default value matching the parameter type
- **Description**: User can add description/documentation for any parameter or nested property

### 4.4 Tree-based UI interface (Priority: Critical)

- Tree structure displays query parameters as a hierarchical list
- Each parameter appears as a root-level tree node
- Primitive type parameters (string, number, etc.) display as leaf nodes with type badge
- Object type parameters display as expandable/collapsible tree nodes
- Object properties display as child nodes within their parent object node
- Array type parameters display with type indicator showing element type (e.g., "array of string")
- Visual distinction between different node types (parameter, object property, array element type)
- Expand/collapse toggle for object nodes to hide/show nested properties
- Each node displays parameter name, type badge, and required indicator (*)
- Inline action buttons for each node: edit, delete
- Clear visual hierarchy with indentation showing nesting depth

### 4.5 Parameter editing (Priority: High)

- Clicking "edit" on any node opens a context-appropriate editing panel
- Editing a primitive type parameter shows: name, type selector, required toggle, constraints (min/max/pattern as applicable), default value, description
- Editing an object property shows: property name, type selector, required toggle, constraints (if applicable), default value, description
- Editing an array type shows: element type selector, array-level description
- Changes in the editing panel are reflected immediately in the tree
- Validation provides real-time feedback for invalid constraint values

### 4.6 Adding properties to objects (Priority: High)

- When an object-type parameter is selected/expanded, an "Add property" button appears
- Clicking "Add property" allows user to define a new nested property
- New property creation modal/form includes: property name, type selection, required flag, constraints
- New properties are added to the object and appear as child nodes in the tree
- User can immediately edit the new property or add more properties

### 4.7 Adding elements to arrays (Priority: High)

- When array element type is object, an "Edit element structure" button appears
- Clicking this button reveals the object structure for array elements
- User can add properties to the array element object structure using "Add property"
- Array element properties behave identically to regular object properties

### 4.8 Parameter validation and error handling (Priority: High)

- Duplicate parameter names within the same operation trigger validation error
- Parameter names follow valid identifier rules (alphanumeric, underscores, hyphens)
- Invalid characters in names show clear error message
- Constraint values are validated: min < max for number types, valid regex for patterns
- Type mismatches between parameter type and default value show error
- All validation errors are displayed inline near the problematic field

### 4.9 Integration with operation editing (Priority: High)

- Query parameters editing interface is accessible from the operation editing view
- Query parameters section appears in the operation form between path parameters and request body
- "Manage query parameters" button or tab opens the tree-based parameter editor
- Current operation context is clear to the user (showing path and method)
- Navigation back to operation list from query parameter editor is seamless

### 4.10 Data persistence and export (Priority: High)

- Query parameters are stored in local storage with operation-specific keys
- Query parameters are included in YAML export following OpenAPI 3.0 specification format
- Exported query parameters include all constraints, descriptions, and type information
- Complex types (objects with nested properties) are properly formatted in YAML schema format
- Array types with object elements create proper array schema in YAML

## 5. User experience

### 5.1 Entry points & first-time user flow

- User navigates to an operation (GET /users, for example) in the operation editor
- User sees a "Query parameters" section in the operation form
- User clicks to expand/open the query parameters editor
- Tree interface displays "No query parameters" message if empty
- User clicks "Add parameter" button to create first query parameter

### 5.2 Core experience

- **Adding a simple parameter**: User clicks "Add parameter", enters name and selects type (e.g., string), sets required flag, then clicks save. Parameter appears in tree with appropriate type badge.

- **Adding a complex object parameter**: User adds parameter, selects type "object", then uses "Add property" to define nested properties. Each property is defined individually. Tree shows expandable object node.

- **Adding an array parameter**: User adds parameter, selects type "array", then selects element type (e.g., "string" or "object"). If object, user defines element properties. Tree shows array indicator.

- **Editing constraints**: User clicks edit on any parameter, adjusts min/max/pattern/default values in the editing panel, sees real-time validation feedback. Changes apply immediately.

- **Removing parameters**: User clicks delete icon on any node, parameter/property is immediately removed with no confirmation required.

### 5.3 Advanced features & edge cases

- **Recursive object definitions**: User defines an object with properties that are themselves objects. Can nest multiple levels deep without documented limit.

- **Array of objects**: User defines array, selects object as element type, then defines object structure. Objects can have array properties, creating complex nested structures.

- **Constraint interdependencies**: If minimum but no maximum is set, validation allows. If pattern is set for string, pattern is honored in generated schema.

- **Empty object/array**: User can define object with no properties or array without specifying default element properties (uses empty structure).

### 5.4 UI/UX highlights

- Tree expands/collapses smoothly with clear visual feedback
- Type badges use consistent color coding (string = blue, number = orange, object = purple, array = green, etc.)
- Required field indicator (*) appears beside required parameters
- Editing panel appears in side view or modal, not replacing the tree view
- Undo/redo functionality integrated with each edit action (if available in parent editor)
- Responsive layout works on desktop and tablet screens

## 6. Narrative

A technical user is documenting a search API endpoint: GET /products. The endpoint accepts complex query parameters including simple filters (category: string, minPrice: number), a complex sorting object (with field and order properties), and optional tags array (string elements). 

The user opens the query parameters editor for this operation. They add four parameters:
1. Category (string, required)
2. Min price (number, optional, minimum=0)
3. Sort (object, optional) with nested properties: field (string, required), order (string, optional)
4. Tags (array, optional, element type: string)

For each parameter, they provide descriptions and set constraints. The tree view shows all parameters hierarchically, with the sort object expandable to show its nested properties. When complete, exporting the specification generates proper OpenAPI schema with all type information intact, enabling other developers to use the API documentation effectively.

## 7. Success metrics

### 7.1 User-centric metrics

- Users can define complex query parameters (containing objects/arrays) in less than 3 minutes per operation
- Tree interface is perceived as intuitive by 80%+ of technical users in testing
- Users make fewer mistakes when defining complex types with visual tree vs. direct code entry

### 7.2 Business metrics

- Specification completeness increases: 100% of operations with query parameters have documented parameters
- Feature adoption: users engaging with query parameter editor for 50%+ of their operations
- Reduced question/support requests about query parameter documentation format

### 7.3 Technical metrics

- Query parameters properly format in YAML export 100% of the time across all type combinations
- No local storage quota exceeded errors from query parameter data
- Editor performance unaffected by query parameter complexity (tree with 100+ properties still responsive)

## 8. Technical considerations

### 8.1 Integration points

- Query parameter data stored in `PathOperation.parameters` array following OpenAPI structure
- Integrates with existing PathsPanel and operation editing components
- Extends current parameter type system to support `object` and `array` types
- Works with existing exportService for YAML generation
- Uses existing local storage persistence mechanism

### 8.2 Data storage & privacy

- Query parameters stored in browser local storage only (no server communication)
- Data structure follows OpenAPI 3.0 spec schema format
- No personal or sensitive data beyond specification content
- Compliant with existing privacy model (user-controlled local-only storage)

### 8.3 Scalability & performance

- Tree rendering optimized for operations with 50+ query parameters
- Lazy evaluation of deeply nested objects to avoid render performance issues
- Virtual scrolling considered if parameter lists exceed screen height
- State management uses React hooks efficiently to minimize re-renders

### 8.4 Potential challenges

- Deep object nesting (10+ levels) may cause UI usability challenges
- Type display in tree needs clear visual distinction between similar types
- Validation of complex constraint combinations (pattern + type constraints)
- YAML generation for complex recursive structures requires careful schema formatting
- User mental model for array element type definition must be intuitive

## 9. Milestones & sequencing

### 9.1 Project estimate

- **Size**: Large (new tree component + complex type system + validation + export integration)
- **Time estimate**: 8-10 weeks for full implementation with testing

### 9.2 Team size & composition

- **Team size**: 2-3 engineers
- **Roles**: Frontend/React specialist (primary), TypeScript expert, QA/Test engineer

### 9.3 Suggested phases

- **Phase 1: Foundation** (2-3 weeks)
  - Extend type system (add object, array types)
  - Create tree component and basic rendering
  - Implement add/remove parameter operations
  - Key deliverables: Functional tree UI for simple parameters

- **Phase 2: Complex types** (2-3 weeks)
  - Implement nested object properties management
  - Array type support with element type selection
  - Recursive object support
  - Key deliverables: Tree UI supports all type combinations

- **Phase 3: Validation & constraints** (2-3 weeks)
  - Implement constraint editing (min/max/pattern/default)
  - Real-time validation feedback
  - Proper error messaging
  - Key deliverables: Full constraint system functional

- **Phase 4: Export & integration** (1-2 weeks)
  - YAML export generation for query parameters
  - Integration with operation editor UI
  - End-to-end testing
  - Key deliverables: Feature complete and production-ready

## 10. User stories

### 10.1 Add query parameter to operation

- **ID**: WP-011
- **Description**: As a technical user, I want to add query parameters to an API operation, so I can document what query strings are accepted by that endpoint.
- **Acceptance criteria**:
  - User can navigate to an operation (specific HTTP method + path) in the editor
  - A "Query parameters" section is visible in the operation form
  - User can click "Add parameter" button to create a new query parameter
  - Parameter creation form shows: parameter name field, type selector (string, number, integer, boolean, object, array)
  - User enters parameter name and selects type, then clicks save
  - New parameter appears in the query parameters tree view
  - Empty parameters list shows informative message instead of blank space
  - Parameters are added to the operation's parameters array in the OpenAPI structure

### 10.2 Edit query parameter

- **ID**: WP-012
- **Description**: As a technical user, I want to edit query parameter properties, so I can update type, constraints, and descriptions after initial creation.
- **Acceptance criteria**:
  - Each parameter in the tree displays an "Edit" button or is clickable
  - Clicking edit opens editing panel with: name, type, required toggle, constraint fields (min/max/pattern/default), description
  - Constraint fields are context-appropriate (only show min/max for numbers, pattern for strings, etc.)
  - User can modify any field and changes are reflected in tree immediately
  - Validation errors appear inline if invalid values are entered
  - Editing panel closes when user saves or cancels
  - Changes are persisted to local storage

### 10.3 Remove query parameter

- **ID**: WP-013
- **Description**: As a technical user, I want to remove query parameters, so I can delete parameters that are no longer needed.
- **Acceptance criteria**:
  - Each parameter has a delete/remove button or icon
  - Clicking delete immediately removes the parameter (no confirmation dialog required)
  - Removed parameter is deleted from the tree and from the operation's parameters array
  - No validation warnings or orphaned data left behind
  - Change is persisted to local storage

### 10.4 Define parameters with base types

- **ID**: WP-014
- **Description**: As a technical user, I want to define query parameters using base types (string, number, integer, boolean), so I can document simple scalar parameters.
- **Acceptance criteria**:
  - Type selector offers options: string, number, integer, boolean
  - User can select and save a base type parameter
  - Tree displays parameter with type badge showing selected type
  - Parameters maintain their type through edits and persistence
  - Type can be changed after creation through edit panel
  - Each base type parameter has appropriate constraint fields in editing panel

### 10.5 Set parameter constraints and validation

- **ID**: WP-015
- **Description**: As a technical user, I want to specify constraints for query parameters, so I can document validation rules for parameter values.
- **Acceptance criteria**:
  - **For number/integer types**: Editing panel shows "Minimum value" and "Maximum value" input fields
  - **For string types**: Editing panel shows "Pattern (regex)" input field for validation patterns
  - **For all types**: Editing panel shows "Default value" field
  - **For all types**: Editing panel shows "Required" toggle (optional by default)
  - **For all types**: Editing panel shows "Description" text field
  - Minimum value must be less than maximum value, validation error if not
  - Pattern field accepts valid regex, shows error for invalid regex
  - Default value must match the parameter type (string for string type, number for number type, etc.)
  - Validation errors display inline with helpful messages
  - All constraints are saved with the parameter

### 10.6 Define object-type query parameters

- **ID**: WP-016
- **Description**: As a technical user, I want to define complex object-type query parameters with nested properties, so I can document query parameters that have structured properties.
- **Acceptance criteria**:
  - Type selector includes "object" as option
  - When user selects object type, tree node displays as expandable container
  - Object node shows "Add property" button to add nested properties
  - Clicking "Add property" opens form to define property: name, type, constraints
  - New property appears as child node under the object node in tree
  - Properties can be of any type: string, number, integer, boolean, object, or array
  - Objects can contain other objects (recursive support)
  - Tree indentation clearly shows property nesting under parent object
  - Object node can be expanded/collapsed to show or hide nested properties
  - All object properties are included in the exported YAML

### 10.7 Define array-type query parameters

- **ID**: WP-017
- **Description**: As a technical user, I want to define array-type query parameters with specified element types, so I can document query parameters that accept multiple values.
- **Acceptance criteria**:
  - Type selector includes "array" as option
  - When user selects array type, editing panel shows "Element type" selector
  - Element type selector offers: string, number, integer, boolean, object
  - User selects element type and saves
  - Tree displays array parameter with element type indicator (e.g., "array of string")
  - If element type is object, user can click "Edit element structure" to define object properties
  - Array element object properties are managed similarly to regular object properties
  - Multiple properties can be defined for array element object type
  - Array structure is properly formatted in exported YAML schema

### 10.8 Manage nested object properties recursively

- **ID**: WP-018
- **Description**: As a technical user, I want to define deeply nested object properties, so I can document complex hierarchical query parameter structures.
- **Acceptance criteria**:
  - Object properties can themselves be objects (nested objects)
  - Nested objects display as expandable nodes in the tree
  - Each nested object can have "Add property" button to define its own properties
  - Nesting depth is unrestricted (no documented limit)
  - Tree clearly shows indentation hierarchy for multiple nesting levels
  - Edit panel correctly contextualizes which property/object is being edited
  - All nested properties are saved and persisted correctly
  - Deep nesting does not cause performance issues (tree remains responsive with 5+ levels)
  - Complex nested structures export correctly to YAML

### 10.9 Persistence and auto-save

- **ID**: WP-019
- **Description**: As a technical user, I want query parameters to automatically save to local storage, so I don't lose my work and don't need manual save actions.
- **Acceptance criteria**:
  - Every add/edit/remove action on query parameters triggers automatic persistence to local storage
  - Query parameters are stored with operation-specific keys (path + method combination)
  - Data is immediately persisted (not batched or delayed)
  - Reloading the page preserves all query parameters
  - No "unsaved changes" warning needed (all changes auto-saved)
  - Storage quota errors, if encountered, show user-friendly message

### 10.10 Export query parameters to YAML

- **ID**: WP-020
- **Description**: As a technical user, I want query parameters exported in the YAML specification, so the exported OpenAPI document includes complete query parameter documentation.
- **Acceptance criteria**:
  - Query parameters are included in the YAML export of the specification
  - Parameters are properly formatted under each operation's `parameters` array in OpenAPI format
  - Base type parameters generate simple schema definitions
  - Object-type parameters generate complex schema with `type: object` and `properties` field
  - Nested objects properly nest their properties in YAML
  - Array-type parameters generate schema with `type: array` and `items` definition
  - All constraints (min, max, pattern, default, required) are included in YAML schema
  - Descriptions are preserved in YAML schema
  - Generated YAML is valid OpenAPI 3.0 schema that passes OpenAPI validators
  - Complex recursive structures (object containing array of objects) generate correct YAML

### 10.11 Tree-based user interface display

- **ID**: WP-021
- **Description**: As a technical user, I want to see query parameters displayed in a clear tree structure, so I can quickly understand the parameter hierarchy and relationships.
- **Acceptance criteria**:
  - Query parameters are displayed as a tree with root-level parameters visible
  - Primitive type parameters (string, number, boolean) appear as non-expandable leaf nodes
  - Object-type parameters appear as expandable/collapsible nodes
  - Expanded objects show nested properties as child nodes
  - Array parameters show element type indicator (e.g., "array of string" or "array of object")
  - Each node displays: parameter/property name, type badge (colored by type), required indicator (*)
  - Tree nodes have consistent styling and spacing for readability
  - Indentation clearly shows nesting hierarchy
  - Expand/collapse icons appear only on expandable nodes (objects)
  - Visual distinction between different node types (parameter vs. nested property)
  - Tree scrolls if parameter list exceeds available screen height
  - Tree renders efficiently even with 50+ parameters

### 10.12 Inline parameter editing in tree

- **ID**: WP-022
- **Description**: As a technical user, I want to access parameter editing from the tree interface, so I can quickly modify parameters without additional navigation.
- **Acceptance criteria**:
  - Each tree node has action buttons: edit (pencil icon) and delete (trash icon)
  - Hovering over a node highlights it and shows action buttons
  - Clicking edit opens editing panel with all parameter properties
  - Editing panel appears in side view or modal, preserving tree view visibility
  - Editing panel contextually shows only relevant fields for parameter type (e.g., no pattern field for number type)
  - Closing editing panel returns focus to tree
  - Changes in editing panel immediately update tree display
  - Delete button removes parameter immediately

### 10.13 Add and remove object properties

- **ID**: WP-023
- **Description**: As a technical user, I want to manage object properties within query parameters, so I can define and modify the structure of object-type parameters.
- **Acceptance criteria**:
  - Object-type parameters in tree show "Add property" button when expanded
  - Clicking "Add property" displays form to define new property: name, type, required, constraints, description
  - New property is added as child node in tree immediately after clicking save
  - Each property has edit and delete buttons like top-level parameters
  - Deleting a property removes it from the object's properties
  - Property names must be unique within the object (no duplicate property names)
  - Property names follow valid identifier rules
  - Invalid property names trigger validation error
  - Properties can be added/removed multiple times (no limit)
  - All properties are maintained in the object's structure

### 10.14 Operation context and navigation

- **ID**: WP-024
- **Description**: As a technical user, I want to clearly see which operation I'm editing query parameters for, so I don't accidentally edit parameters for the wrong endpoint.
- **Acceptance criteria**:
  - Query parameters editor displays current operation context (HTTP method + path)
  - Operation context is shown in header or title of the editor
  - Example format: "Query parameters for GET /products"
  - Operation context is visible and clear at all times while editing
  - User can navigate back to operation list or to another operation without losing work (auto-save handles this)
  - Query parameters remain associated with the correct operation after navigation

