# OpenAPI Visual Editor - User Stories

**Document Version:** 1.0  
**Date Created:** March 20, 2026  
**Derived From:** SPEC-openapi-editor.md

---

## Epic 1: File Management

### US-1.1: Create New OpenAPI Specification
**As a** backend developer  
**I want to** create a new OpenAPI specification from scratch  
**So that** I can start documenting a new API without manual JSON/YAML editing

**Acceptance Criteria:**
- User sees "Create New API" button on landing screen
- Clicking opens a form for basic metadata (title, version, description, base URL)
- Form has sensible defaults pre-filled
- User can submit form and editor opens with blank canvas
- New spec is auto-saved to localStorage
- User can immediately start adding endpoints and schemas

**Story Points:** 5

---

### US-1.2: Upload Existing OpenAPI File
**As a** API developer  
**I want to** upload an existing OpenAPI JSON/YAML file  
**So that** I can modify and maintain my existing API specifications

**Acceptance Criteria:**
- File picker accepts .json, .yaml, .yml extensions
- File is validated against OpenAPI 3.0/3.1 schema
- If valid: File loads into editor, success toast shown
- If parsing fails: Error modal displays with line number and error details
- If OpenAPI validation fails: File loads with validation errors in error panel
- User can proceed to edit even with non-critical validation errors

**Story Points:** 8

---

### US-1.3: Export Specification as JSON
**As a** API developer  
**I want to** export my specification as JSON  
**So that** I can download and share my API definition with external tools

**Acceptance Criteria:**
- Export button available in header
- User clicks Export → format selection modal appears
- Selecting JSON triggers download
- File is named [spec-title].json
- Formatting and structure preserved in output
- JSON is valid and re-importable

**Story Points:** 3

---

### US-1.4: Export Specification as YAML
**As a** API developer  
**I want to** export my specification as YAML  
**So that** I can use YAML format for my API documentation

**Acceptance Criteria:**
- YAML option available in export modal
- Selecting YAML triggers download
- File is named [spec-title].yaml
- YAML is properly formatted and readable
- Output is valid and re-importable

**Story Points:** 3

---

### US-1.5: Copy Specification to Clipboard
**As a** API developer  
**I want to** copy my specification to clipboard  
**So that** I can paste it directly into code, documentation, or other tools

**Acceptance Criteria:**
- Export modal offers "Copy to Clipboard" option
- Format selection (JSON or YAML) available before copying
- Success notification confirms copy
- Copied content is valid and complete

**Story Points:** 2

---

### US-1.6: Auto-Save Draft to Browser Storage
**As a** API developer  
**I want to** have my changes automatically saved  
**So that** I don't lose work if my browser crashes or I accidentally close the tab

**Acceptance Criteria:**
- Changes auto-save every 30 seconds
- "Unsaved changes" indicator visible when changes exist
- "Last saved at [time]" indicator shows after save
- localStorage used for persistence
- Draft survives browser refresh

**Story Points:** 5

---

### US-1.7: Recover Unsaved Draft
**As a** API developer  
**I want to** recover my previous unsaved draft when I reload the app  
**So that** I can continue where I left off if I accidentally closed the editor

**Acceptance Criteria:**
- On app load, if draft exists: recovery modal appears
- Modal shows: "Recover unsaved draft from [date/time]?"
- Options: "Load Draft" | "Discard & Start New" | "Cancel"
- User can choose to restore draft or start fresh
- Discarded drafts are cleared from storage

**Story Points:** 3

---

## Epic 2: Document Metadata

### US-2.1: Edit API Title and Version
**As a** API designer  
**I want to** edit the API title and version  
**So that** I can set up the basic metadata for my API

**Acceptance Criteria:**
- Info section displays title and version fields
- Both fields are editable text inputs with an info icon
- Title field marked as required
- Version field marked as required
- Real-time validation shows error if either is empty
- Changes immediately reflected in editor header

**Story Points:** 2

---

### US-2.2: Edit API Description
**As a** API designer  
**I want to** add a comprehensive description of my API  
**So that** users understand what my API does

**Acceptance Criteria:**
- Description field is a text area
- Supports multi-line input
- Optional field (not required)
- Tooltip explains field purpose
- Character count shown (suggests summary for >500 chars)

**Story Points:** 1

---

### US-2.3: Edit Contact Information
**As a** API designer  
**I want to** add contact information for API support  
**So that** API consumers know how to reach support

**Acceptance Criteria:**
- Expandable "Contact Information" section
- Fields: Name, URL, Email
- All fields optional
- Email field validates email format
- URL field validates URL format

**Story Points:** 2

---

### US-2.4: Edit License Information
**As a** API designer  
**I want to** specify the license for my API  
**So that** users understand how they can use my API

**Acceptance Criteria:**
- License section with fields: Name, URL
- Both fields optional
- URL field validates format
- Displays common licenses in dropdown (MIT, Apache 2.0, GPL, etc.)

**Story Points:** 2

---

### US-2.5: Add Server URLs
**As a** API designer  
**I want to** define server URLs for my API  
**So that** API consumers know where to call my endpoints

