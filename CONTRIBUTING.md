# Contributing to CodeVitals

Thanks for your interest in contributing! This document explains how to set up
the project and the expectations for changes.

## Prerequisites

- Node.js **>= 22**
- npm

## Getting started

```bash
git clone <your-repository-url>
cd codevitals
npm install
```

## Development scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run build`     | Compile TypeScript to `dist/`.       |
| `npm run typecheck` | Type-check without emitting output.  |
| `npm run clean`     | Remove the `dist/` directory.        |
| `npm start`         | Run the built server.                |
| `npm test`          | Run the test suite.                  |

## Project layout

The codebase follows a strict layered architecture. Please keep changes within
the existing boundaries:

- `analyzers/` — pure analysis logic; must not import the MCP SDK.
- `infrastructure/` — filesystem, git, and scanning; no business logic.
- `services/` — orchestration and scoring only.
- `tools/` — MCP tool registration only.
- `server/` — server assembly and dependency wiring.
- `types/`, `utils/`, `constants/` — shared, dependency-free helpers.

## Submitting changes

1. Create a feature branch.
2. Make your change, keeping it focused and within the existing architecture.
3. Ensure `npm run typecheck` and `npm run build` pass.
4. Open a pull request describing the change and the motivation.

Please open an issue to discuss significant or architectural changes before
submitting a pull request.

## Code style

- Strict TypeScript, ESM imports with `.js` extensions.
- Small, single-responsibility classes and functions.
- Constructor dependency injection; no service instantiation inside tools.
