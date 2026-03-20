# StopCriStudio - OpenAPI Visual Editor

A React-based web application for visually editing OpenAPI 3.0/3.1 specification files.

## Project Structure

```
├── src/                    # Source code
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   ├── index.css          # Global styles
│   ├── store/             # State management
│   │   └── specStore.ts   # Zustand store for API spec
│   ├── utils/             # Shared utilities
│   │   └── openapi.ts     # OpenAPI parsing and serialization
│   └── components/        # React components (to be created)
│
├── tests/                 # Test files
│   └── e2e/              # End-to-end tests (Playwright)
│
├── docs/                  # Documentation
│   ├── SPEC-openapi-editor.md    # Product specification
│   └── USER-STORIES.md           # User stories
│
├── index.html            # HTML entry point
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── playwright.config.ts  # Playwright E2E test configuration
├── .eslintrc.json        # ESLint configuration
└── .prettierrc           # Prettier configuration
```

## Setup

### Prerequisites
- Node.js 18+
- pnpm 8.15.4+ (use `npm install -g pnpm` to install)

### Installation

```bash
pnpm install
```

## Development

Start the development server:

```bash
pnpm dev
```

The application will open at `http://localhost:3000`.

## Building

Build for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Testing

### E2E Tests

Run E2E tests with Playwright:

```bash
pnpm test:e2e
```

Run tests in UI mode:

```bash
pnpm test:e2e:ui
```

Debug tests:

```bash
pnpm test:e2e:debug
```

## Code Quality

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm type-check
```

## Tech Stack

- **React** 18 - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Swagger Parser** - OpenAPI validation
- **js-yaml** - YAML parsing
- **Playwright** - E2E testing
- **ESLint & Prettier** - Code quality

## Features (In Development)

- ✅ Project scaffolding
- ⬜ File management (create, upload, export)
- ⬜ Visual editing of API specs
- ⬜ Real-time validation
- ⬜ Auto-save to local storage
- ⬜ Import/export JSON and YAML

See [docs/USER-STORIES.md](docs/USER-STORIES.md) for detailed feature specifications.

## Contributing

All work is tracked via GitHub Issues. Create an issue before starting implementation.
See `.github/copilot-instructions.md` for development guidelines.