**Acceptance Criteria:**
- Servers section shows list of configured servers
- "Add Server" button adds new server
- Each server has: URL, description (optional)
- URL validation checks for valid format
- Support for variables in URLs (e.g., {environment}.api.example.com)
- Variables have default values
- Can edit/delete existing servers

**Story Points:** 5

---

## Epic 3: API Endpoints & Operations

### US-3.1: Add API Path
**As a** API designer  
**I want to** add a new API path/endpoint  
**So that** I can define new endpoints in my API

**Acceptance Criteria:**
- Paths section with list of existing paths
- "Add Path" button opens form or modal
- Form includes: Path URL (e.g., /users)
- Path validation: must start with "/"
- Path validation: must use valid syntax ({param} in braces)
- Success: Path added to list and editor shows path details

**Story Points:** 5

---

### US-3.2: Add Operation to Path
**As a** API designer  
**I want to** add an HTTP operation (GET, POST, etc.) to a path  
**So that** I can define what actions are available on an endpoint

**Acceptance Criteria:**
- Each path shows list of operations
- "Add Operation" button available per path
- Operation dropdown: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD, TRACE
- New operation form includes: Summary, Description (optional)
- Operation created and displays in operation list
- Operation is editable immediately

**Story Points:** 3

---

### US-3.3: Edit Operation Summary and Description
**As a** API designer  
**I want to** edit the summary and description of an operation  
**So that** API consumers understand what the operation does

**Acceptance Criteria:**
- Operation details tab shows Summary and Description fields
- Summary is required, single-line text
- Description is optional, multi-line text area
- Changes immediately visible in operation list
- Real-time validation

**Story Points:** 1

---

### US-3.4: Add Tags to Operation
**As a** API designer  
**I want to** tag operations with labels  
**So that** API documentation tools can organize endpoints by category

**Acceptance Criteria:**
- Tags field available in operation details
- Multiple tags can be added
- Tag input shows existing tags as suggestions
- Tags are comma-separated or dropdown selection
- Tags saved and displayed

**Story Points:** 2

---

### US-3.5: Mark Operation as Deprecated
**As a** API designer  
**I want to** mark an operation as deprecated  
**So that** API consumers know this endpoint will be removed

**Acceptance Criteria:**
- Deprecation checkbox in operation details
- When checked: Visual indicator (strikethrough, yellow badge) on operation
- Warning shown in validation panel (non-blocking)
- Deprecated flag saved in spec

**Story Points:** 2

---

### US-3.6: Delete Operation
**As a** API designer  
**I want to** delete an operation  
**So that** I can remove endpoints that are no longer needed

**Acceptance Criteria:**
- Delete button visible on operation (hover to reveal)
- Confirmation dialog: "Delete [Method] [Path]? This cannot be undone."
- On confirm: Operation removed from path
- Error panel updates
- Changes auto-saved

**Story Points:** 2

---

### US-3.7: Delete Path
**As a** API designer  
**I want to** delete an entire path  
**So that** I can remove endpoints that are no longer part of my API

**Acceptance Criteria:**
- Delete button visible on path (hover to reveal)
- Confirmation dialog: "Delete [Path] and all its operations? This cannot be undone."
- On confirm: Path and all operations removed
- References to this path cleared from elsewhere
- Changes auto-saved

**Story Points:** 3

---

## Epic 4: Request Parameters

### US-4.1: Add Query Parameter
**As a** API designer  
**I want to** add a query parameter to an operation  
**So that** API consumers can filter, sort, or paginate API responses

**Acceptance Criteria:**
- Parameters section in operation details
- "Add Query Parameter" button
- Form fields: Name, Description, Required (checkbox), Data Type, Format
- Parameter saved and added to list
- Name is required; others optional
- Type validation: must be valid OpenAPI type

**Story Points:** 3

---

### US-4.2: Add Path Parameter
**As a** API designer  
**I want to** add a path parameter to the path URL  
**So that** API consumers can specify dynamic values in the URL (e.g., /users/{id})

**Acceptance Criteria:**
- Path parameter form when creating/editing parameter
- Path parameter binds to URL placeholder (e.g., {id})
- Parameter must be marked as Required (enforced)
- Fields: Name, Description, Data Type, Format
- Validation: Parameter name must match URL placeholder

**Story Points:** 3

---

### US-4.3: Add Header Parameter
**As a** API designer  
**I want to** add a header parameter (e.g., Authorization, X-Custom-Header)  
**So that** API consumers know what headers to send with requests

**Acceptance Criteria:**
- "Add Header Parameter" button in operation parameters
- Form: Name, Description, Required, Data Type, Format
- Name field can autocomplete common headers
- Parameter saved and listed
- Changes auto-saved

**Story Points:** 2

---

### US-4.4: Add Cookie Parameter
**As a** API designer  
**I want to** add a cookie parameter  
**So that** I can specify cookies that must be sent with requests

**Acceptance Criteria:**
- "Add Cookie Parameter" button
- Form: Name, Description, Required, Data Type, Format
- Parameter saved and listed
- Changes auto-saved

