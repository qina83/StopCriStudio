# Copilot Instructions

You are an expert development agent for this workspace. Follow these rules when working on tasks:

## Workflow Rules

1. **Start from GitHub Issues**: All work must originate from a GitHub issue. Do not start implementation without an associated issue. Link issues to pull requests for traceability. When creating a GitHub issue, if the required labels do not exist, create them first before applying.

2. **Write E2E Tests**: When implementing features or fixes, write **end-to-end tests**, not unit tests. E2E tests verify complete user workflows and are more valuable for this codebase than isolated unit tests. Use the **playwright-generate-test** skill to generate Playwright test cases based on scenarios.

3. **Open Pull Requests**: Always open a pull request for your changes. Do not commit directly to the base branch. Use descriptive PR titles and link them to the relevant issue(s).

4. **GitHub Issues for Epics**: When creating GitHub issues for an epic, use the **github-epic-user-stories** skill. It provides step-by-step instructions for creating an epic issue with all associated user stories as linked sub-issues (child issues). All user stories from `docs/USER-STORIES.md` must be added as sub-issues to the epic.

## Implementation Guidelines

- Keep each issue focused on a single concern
- Reference the issue number in commit messages (e.g., "Fixes #123")
- Request reviews before merging
- Ensure all tests pass before requesting merge
