# Stop Cri Studio - User Guide

**Complete Feature and UI Documentation**

*This document describes all features and user interface elements of Stop Cri Studio from a user's perspective. Use this as a reference to recreate the application.*

---

## Table of Contents

1. [Overview](#overview)
2. [Welcome Screen](#welcome-screen)
3. [Editor Interface](#editor-interface)
4. [API Information Panel](#api-information-panel)
5. [Paths Management](#paths-management)
6. [Operations Management](#operations-management)
7. [Schemas Panel](#schemas-panel)
8. [Export & Persistence](#export--persistence)

---

## Overview

**Stop Cri Studio** is a browser-based OpenAPI specification editor for technical users. It allows you to:

- Create new OpenAPI 3.0 specifications from scratch
- Edit and manage API paths and operations
- Define reusable data schemas
- Export specifications as YAML files
- All work is automatically saved locally in your browser

The application works entirely offline with no server dependencies or authentication required.

---

## Welcome Screen

### Purpose
The Welcome screen is the first view users see when opening Stop Cri Studio. It provides an entry point to either create a new specification or load an existing one.

### Layout
- **Background**: Gradient background (slate-50 to slate-100)
- **Header Section**: 
  - Title "Stop Cri Studio" displayed prominently in large text (5xl on mobile, 6xl on desktop)
  - Subtitle text explaining the application purpose: "Create and manage OpenAPI specifications with ease. Build comprehensive API documentation offline, right in your browser."
- **Main Content Area**: 
  - Centered content with responsive layout
  - Two action buttons arranged in a grid (1 column on mobile, 2 columns on desktop)
  - Maximum width container with padding for margin

### Buttons

#### 1. Create Button
- **Position**: Left button (on desktop) or top button (on mobile)
- **Style**: White background card with shadow
- **Hover Effects**: 
  - Shadow increases on hover
  - Card slightly moves up (-translate-y-1)
  - Smooth transition animation
- **Focus**: Blue ring outline when focused (4px ring with 50% opacity)
- **Action**: Clicking creates a new OpenAPI 3.0 specification and opens the editor

#### 2. Load Button
- **Position**: Right button (on desktop) or bottom button (on mobile)
- **Style**: White background card with shadow (same as Create)
- **Hover Effects**: Same hover behavior as Create button
- **Focus**: Same focus behavior as Create button
- **Action**: Clicking displays a list of previously saved specifications for selection or import

### Responsive Design
- Works on desktop (md and above): 2-column grid layout
- Works on tablet/mobile: 1-column layout with full buttons stacked vertically
- Padding and spacing adjust for different screen sizes

---

## Editor Interface

### Overall Layout
The editor uses a three-panel layout:

1. **Left Sidebar**: Navigation and specification sections
2. **Header Area**: Displays current specification info
3. **Main Content Panel**: Editable forms and details

### Header Area
- **Left Section**: Application title "Stop Cri Studio"
- **Center Section**: Current specification name and version (updates in real-time as you edit)
- **Right Section**: 
  - Export button (blue, labeled "Export")
  - Back button (to return to Welcome screen)
- **Background**: Clean white with subtle shadow beneath

### Left Sidebar
The sidebar contains navigation items that switch the main content panel:

#### Info Section (Default)
- **Label**: "Info"
- **Icon**: Might include an info icon (based on typical UI patterns)
- **State**: Selected by default when editor opens
- **Action**: Click to view/edit API information

#### Paths Section
- **Label**: "Paths"
- **Type**: Collapsible accordion
- **Content When Expanded**: 
  - List of all defined API paths (e.g., "/users", "/products/{id}")
  - Each path shows its operations as sub-items (GET, POST, etc.)
  - Expandable to show/hide operations
- **Add Button**: Green "+ Add Path" button at top of paths list
- **Action**: Click to add new paths, click path name to edit

#### Schemas Section
- **Label**: "Schemas"
- **Type**: Collapsible accordion
- **Content When Expanded**: 
  - List of all defined data schemas
  - Each schema shows its name
- **Add Button**: Green "+ Add Schema" button at top of schemas list
- **Action**: Click to add new schemas (feature in development)

---

## API Information Panel

### Purpose
Configure basic metadata for your OpenAPI specification that appears in the header and specification file.

### Layout
- **Title**: "API Information" (large, bold, dark text)
- **Subtitle**: "Configure the basic information about your OpenAPI specification"
- **Form Fields**: Vertical stack with 6-unit spacing between fields

### Form Fields

#### 1. Specification Name
- **Label**: "Specification Name"
- **Type**: Text input field
- **Placeholder**: "Enter specification name"
- **Description**: "This will be displayed in the header and used as the API title"
- **Style**: 
  - White background
  - Light gray border
  - Blue focus ring (2px) with transparent border on focus
  - Rounded corners
- **Behavior**: 
  - Changes update header in real-time
  - Auto-saves to local storage
  - No manual save required

#### 2. Specification Version
- **Label**: "Specification Version"
- **Type**: Text input field
- **Placeholder**: "1.0.0"
- **Description**: "Version number for your API specification"
- **Style**: Same as Specification Name field
- **Behavior**: 
  - Changes update header in real-time
  - Auto-saves to local storage
  - Recommend semantic versioning format (e.g., 1.0.0)

#### 3. OpenAPI Version (Read-Only)
- **Label**: "OpenAPI Version"
- **Type**: Display field (non-editable)
- **Value**: "3.0.0" (currently fixed)
- **Style**: Gray background indicating read-only status
- **Description**: "Read-only field showing the OpenAPI specification version"
- **Behavior**: Cannot be edited in current version

### Save Status Indicator
- **Display**: Blue box with icon 💾 and text "Saving..."
- **Location**: Above form fields
- **Visibility**: Shows while data is being saved to local storage
- **Auto-Hide**: Disappears once save completes (typically instant)

### Usage Flow
1. Open editor → Info panel displays by default
2. Enter specification name (e.g., "User API", "Product Service")
3. Enter specification version (e.g., "1.0.0", "2.1.5")
4. Observe header updates with your entries
5. Changes persist automatically

---

## Paths Management

### Overview
The Paths section allows you to define API endpoint paths (e.g., "/users", "/products/{id}") and manage operations for each path.

### Adding a New Path

#### Entry Point
- Click the green "+ Add Path" button in the sidebar Paths section
- Alternatively, click the "Add Path" button in the main panel

#### New Path Form Appearance
- **Location**: Main content panel
- **Background**: White
- **Form Title**: "New Path" or similar heading

#### Form Fields

##### Path Name Input
- **Label**: "Path" or "Path Name"
- **Type**: Text input field
- **Placeholder**: "/users", "/products/{id}", "/api/v1/orders"
- **Style**: 
  - White background with border
  - Blue focus ring
  - Rounded corners
- **Validation**: 
  - Should support variable path parameters (curly braces: {id}, {userId})
  - Accept slash-separated path structure

#### HTTP Method Buttons
- **Display**: Row of buttons below path input
- **Methods Available**:
  - GET (blue color)
  - POST (green color)
  - PUT (orange/amber color)
  - DELETE (red color)
  - PATCH (purple color)
  - HEAD (gray color)
  - OPTIONS (gray color)
- **Style**: 
  - Each button color-coded by method type
  - Clickable to add operation
  - Changes appearance when operation added (grayed out or marked as "added")
- **Behavior**: Click to open operation creation modal

#### Save Operations
- **Cancel Button**: Discards the path form, returns to paths list
- **Create/Save Button**: Saves path with all added operations, returns to paths list

### Path Selection and Editing

#### Selecting a Path
- Click any path in the sidebar list or main panel
- **Visual Feedback**: 
  - Selected path highlights with blue border
  - Blue background
  - "Selected" label appears
  - Operations list shows below path

#### Path List Display
- **Location**: Sidebar Paths section or main panel
- **For Each Path**:
  - Path name (e.g., "/users")
  - Expandable operations list
  - Ability to select/deselect by clicking

#### Operations Display for Selected Path
- **Location**: Below path name in form
- **For Each Operation**:
  - HTTP method (GET, POST, etc.) with color coding
  - Operation summary/name
  - Click to select individual operation
  - Visual highlight when selected (blue ring, shadow)

### Path Deletion
- Select a path
- Look for delete/remove button
- Confirm deletion in modal dialog
- Path and all operations are removed

---

## Operations Management

### Adding Operations to a Path

#### Entry Point
- Select a path from the list
- Click the green "+ Add Operation" button that appears below the selected path
- Or click an HTTP method button in the path editing form

#### Operation Creation Modal

##### Modal Appearance
- **Title**: "Add Operation" or "Add [METHOD] Operation"
- **Background**: White with shadow/overlay
- **Position**: Centered on screen

##### Form Fields

###### HTTP Method Selection
- **Label**: "Method"
- **Type**: Dropdown/Select field
- **Options**: 
  - GET
  - POST
  - PUT
  - DELETE
  - PATCH
  - HEAD
  - OPTIONS
- **Required**: Yes
- **Validation**: Confirm button disabled until method selected

###### Operation Summary
- **Label**: "Summary"
- **Type**: Text input field
- **Placeholder**: "e.g., Get all users, Create new product"
- **Description**: Brief description of what the operation does
- **Required**: Yes
- **Validation**: Confirm button disabled until filled
- **Character Limit**: Reasonable limit for short summary (e.g., 120 characters)

###### Operation Description (Optional)
- **Label**: "Description"
- **Type**: Textarea field
- **Placeholder**: "Detailed description of the operation..."
- **Required**: No
- **Behavior**: Optional additional details about the operation

##### Modal Buttons
- **Cancel Button**: Closes modal without saving
- **Confirm/Create Button**: 
  - Disabled until Method and Summary are filled
  - Creates operation and closes modal
  - Updates path with new operation

### Operation Selection and Display

#### Selecting an Operation
- Click on an operation in the operations list
- **Visual Feedback**:
  - Operation highlights with blue ring and shadow
  - Operation details display prominently in large text
  - Selected operation color intensifies

#### Operation Details Display
- **HTTP Method**: Large text showing method name (e.g., "GET", "POST")
- **Operation Summary**: Displayed prominently
- **Operation Description**: Shows full description if provided
- **Color Coding**: Method color used for visual identification

#### Delete Operation Option
- **Trigger**: When operation is selected
- **Button Appearance**: Red "Delete Operation" button appears
- **Action**: Click to open delete confirmation

### Deleting Operations

#### Delete Confirmation Modal
- **Title**: "Delete Operation" or "Confirm Delete"
- **Warning Message**: "Are you sure you want to delete this operation? This action cannot be undone."
- **Visual Alert**: Warning icon or red styling
- **Buttons**:
  - "Cancel": Closes modal without deleting
  - "Confirm Delete" or "Yes": Removes operation from path

#### After Deletion
- Operation is removed from list
- HTTP method button returns to available state
- Selection clears
- Changes auto-save to local storage

### Visual Style for Operations

#### Color Coding by Method
- **GET**: Blue (#3B82F6 or similar)
- **POST**: Green (#10B981 or similar)
- **PUT**: Orange/Amber (#F59E0B or similar)
- **DELETE**: Red (#EF4444 or similar)
- **PATCH**: Purple (#A855F7 or similar)
- **HEAD**: Gray (#6B7280 or similar)
- **OPTIONS**: Gray (#6B7280 or similar)

#### Operation Display States
- **Unselected**: Default color with light background
- **Selected**: More saturated color with blue ring border-2 and shadow
- **Hover**: Slightly darker color, cursor changes

---

## Schemas Panel

### Purpose
Define reusable data models and schemas that can be referenced across multiple API operations.

### Panel Layout
- **Title**: "Schemas" (large, bold)
- **Header Button**: Blue "+ Add Schema" button (top right)
- **Subtitle**: "Define reusable data models and schemas for your API"

### Empty State
When no schemas are defined:
- **Icon**: Large 📦 emoji 
- **Heading**: "No schemas defined yet"
- **Description**: "Click the 'Add Schema' button to create your first reusable data model"
- **Style**: Dashed border box with light background

### Schemas List
When schemas exist:
- **Display**: Stack of schema cards
- **For Each Schema**:
  - Schema name in monospace font (e.g., "User", "Product")
  - Card background with border
  - "Schema definition" label
  - Hover effect (border color changes)

### Add Schema Button
- **Label**: "+ Add Schema"
- **Position**: Top right of panel
- **Style**: Blue background, white text
- **Hover**: Darker blue background
- **Action**: Opens schema creation form (feature in development)

### Information Box
- **Location**: Bottom of panel
- **Title**: "About Schemas"
- **Content**: Explanation of what schemas are:
  - "Schemas define the structure of request and response objects in your API."
  - "By defining reusable schemas in this section, you can reference them across multiple operations, keeping your specification DRY and maintainable."
- **Style**: Light gray background with border

---

## Export & Persistence

### Auto-Save / Local Storage

#### How It Works
- Every change you make is automatically saved to your browser's local storage
- No manual "Save" button is needed
- No cloud sync or server communication
- All data persists between browser sessions

#### What Gets Saved
- Specification name and version
- All API paths and their operations
- All operations with methods, summaries, descriptions
- All defined schemas
- Last modified timestamp

#### Save Status Indicator
- Brief "💾 Saving..." message appears in Info panel when data is being saved
- Indicator disappears once save completes (usually instant)

### YAML Export

#### Export Button Location
- **Position**: Top right of header area
- **Label**: "Export"
- **Style**: Blue button, clearly visible
- **Availability**: Accessible from any editor screen (Info, Paths, Schemas)

#### Export Process
1. Click the "Export" button in the header
2. YAML file automatically downloads to your computer
3. File saved to your browser's default download folder
4. No dialog or additional steps required

#### Exported File Details

##### Filename
- **Default**: Uses specification name entered in Info panel
- **Example**: If spec name is "User API", file is `user-api.yaml`
- **Fallback**: If no name provided, defaults to `openapi.yaml`
- **Format**: Lowercase with hyphens replacing spaces

##### File Contents
- Complete OpenAPI 3.0 specification
- Includes all paths, operations, schemas
- Valid YAML format
- No validation or modification (exported as-is)
- Can be used in other OpenAPI tools or API platforms

##### Browser Compatibility
- Uses standard browser download mechanism
- File downloads directly to default download location
- Works in all modern browsers
- No additional software needed

### Loading Existing Specifications

#### Load Screen (Accessed from Welcome Page)
- Click "Load" button on Welcome page
- Displays list of specifications from local storage
- Each spec shows:
  - Specification name
  - API version
  - Last modified date/time
  - Duration since last edit (e.g., "2 hours ago")

#### Selecting a Specification
- Click any specification in the list
- Editor opens with that specification loaded
- Resume editing where you left off

#### Importing External Specifications
- Look for "Import" option on Load screen
- Select a previously exported YAML or JSON file from your computer
- Specification loads into editor
- Can then be edited like any other specification

#### Deleting Specifications
- From Load screen, click specification
- Delete/remove button appears
- Confirm deletion (cannot be undone)
- Specification removed from local storage

---

## Keyboard & Interaction Patterns

### Input Fields
- **Focus Ring**: Blue outline on focus (2-4px)
- **Placeholder Text**: Gray text showing example or hint
- **Label Association**: All inputs have associated labels
- **Focus Order**: Logical left-to-right, top-to-bottom

### Buttons
- **Hover**: Slight color darkening or shadow increase
- **Focus**: Blue outline ring (4px with 50% opacity)
- **Active/Pressed**: Slightly darkened color
- **Disabled**: Grayed out, cursor indicates disabled

### Modals
- **Backdrop**: Semi-transparent dark overlay
- **Closing**: Cancel button or clicking outside (if enabled)
- **Focus Trap**: Tab key cycles through modal controls
- **ESC Key**: May close modal (depends on implementation)

### Responsive Breakpoints
- **Mobile** (< md): Single column layouts, full-width buttons
- **Desktop** (md+): Multi-column layouts, side-by-side elements
- **Touch**: Larger tap targets (48px minimum recommended)

---

## Data Structure & Storage

### Specification Object (Conceptual)
```
{
  name: "API Name",           // Specification name
  specVersion: "1.0.0",       // API version
  openAPIVersion: "3.0.0",    // Fixed OpenAPI version
  content: {
    paths: {                  // All defined paths
      "/users": {
        get: { summary: "", description: "" },
        post: { summary: "", description: "" }
      }
    },
    components: {
      schemas: {              // All defined schemas
        "User": { /* schema definition */ },
        "Product": { /* schema definition */ }
      }
    }
  },
  createdAt: "2024-01-01T00:00:00Z",     // Creation timestamp
  lastModified: "2024-01-02T12:30:00Z"   // Last edit timestamp
}
```

---

## Common Workflows

### Workflow 1: Create New API Spec
1. Open Welcome page
2. Click "Create" button
3. Info panel displays
4. Enter API name (e.g., "Product Catalog API")
5. Enter version (e.g., "1.0.0")
6. Click "Paths" in sidebar
7. Click "+ Add Path"
8. Enter path (e.g., "/products")
9. Click HTTP method button (e.g., GET)
10. Enter summary and description
11. Click "Confirm"
12. Repeat for more operations
13. Click "Export" to download YAML file

### Workflow 2: Load and Continue Editing
1. Open Welcome page
2. Click "Load" button
3. Click previously saved specification
4. Editor opens with your work
5. Make edits to paths, operations, or info
6. Changes auto-save
7. Click "Export" when ready to download

### Workflow 3: Import External Spec
1. Have an exported spec file on computer
2. Click "Load" on Welcome page
3. Click "Import" button
4. Select your spec file
5. Specification loads into editor
6. Continue editing as normal

### Workflow 4: Add Multiple Operations to Path
1. Navigate to Paths section
2. Select existing path or add new
3. Click "+ Add Operation" or method button
4. Fill operation details (method, summary)
5. Click "Confirm"
6. Repeat for additional methods on same path
7. View all operations listed under path
8. Click operations to view/edit details

### Workflow 5: Delete and Replace Operation
1. Select path with operation to remove
2. Click operation to highlight it
3. Click "Delete Operation" button
4. Confirm deletion in modal
5. Add new operation using "+ Add Operation"
6. Fill new operation details
7. Confirm to add

---

## Technical Notes for Recreation

### Technology Stack Assumptions
- React-based frontend (Hook-based components)
- Tailwind CSS for styling (color names: slate, blue, green, red, etc.)
- TypeScript for type safety
- Vite for build/dev server
- Local Storage API for persistence
- No backend server required

### Key Implementation Details
- Components are function-based with React Hooks
- State management via useState, useCallback, etc.
- Autosave mechanism with debouncing
- Color-coded operations by HTTP method
- Responsive design with Tailwind breakpoints
- Modal dialogs for confirmations and forms
- Accordion-style collapsible sections
- Blue focus rings (2-4px) for accessibility
- Smooth transitions and hover effects

### Browser APIs Used
- Local Storage (for persistence)
- Blob API (for YAML export)
- File Download API (using anchor element)
- Responsive design via CSS media queries

---

## Feature Roadmap Reference

The following features are planned or in development:
- **Schemas Creation**: Ability to add and edit schemas
- **Operation Parameters**: Add request/response parameters to operations
- **Validation**: Real-time validation of OpenAPI spec compliance
- **Search/Filter**: Find paths and operations quickly
- **Import Formats**: Support for JSON and other formats
- **Multi-user Collaboration**: Cloud sync (future phase)
- **API Testing**: Built-in testing interface
- **Version Selection**: Choose between OpenAPI 3.0 and 3.1

---

## Accessibility & UX

### Text Hierarchy
- Titles: Large, bold (text-3xl, text-5xl)
- Labels: Medium, semibold (text-sm with medium weight)
- Body text: Regular size, medium color
- Descriptions: Smaller text in gray (text-xs, slate-500)

### Color Contrast
- All text meets WCAG AA contrast requirements
- Blue elements compatible with colorblindness patterns
- Method colors chosen for distinction

### Keyboard Navigation
- All interactive elements reachable via Tab key
- Enter key confirms selections
- ESC key closes modals
- Focus indicators clearly visible (blue rings)

### Responsive Layout
- Desktop: Optimized for large screens, side-by-side content
- Tablet: Adjusted spacing and column counts
- Mobile: Single column, full-width elements, larger touch targets

---

## Tips for Users

1. **Naming Conventions**: Use clear, descriptive names for paths and operations (e.g., "/users/{userId}" instead of "/u/{i}")

2. **Versioning**: Follow semantic versioning (major.minor.patch) e.g., 1.0.0, 2.1.5

3. **Documentation**: Use summaries for brief descriptions, operation descriptions for detailed info

4. **Regular Exports**: Export your spec regularly to create backups

5. **Browser Storage Limits**: Local storage has limits (usually 5-10MB per domain). Monitor for warnings

6. **Spec Portability**: Export as YAML to use in other OpenAPI tools, APIs platforms, or code generators

---

## Support & Troubleshooting

### Issue: Changes not appearing in header
**Solution**: Changes auto-save with slight delay. Refresh page if needed.

### Issue: Cannot delete specification from Load screen
**Solution**: Confirm deletion in the modal dialog. Some browsers may require additional confirmation.

### Issue: Export file has wrong filename
**Solution**: Ensure specification name is set in Info panel. Empty names default to "openapi.yaml"

### Issue: Local storage quota exceeded
**Solution**: Export specs and delete old ones. Or clear browser cache (be careful: this deletes all specs)

### Issue: Cannot import specification
**Solution**: Ensure file is valid YAML/JSON format. Try exporting from another spec to verify format.

---

## End of User Guide

This document comprehensively describes Stop Cri Studio from a user perspective. Use it to recreate the application while maintaining all features and UI patterns described above.