**Story Points:** 2

---

### US-4.5: Edit Parameter
**As a** API designer  
**I want to** edit an existing parameter  
**So that** I can update its description, type, or requirements

**Acceptance Criteria:**
- Click parameter to open edit modal/form
- All fields editable
- Save and Cancel buttons
- Changes immediately reflected in list
- Auto-saved

**Story Points:** 2

---

### US-4.6: Delete Parameter
**As a** API designer  
**I want to** delete a parameter  
**So that** I can remove parameters that are no longer needed

**Acceptance Criteria:**
- Delete button visible (hover or click dropdown)
- Optional confirmation dialog
- Parameter removed from list
- Changes auto-saved

**Story Points:** 1

---

### US-4.7: Add Parameter Schema and Validation Rules
**As a** API designer  
**I want to** define schema, validation rules (min, max, pattern, enum) for parameters  
**So that** API consumers know the expected format and constraints

**Acceptance Criteria:**
- Parameter form includes: Schema (or Type + Format)
- Additional fields for constraints: Min, Max, MinLength, MaxLength, Pattern, Enum
- Fields appear based on data type selected
- Validation: Min < Max if both specified
- Pattern: Valid regex validation
- Enum: List of allowed values
- All constraints saved

**Story Points:** 5

---

## Epic 5: Request Bodies

### US-5.1: Add Request Body to Operation
**As a** API designer  
**I want to** define a request body for an operation (e.g., POST, PUT)  
**So that** API consumers know what data to send with the request

**Acceptance Criteria:**
- "Add Request Body" button in operation details
- Request body form: Content-Type, Schema (reference or inline), Required flag
- Content-Type dropdown: application/json, application/xml, form-data, etc.
- Schema selection: Use existing schema or create inline
- Required checkbox (defaults to true for POST/PUT)
- Request body saved and displayed

**Story Points:** 5

---

### US-5.2: Select Schema Reference for Request Body
**As a** API designer  
**I want to** reference an existing reusable schema for a request body  
**So that** I can reuse the same data model across multiple operations

**Acceptance Criteria:**
- Schema dropdown shows all defined schemas
- Selecting a schema creates reference (not copy)
- Visual indicator shows it's a reference
- Clicking reference jumps to schema definition
- Required flag for body is independent of schema

**Story Points:** 2

---

### US-5.3: Create Inline Schema for Request Body
**As a** API designer  
**I want to** define an inline schema for a request body  
**So that** I can define one-off data structures without creating reusable schemas

**Acceptance Criteria:**
- "Create inline" option in schema selection
- Opens nested schema editor
- User defines properties, types, constraints
- Inline schema stored as part of request body
- Changes to inline schema don't affect other operations

**Story Points:** 3

---

### US-5.4: Edit Request Body
**As a** API designer  
**I want to** edit the request body definition  
**So that** I can change content type or schema

**Acceptance Criteria:**
- Edit button/mode for request body
- All fields editable: Content-Type, Schema, Required
- Changes auto-saved
- Visual updates immediately

**Story Points:** 2

---

### US-5.5: Delete Request Body
**As a** API designer  
**I want to** remove a request body from an operation  
**So that** I can make operations that don't have request bodies

**Acceptance Criteria:**
- Delete option for request body
- Optional confirmation
- Request body removed
- Changes auto-saved

**Story Points:** 1

---

## Epic 6: Responses

### US-6.1: Add Response to Operation
**As a** API designer  
**I want to** add a response with a status code to an operation  
**So that** I can define what the API returns for different outcomes

**Acceptance Criteria:**
- Responses section in operation details
- "Add Response" button
- Form: HTTP Status Code, Description
- Status code validates: 100-599 or "default"
- Description required
- Response added to list
- At least one response required for valid operation

**Story Points:** 3

---

### US-6.2: Add Response Schema and Content Type
**As a** API designer  
**I want to** define the response body schema and content type  
**So that** API consumers know what data format to expect

**Acceptance Criteria:**
- Response details include: Content-Type, Schema selection
- Content-Type dropdown: application/json, application/xml, etc.
- Schema reference or inline option
- Multiple content types per status code supported
- Changes auto-saved

**Story Points:** 4

---

### US-6.3: Add Response Headers
**As a** API designer  
**I want to** define headers that are returned in the response  
**So that** API consumers know what metadata is included

**Acceptance Criteria:**
- Response headers section
- "Add Header" button
- Header form: Name, Description, Data Type, Format
- Multiple headers per response
- Headers saved and listed
- Changes auto-saved

**Story Points:** 3

---

### US-6.4: Edit Response
**As a** API designer  
**I want to** edit response details  
**So that** I can update status code, description, or schema

**Acceptance Criteria:**
- Edit button on response
- All fields editable
- Status code change updates references
- Save and Cancel buttons
- Auto-saved on submit

**Story Points:** 2

---

### US-6.5: Delete Response
**As a** API designer  
**I want to** delete a response  
**So that** I can remove status codes that are no longer applicable

**Acceptance Criteria:**
- Delete button on response
- Confirmation dialog
- Response removed
- At least one response remains (validation enforced)
- Changes auto-saved

