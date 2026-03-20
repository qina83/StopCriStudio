# Create GitHub Epic with User Story Sub-Issues

## Purpose
Create a GitHub epic issue with all associated user stories as linked sub-issues (child issues).

## When to Use This Skill
- Creating an epic issue that encompasses multiple user stories
- Converting user stories from `docs/USER-STORIES.md` into GitHub issues
- Organizing work hierarchically: epic → user stories → tasks

## Prerequisites
- User stories must be defined in `docs/USER-STORIES.md` following the format:
  ```
  ## Epic N: [Epic Title]
  ### US-N.M: [User Story Title]
  **As a** [role] **I want to** [action] **So that** [benefit]
  **Acceptance Criteria:** [list of criteria]
  **Story Points:** [number]
  ```
- GitHub repository must be accessible
- User must have permission to create issues and manage issue relationships

## Step-by-Step Procedure

### 1. Identify the Epic
- Read `docs/USER-STORIES.md` to find the epic
- Extract the epic title (e.g., "File Management")
- Identify all user stories under that epic (marked with `### US-N.M:`)

### 2. Create the Epic Issue
Use `mcp_io_github_git_issue_write` with:
- **method**: `create`
- **title**: Epic title (e.g., "Epic: File Management")
- **body**: Include:
  - Epic description/purpose
  - List of associated user story IDs
  - Link to full spec if applicable
- **labels**: `["epic"]` (create the label if it doesn't exist)

### 3. Create User Story Issues
For each user story under the epic:

Use `mcp_io_github_git_issue_write` with:
- **method**: `create`
- **title**: User story title (e.g., "US-1.1: Create New OpenAPI Specification")
- **body**: Include full user story from USER-STORIES.md:
  - As a / I want to / So that
  - Acceptance Criteria (as numbered list)
  - Story Points
- **labels**: `["user-story"]` (create the label if it doesn't exist)

### 4. Link User Stories to Epic
For each created user story issue:

Use `mcp_io_github_git_sub_issue_write` with:
- **method**: `add`
- **issue_number**: Epic issue number
- **sub_issue_id**: User story issue ID (get this from the created issue response)

## Important Notes

### Tool: `mcp_io_github_git_sub_issue_write`
This tool manages parent-child relationships between issues:
```
- method: "add" → adds a sub-issue to a parent
- method: "remove" → removes a sub-issue from a parent
- method: "reprioritize" → changes order of sub-issues
```

### Creating Labels
If required labels don't exist, create them first using `mcp_io_github_git_issue_write` with appropriate labels parameter.

### Order of Operations
1. ✅ Read USER-STORIES.md
2. ✅ Create epic issue → get epic issue number
3. ✅ Create all user story issues → collect issue IDs
4. ✅ Link each user story to epic (parallel safe)

### Common Mistakes to Avoid
- ❌ Forgetting to extract issue numbers from created issues before linking
- ❌ Skipping user story issues and only creating the epic
- ❌ Not using the correct issue IDs when calling `mcp_io_github_git_sub_issue_write`
- ❌ Creating sub-issue links in the wrong direction (user story should be a child of epic, not vice versa)

## Example Workflow
```
INPUT: Epic 1: File Management (with US-1.1, US-1.2, US-1.3)

Step 1: Create issue "Epic: File Management" → Issue #42
Step 2: Create issue "US-1.1: Create New OpenAPI Specification" → Issue #43
Step 3: Create issue "US-1.2: Upload Existing OpenAPI File" → Issue #44
Step 4: Create issue "US-1.3: Export Specification as JSON" → Issue #45
Step 5: Link #43 to #42 as sub-issue
Step 6: Link #44 to #42 as sub-issue
Step 7: Link #45 to #42 as sub-issue

RESULT: Epic #42 contains #43, #44, #45 as child issues
```

## Repository Details
- Owner: `cristianogiulioni`
- Repo: `StopCriStudio`
- User Stories Source: `docs/USER-STORIES.md`
