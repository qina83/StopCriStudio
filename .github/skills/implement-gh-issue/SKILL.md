---
name: implement-gh-issue
description: 'Implement a GitHub issue using MCP server to retrieve info and open a PR'
---

# Implement GitHub Issue with MCP Server

Your goal is to implement a GitHub issue and open a pull request after completion.

## Specific Instructions

### Step 1: Retrieve Issue Information
- Use MCP GitHub tools to fetch the issue details (title, description, labels, assignees)
- Use `mcp_io_github_git_issue_read` to get the full issue content
- Read any linked issues, sub-issues, or related context
- Understand acceptance criteria and requirements from the issue body

### Step 2: Plan Implementation
- Break down the work into logical tasks
- Identify what changes are needed (files to create/modify)
- Review existing code related to the issue
- Consider test coverage requirements (E2E tests preferred over unit tests)
- Reference the issue number in your plan (e.g., "Fixes #123")

### Step 3: Implement Solution
- Make focused changes addressing the issue requirements
- Follow the codebase conventions and style
- Commit changes with clear messages referencing the issue (e.g., "Implement feature (fixes #123)")
- Write end-to-end tests using Playwright if implementing features or fixes
- Tests should run on **Chromium only** (configured in `playwright.config.ts`)
- Execute tests to verify implementation works correctly

### Step 4: Open Pull Request
- Use MCP GitHub tools to create a pull request
- Use `mcp_io_github_git_create_pull_request_with_copilot` to draft the PR automatically, OR
- Create the branch and PR manually using git commands
- Include:
  - Descriptive title referencing the issue (e.g., "Implement feature: Description (fixes #123)")
  - Link to the original issue in the PR description
  - Summary of changes made
  - Test coverage details
- Do not merge directly to base branch - always use a pull request

## Tools to Use

- `mcp_io_github_git_issue_read` - Retrieve issue details
- `mcp_io_github_git_search_issues` - Find related issues
- `mcp_io_github_git_create_pull_request_with_copilot` - Create PR with implementation
- `mcp_gitkraken_git_add_or_commit` - Commit changes
- `mcp_gitkraken_git_push` - Push changes to remote

## Implementation Checklist

- [ ] Issue information retrieved and understood
- [ ] Implementation plan created
- [ ] Code changes made and tested
- [ ] Tests written and passing (E2E preferred)
- [ ] Tests run successfully on Chromium
- [ ] Pull request created and linked to issue
- [ ] Commit messages reference issue number