**Story Points:** 1

---

## Epic 7: Schemas & Data Models

### US-7.1: Add Reusable Schema
**As a** API designer  
**I want to** create a reusable schema for common data models  
**So that** I can reference the same data structure across multiple operations

**Acceptance Criteria:**
- Schemas section in editor
- "Add Schema" button opens schema form
- Form: Schema Name, Properties (table with Name, Type, Required, Format, Description)
- Property table has "Add Property" button
- Schema saved and added to list
- Schema immediately available for reference in parameters/requests/responses

**Story Points:** 5

---

### US-7.2: Edit Schema Properties
**As a** API designer  
**I want to** add, edit, and remove properties from a schema  
**So that** I can define the structure of my data models

**Acceptance Criteria:**
- Property table displays all properties
- "Add Property" button adds new row
- Each row editable: Name, Type, Required, Format, Description
- Type dropdown: string, number, integer, boolean, array, object, null
- Format dropdown appears based on type (e.g., email for string)
- Edit row in place or in modal
- Delete property button removes row
- Changes auto-saved

**Story Points:** 4

---

### US-7.3: Add Nested Objects and Arrays
**As a** API designer  
**I want to** define nested object properties and arrays  
**So that** I can represent complex data structures

**Acceptance Criteria:**
- Property type "object": Expand inline to add nested properties
- Property type "array": Specify item type (primitive or object)
- Array items dialog: Define type and schema for items
- Nested properties shown with indentation
- Changes auto-saved
- Support up to 5 levels deep (warn beyond)

**Story Points:** 6

---

### US-7.4: Add Enum Values to Property
**As a** API designer  
**I want to** define enum (allowed values) for a property  
**So that** API consumers know the valid values for a field

**Acceptance Criteria:**
- Property options include "Enum Values"
- Toggle to enable enum mode
- List input for adding enum values
- Values must match declared type (e.g., string enum has string values)
- Multiple values supported
- Changes auto-saved

**Story Points:** 2

---

### US-7.5: Set Property Constraints (Min, Max, Pattern, etc.)
**As a** API designer  
**I want to** define constraints on properties  
**So that** API consumers know the validation rules

**Acceptance Criteria:**
- Property form includes constraint fields based on type
- String: MinLength, MaxLength, Pattern
- Number: Min, Max, MultipleOf
- All types: Description, Default, Example
- Pattern field validates regex
- Constraints saved and displayed
- Validation error if Min >= Max

**Story Points:** 3

---

### US-7.6: Define Default and Example Values
**As a** API designer  
**I want to** specify default and example values for properties  
**So that** API documentation tools can show realistic data

**Acceptance Criteria:**
- Property form includes "Default Value" and "Example Value" fields
- Values must match property type
- Changes auto-saved
- Values appear in generated documentation

**Story Points:** 2

---

### US-7.7: Edit Schema
**As a** API designer  
**I want to** rename and edit an existing schema  
**So that** I can update schema definitions

**Acceptance Criteria:**
- Edit button on schema
- Schema name editable
- Properties editable via table
- Save and Cancel buttons
- Rename updates all references (visual indication)
- Auto-saved

**Story Points:** 3

---

### US-7.8: Delete Schema
**As a** API designer  
**I want to** delete an unused schema  
**So that** I can clean up my API definition

**Acceptance Criteria:**
- Delete button on schema
- Validation warning if schema is referenced elsewhere
- Confirmation dialog
- Schema removed
- Error shown if deletion would break references
- Changes auto-saved

**Story Points:** 2

---

### US-7.9: Use Composite Schema Types (oneOf, anyOf, allOf)
**As a** API designer  
**I want to** define composite schemas (oneOf, anyOf, allOf)  
**So that** I can represent complex data variations

**Acceptance Criteria:**
- Composite schema option in schema editor
- Dropdown: oneOf, anyOf, allOf
- User can reference existing schemas or create inline
- Visual card display for each schema option
- "Add Alternative" button
- Changes auto-saved

**Story Points:** 5

---

## Epic 8: Security

### US-8.1: Add Security Scheme
**As a** API designer  
**I want to** define a security scheme (API Key, OAuth2, Basic Auth, etc.)  
**So that** I can document how API consumers authenticate

**Acceptance Criteria:**
- Security section with list of schemes
- "Add Security Scheme" button
- Form: Scheme Name, Type (API Key, HTTP, OAuth2, OpenID Connect)
- Type-specific fields appear based on selection
- Scheme saved and added to list
- Scheme available for applying to operations

**Story Points:** 5

---

### US-8.2: Configure API Key Security
**As a** API designer  
**I want to** configure an API Key security scheme  
**So that** I can document key-based authentication

**Acceptance Criteria:**
- API Key type shows: Name, Location (header, query, cookie)
- Name field: Key name (e.g., "Authorization", "X-API-Key")
- Location dropdown
- Fields saved
- Can be applied to operations

**Story Points:** 2

---

### US-8.3: Configure HTTP Basic Auth
**As a** API designer  
**I want to** configure HTTP Basic Authentication  
**So that** I can document basic auth security

**Acceptance Criteria:**
- HTTP Basic type in security scheme
- Simplified form (no additional fields needed)
- Saved as security scheme
- Can be applied to operations

**Story Points:** 1

---

### US-8.4: Configure OAuth2 Security
**As a** API designer  
**I want to** configure OAuth2 security with multiple flows  
**So that** I can document OAuth2 based authentication

**Acceptance Criteria:**
- OAuth2 type in security scheme
- Flows dropdown: Authorization Code, Client Credentials, Implicit, Password
- Selected flow shows relevant fields (Token URL, Authorization URL, Scopes)
- Scopes table: Add/edit/delete scopes with name and description
- Changes auto-saved
- Can apply to operations

**Story Points:** 5

---

### US-8.5: Configure OpenID Connect Security
**As a** API designer  
**I want to** configure OpenID Connect security  
**So that** I can document OIDC authentication

**Acceptance Criteria:**
- OpenID Connect type in security scheme
- Field: OpenID Connect URL (required)
- URL validation
- Saved as security scheme
- Can apply to operations

**Story Points:** 2

---

### US-8.6: Apply Security to Global Level
**As a** API designer  
**I want to** apply a security scheme globally to all operations  
**So that** I can specify default authentication for the API

**Acceptance Criteria:**
- Global Security section (separate from operation-level)
- "Add Global Security" button
- Dropdown of all defined security schemes
- Can add multiple schemes (OR logic)
- Removes requirement to apply to each operation
- Changes auto-saved

**Story Points:** 3

---

### US-8.7: Apply Security to Specific Operation
**As a** API designer  
**I want to** apply security requirements to specific operations  
**So that** different endpoints can have different authentication rules

**Acceptance Criteria:**
- Security section in operation details
- "Add Security" button
- Dropdown of all defined security schemes
- Can add multiple schemes
- Display shows applied security
- Can remove security from operation (overrides global)
- Changes auto-saved

**Story Points:** 3

---

### US-8.8: Edit Security Scheme
**As a** API designer  
**I want to** edit an existing security scheme  
**So that** I can update authentication configuration

**Acceptance Criteria:**
- Edit button on security scheme
- All fields editable
- Type can be changed (with warning about references)
- Save and Cancel buttons
- Auto-saved

**Story Points:** 2

---

### US-8.9: Delete Security Scheme
**As a** API designer  
**I want to** delete an unused security scheme  
**So that** I can clean up security definitions

**Acceptance Criteria:**
- Delete button on security scheme
- Warning if scheme is applied to operations
- Confirmation dialog
- Scheme removed
- Error if deletion would affect operations
- Changes auto-saved

**Story Points:** 2

---

## Epic 9: Real-Time Validation

### US-9.1: View Validation Errors in Real-Time
**As a** API developer  
**I want to** see validation errors as I edit  
**So that** I can fix issues immediately

**Acceptance Criteria:**
- Error panel visible (right sidebar or bottom)
- Lists all validation errors with severity (critical, warning, info)
- Errors appear/disappear in real-time (debounced 300ms)
- Error count badge on sidebar navigation
- Error message includes location (e.g., "Paths.GET./users.Parameters")
- Errors grouped by section

**Story Points:** 5

---

### US-9.2: Navigate to Error Field
**As a** API developer  
**I want to** click an error to jump to the offending field  
**So that** I can quickly locate and fix the error

**Acceptance Criteria:**
- Each error in panel is clickable
- Clicking scrolls editor to field location
- Field is highlighted with border/background
- Breadcrumb navigation shows path to field
- "Quick-fix" suggestions shown if applicable

**Story Points:** 3

---

### US-9.3: View Inline Error Indicators
**As a** API developer  
**I want to** see error indicators on form fields  
**So that** I know which fields have problems

**Acceptance Criteria:**
- Invalid field has red border or outline
- Icon (ⓘ or ✗) appears next to field
- Hovering icon shows error tooltip
- Tooltip text is clear and actionable
- Critical errors have distinct visual (e.g., red)
- Warnings have distinct visual (e.g., orange/yellow)

**Story Points:** 4

---

### US-9.4: Validate Required Fields
**As a** system  
**I want to** check that all required fields are provided  
**So that** users cannot create invalid specs

**Acceptance Criteria:**
- Required fields marked with asterisk (*)
- Missing required field triggers validation error
- Errors: API title, API version, at least one response per operation
- Error message: "[Field name] is required"
- Error clears when field is filled

**Story Points:** 3

---

### US-9.5: Validate Data Types
**As a** system  
**I want to** verify that field values match their declared type  
**So that** specs maintain type consistency

**Acceptance Criteria:**
- Number fields reject non-numeric input
- URL fields validate format (http/https)
- Email fields validate format
- Date fields validate format (ISO 8601)
- UUID fields validate v4 format
- Enum fields reject invalid values
- Error message indicates expected type

**Story Points:** 4

---

### US-9.6: Validate Schema References
**As a** system  
**I want to** check that all schema references point to existing schemas  
**So that** exports don't have broken references

**Acceptance Criteria:**
- When reference is created: Check schema exists
- When schema is renamed: Update all references
- When schema is deleted: Flag error if referenced
- Error message: "Referenced schema '[Name]' does not exist"
- Visual indication in reference field

**Story Points:** 4

---

### US-9.7: Validate HTTP Paths and Methods
**As a** system  
**I want to** verify that paths and HTTP methods are valid  
**So that** specs conform to REST principles

**Acceptance Criteria:**
- Path validation: Must start with "/"
- Path validation: Must use valid syntax ({param} in braces)
- HTTP method validation: Only allowed methods (GET, POST, etc.)
- Duplicate path + method validation: Cannot have two identical pairs
- Error message for each violation

**Story Points:** 3

---

### US-9.8: Validate HTTP Status Codes
**As a** system  
**I want to** check that HTTP status codes are valid  
**So that** specs represent real HTTP responses

**Acceptance Criteria:**
- Status code must be 100-599 OR "default"
- Validation rejects invalid codes (e.g., 999, 0)
- Error message: "Status code must be 100-599 or 'default'"
- Error prevents saving response with invalid code

**Story Points:** 2

---

### US-9.9: Validate URL Formats
**As a** system  
**I want to** verify that all URLs are properly formatted  
**So that** specs contain usable endpoint information

**Acceptance Criteria:**
- Server URL validation: http://, https://, or relative paths allowed
- Contact URL validation: Valid URL format
- License URL validation: Valid URL format
- Pattern validation: Valid regex expressions
- Error message shows expected format
- Example provided for clarity

**Story Points:** 3

---

### US-9.10: Detect Circular Schema References
**As a** system  
**I want to** detect when schemas reference each other circularly  
**So that** exports are valid and tools can process them

**Acceptance Criteria:**
- Validation detects: A → B → A cycles
- Error message: "Circular reference detected: [Path shown]"
- Error is blocking (prevents export)
- Visual indicator on affected schemas
- Suggestion: Remove or restructure reference

**Story Points:** 5

---

### US-9.11: Show Warning for Deprecated Operations
**As a** system  
**I want to** flag deprecated operations  
**So that** users remember to remove or update them

**Acceptance Criteria:**
- Validation generates warning (not error) for deprecated ops
- Warning message: "[Method] [Path] is deprecated"
- Non-blocking (allows export)
- Yellow/orange visual indicator
- Listed in warning section of error panel

**Story Points:** 2

---

### US-9.12: Warn About Unsupported Features
**As a** system  
**I want to** inform users of features not yet supported  
**So that** expectations are clear

**Acceptance Criteria:**
- Custom x- extensions: Show info message (can edit but not guaranteed support)
- Swagger 2.0 files: Show error (not supported, must be OpenAPI 3.0/3.1)
- Very large fields (>500 chars): Show readability suggestion
- Deep nesting (>5 levels): Show performance warning

**Story Points:** 2

---

## Epic 10: Export & Validation

### US-10.1: Prevent Export with Critical Errors
**As a** system  
**I want to** prevent exporting specs with critical validation errors  
**So that** users don't download invalid documents

**Acceptance Criteria:**
- User clicks Export with critical errors
- Modal popup: "Cannot export - [Critical errors exist]"
- Shows critical errors only
- Options: "Fix Errors" (jumps to error panel) | "Cancel"
- Export blocked until errors resolved

**Story Points:** 3

---

### US-10.2: Allow Export with Warnings
**As a** system  
**I want to** allow exporting specs with non-critical warnings  
**So that** users can export while fixing minor issues

**Acceptance Criteria:**
- Export allowed when only warnings exist
- Confirmation modal shows warnings: "Export with warnings?"
- Options: "Export" | "Cancel"
- On Export: File downloads
- Warning modal optional (low-priority warnings)

**Story Points:** 2

---

### US-10.3: Validate Spec Compliance Before Export
**As a** system  
**I want to** perform final validation check on export  
**So that** exported specs are valid OpenAPI

**Acceptance Criteria:**
- Full spec validation run on export button click
- All rules from Section 12.1 checked
- Results presented before download
- Critical errors block export
- Warnings allow export with confirmation

**Story Points:** 3

---

### US-10.4: Display File Size and Performance Warning
**As a** system  
**I want to** warn users when specs approach size limits  
**So that** users are aware of potential performance issues

**Acceptance Criteria:**
- On upload: Check file size
- If > 4MB: Show warning "Spec is very large; performance may be affected"
- On export: Show file size in download confirmation
- Performance warning for specs with 100+ endpoints
- Info: "Loading may take a few seconds"

**Story Points:** 2

---

## Epic 11: File Upload & Error Recovery

### US-11.1: Handle JSON Parse Errors
**As a** system  
**I want to** provide clear feedback when JSON parsing fails  
**So that** users can fix malformed files

**Acceptance Criteria:**
- On JSON parse error: Modal shows error details
- Display: Error type, line number, character position
- Show file preview with error location highlighted
- Options: "Cancel Upload" | "Retry" | "Continue Anyway" (if partial parse possible)
- User can view and fix error

**Story Points:** 3

---

### US-11.2: Handle YAML Parse Errors
**As a** system  
**I want to** provide clear feedback when YAML parsing fails  
**So that** users can fix syntax issues

**Acceptance Criteria:**
- On YAML parse error: Error modal with details
- Display: Line number, error description
- YAML syntax validation helpful error message
- Options: "Cancel Upload" | "Continue" (if partial recovery possible)

**Story Points:** 3

---

### US-11.3: Validate Uploaded File Against OpenAPI Schema
**As a** system  
**I want to** validate uploaded files against OpenAPI specification  
**So that** specs conform to standard

**Acceptance Criteria:**
- After successful YAML/JSON parse: OpenAPI validation runs
- If valid: File loads into editor
- If invalid: Validation errors shown in error panel
- User can proceed with editing (errors listed for fixing)
- No file is rejected; parse errors only block on format error

**Story Points:** 3

---

### US-11.4: Handle File Size Limits
**As a** system  
**I want to** reject files exceeding the size limit  
**So that** performance is maintained

**Acceptance Criteria:**
- Max file size: 5MB
- On exceeding: Show error "File exceeds 5MB limit"
- File not loaded
- User must choose smaller file or delete parts
- Clear error message

**Story Points:** 2

---

### US-11.5: Show File Upload Progress
**As a** system  
**I want to** display file upload progress for large files  
**So that** users know the operation is in progress

**Acceptance Criteria:**
- File picker selected
- Show loading indicator while parsing
- For files > 2MB: Show progress bar
- Prevent interaction during parsing
- Clear message: "Parsing file..."
- Cancel option available

**Story Points:** 3

---

## Epic 12: Browser Storage & Persistence

### US-12.1: Auto-Save to Browser Storage
**As a** system  
**I want to** automatically save changes to browser localStorage  
**So that** users don't lose work

**Acceptance Criteria:**
- Auto-save triggered every 30 seconds
- Debounced on rapid changes
- Persists to localStorage with key format: `openapi-editor:draft:[timestamp]`
- Doesn't block UI during save
- Status indicator shows save status

**Story Points:** 3

---

### US-12.2: Show Save Status Indicator
**As a** user  
**I want to** know when my changes are saved  
**So that** I have confidence my work is preserved

**Acceptance Criteria:**
- "Unsaved changes" indicator visible when edits exist
- "Last saved at [time]" after save completes
- "Saving..." indicator during save (brief)
- Indicator disappears 2 seconds after save (or on next edit)
- Visual status in header or footer

**Story Points:** 2

---

### US-12.3: Handle localStorage Quota Exceeded
**As a** system  
**I want to** handle storage quota exceeded gracefully  
**So that** users are informed and can act

**Acceptance Criteria:**
- On quota exceeded: Warning banner appears
- Message: "Storage quota exceeded. Consider exporting and clearing old drafts."
- Suggest export action
- Suggest draft cleanup
- Options: "Export Now" | "Clear Old Drafts" | "Dismiss"

**Story Points:** 3

---

### US-12.4: Auto-Delete Old Drafts
**As a** system  
**I want to** automatically clean up old unused drafts  
**So that** storage quota is managed

**Acceptance Criteria:**
- Drafts older than 30 days auto-deleted
- Cleanup runs on app load periodically
- User notification: "Cleaned up [n] old drafts"
- Recent important drafts retained
- User can manually clear old drafts

**Story Points:** 2

---

### US-12.5: Handle Incognito/Private Mode Storage
**As a** system  
**I want to** detect when localStorage is unavailable  
**So that** users know persistence is disabled

**Acceptance Criteria:**
- On app load in incognito: Detect storage unavailability
- Show info banner: "Changes will not be saved after closing browser"
- App still functional (memory-only)
- Suggest exporting before closing
- Persist preference (use IndexedDB fallback if available)

**Story Points:** 2

---

## Epic 13: User Experience & Onboarding

### US-13.1: Display Landing Screen
**As a** new user  
**I want to** see a clear landing screen on first load  
**So that** I know what actions are available

**Acceptance Criteria:**
- App opens to landing screen
- Two primary options: "Create New API" | "Upload Existing API"
- Brief description of each action
- Optional: Example/demo link
- Optional: Help/documentation link
- Clean, uncluttered design

**Story Points:** 3

---

### US-13.2: Show Tooltips and Field Help
**As a** user  
**I want to** understand what each field means  
**So that** I can use the application without documentation

**Acceptance Criteria:**
- ℹ️ icon next to technical fields
- Tooltip on hover: Clear explanation in plain language
- Tooltip includes example value when helpful
- Tooltips never obscure form content
- Help text appears for complex sections

**Story Points:** 3

---

### US-13.3: Display Breadcrumb Navigation
**As a** user  
**I want to** see where I am in the editor  
**So that** I can navigate back and understand context

**Acceptance Criteria:**
- Breadcrumb path visible in header or near form
- Example: "Paths > /users > POST > Parameters"
- Breadcrumb clickable to jump to sections
- Updates as user navigates
- Helpful on mobile navigation

**Story Points:** 2

---

### US-13.4: Show Form Inline Validation Feedback
**As a** user  
**I want to** get immediate feedback on form input  
**So that** I correct mistakes as I type

**Acceptance Criteria:**
- Required fields marked with asterisk
- Field turns red when invalid
- Error icon appears next to field
- Tooltip shows error message on hover/focus
- Error clears when field becomes valid
- Validation debounced to avoid flickering

**Story Points:** 3

---

### US-13.5: Provide Quick-Add Buttons for Common Objects
**As a** user  
**I want to** quickly add common items (paths, parameters, etc.)  
**So that** I don't need to navigate deep into menus

**Acceptance Criteria:**
- "Add Path" button readily visible in Paths section
- "Add Parameter" button visible in Parameters section
- "Add Response" button visible in Responses section
- Buttons consistent style across app
- Clicking immediately shows form

**Story Points:** 2

---

### US-13.6: Show Meaningful Context on Modals
**As a** user  
**I want to** understand the context when editing in modals  
**So that** I know what object I'm editing

**Acceptance Criteria:**
- Modal title clearly states what's being edited
- Example: "Edit GET /users - Summary"
- Breadcrumb or path shown in modal header
- Cancel and Save buttons clearly labeled
- Close (X) button available

**Story Points:** 2

---

## Epic 14: Accessibility

### US-14.1: Support Keyboard Navigation
**As a** user with keyboard preference  
**I want to** navigate and edit the app using keyboard only  
**So that** I can use the app efficiently without mouse

**Acceptance Criteria:**
- Tab navigation through all interactive elements
- Tab order logical and predictable
- Shift+Tab navigates backward
- Enter activates buttons and submits forms
- Escape closes modals and cancels edits
- Arrow keys navigate lists and menus
- Focus visible on all elements

**Story Points:** 5

---

### US-14.2: Support Screen Readers
**As a** user with visual impairment  
**I want to** use screen reader to understand the app  
**So that** I can access all features

**Acceptance Criteria:**
- All form labels properly associated with inputs (aria-label)
- Error messages announced (aria-live regions)
- Buttons have descriptive text (not just icons)
- Lists and tables properly marked (role, aria-label)
- Form instructions announced
- ARIA markup used correctly
- Tested with screen reader

**Story Points:** 5

---

### US-14.3: Ensure Sufficient Color Contrast
**As a** user with low vision  
**I want to** see text and UI elements clearly  
**So that** I can read the app

**Acceptance Criteria:**
- All text meets WCAG 2.1 AA contrast ratio (4.5:1 for normal text)
- Error indication not color-only (includes icon/text)
- Warning indication not color-only
- Button states clearly distinguishable
- Focus indicators visible against all backgrounds

**Story Points:** 3

---

### US-14.4: Not Rely on Color Alone
**As a** user with color blindness  
**I want to** understand status without relying on color  
**So that** I can use the app effectively

**Acceptance Criteria:**
- Error states: Red + ✗ icon + text
- Warning states: Orange + ⚠ icon + text
- Success states: Green + ✓ icon + text
- Required fields: Asterisk (*) + text label "Required"
- All state changes indicated with text/icon/pattern, not color alone

**Story Points:** 2

---

### US-14.5: Support Dark Mode (Optional)
**As a** user  
**I want to** use dark mode  
**So that** I can reduce eye strain in low-light environments

**Acceptance Criteria:**
- Dark/Light mode toggle in header (optional for v1)
- Preference saved to localStorage
- All colors meet contrast requirements in dark mode
- Toggle clearly labeled and accessible
- All UI adapts to theme
- Can defer to v2 if timeline tight

**Story Points:** 5

---

## Summary Statistics

**Total User Stories:** 120+  
**Epics:** 14  
**Total Story Points:** ~250-300 (estimated)

### By Priority/Phase:

**Phase 1 (MVP):**
- File Management (US 1.1 - 1.7)
- Document Metadata (US 2.1 - 2.5)
- API Endpoints (US 3.1 - 3.7)
- Basic Parameters (US 4.1 - 4.6)
- Schemas (US 7.1 - 7.3)
- Real-Time Validation (US 9.1 - 9.6)
- Export & Validation (US 10.1 - 10.3)
- File Upload & Recovery (US 11.1 - 11.3)
- UX Fundamentals (US 13.1 - 13.4)
- Basic Keyboard Nav (US 14.1)

**Phase 2 (Enhancement):**
- Advanced Parameters (US 4.7)
- Request Bodies (US 5.1 - 5.5)
- Responses (US 6.1 - 6.5)
- Advanced Schemas (US 7.4 - 7.9)
- Security (US 8.1 - 8.9)
- Advanced Validation (US 9.7 - 9.12)
- Browser Storage (US 12.1 - 12.5)
- Advanced UX (US 13.5 - 13.6)
- Full Accessibility (US 14.2 - 14.5)

**Phase 3 (Polish):**
- Performance Optimization
- Additional Browser Support
- Localization (if needed)
- Documentation & Help System

---

**End of User Stories Document**
