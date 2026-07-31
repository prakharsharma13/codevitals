# CodeVitals

[![npm version](https://img.shields.io/npm/v/@prakhhxrcodes/codevitals.svg)](https://www.npmjs.com/package/@prakhhxrcodes/codevitals)
[![CI](https://github.com/prakharsharma13/codevitals/actions/workflows/ci.yml/badge.svg)](https://github.com/prakharsharma13/codevitals/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@prakhhxrcodes/codevitals.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)

**AI-powered Repository Health Analysis & Project Intelligence MCP Server.**

## Overview

CodeVitals is a [Model Context Protocol](https://modelcontextprotocol.io) (MCP)
server that inspects a local repository and reports its metadata, a weighted
health score, and a human-readable summary — entirely offline, with no external
API calls. It is designed to be spawned by an MCP-compatible client (such as an
AI assistant) and communicates over stdio.

## Features

- **Repository analysis** — dependency counts, framework detection, git status, and file metrics.
- **Architecture detection** — project type, package manager, language, Docker, CI, and test setup.
- **Security analysis** — sensitive files, `.env`/`.gitignore` checks, and hardcoded-secret scanning.
- **Dependency health** — duplicate, unused, and unpinned dependency detection.
- **Dead code detection** — unused files, orphan files, empty directories, and large files.
- **Code quality** — file-size distribution, large-function, deep-folder, and naming warnings.
- **Health score** — a weighted 0–100 score across security, architecture, dependencies, maintainability, and metrics.
- **Deterministic summary** — strengths, weaknesses, warnings, and quick wins. No LLM involved.

## Requirements

- Node.js **>= 22**

## Installation

Install globally:

```bash
npm install -g @prakhhxrcodes/codevitals
```

Or run it without installing:

```bash
npx @prakhhxrcodes/codevitals
```

### From source

```bash
git clone https://github.com/prakharsharma13/codevitals.git
cd codevitals
npm install
npm run build
```

## CLI Usage

CodeVitals ships a single executable, `codevitals`, that launches the MCP server
over stdio:

```bash
codevitals
```

The process is **not** an interactive command-line tool — it does not take
subcommands or arguments. It starts a server that waits for an MCP client to
connect over stdin/stdout. Running it directly in a terminal is mainly useful
for verifying that it starts (it prints a startup message to stderr and then
waits). In normal use it is launched automatically by an MCP client (see below).

## MCP Usage

Register CodeVitals with any MCP-compatible client. Example client
configuration:

```json
{
  "mcpServers": {
    "codevitals": {
      "command": "npx",
      "args": ["@prakhhxrcodes/codevitals"]
    }
  }
}
```

If installed from source, point the client at the built entry file instead:

```json
{
  "mcpServers": {
    "codevitals": {
      "command": "node",
      "args": ["/absolute/path/to/codevitals/dist/index.js"]
    }
  }
}
```

### Tools

#### `health_check`

Checks whether the CodeVitals MCP server is running. No input.

#### `analyze_repository`

Analyzes a repository and returns its metadata, health score, and summary.

| Field            | Type     | Description                              |
| ---------------- | -------- | ---------------------------------------- |
| `repositoryPath` | `string` | Absolute path to the repository to scan. |

## Configuration

CodeVitals requires no environment variables or configuration files. Analysis
thresholds (for example, the large-file and deep-folder limits used by the
dead-code and code-quality analyzers) ship with sensible defaults defined in
their respective analyzers. The only per-call input is `repositoryPath`, passed
to the `analyze_repository` tool.

## Example Outputs

`analyze_repository` returns a JSON document combining three sections:

```json
{
  "analysis": {
    "dependencyCount": 2,
    "devDependencyCount": 2,
    "framework": "Unknown",
    "isGitRepository": false,
    "commitCount": 0,
    "totalFiles": 45,
    "totalDirectories": 9,
    "totalLines": 3290,
    "projectType": "Node",
    "packageManager": "npm",
    "language": "TypeScript",
    "hasDocker": false,
    "hasCI": false,
    "hasTests": false
  },
  "health": {
    "overallScore": 86,
    "securityScore": 100,
    "dependencyScore": 100,
    "maintainabilityScore": 97,
    "architectureScore": 35,
    "summary": "Repository health: Excellent (86/100)."
  },
  "summary": {
    "strengths": ["Uses TypeScript.", "Security risk is Low."],
    "weaknesses": ["Missing Docker support.", "CI/CD pipeline not configured."],
    "warnings": [],
    "quickWins": ["Add a Dockerfile.", "Add a CI workflow."],
    "overallSummary": "Repository scored 86/100. Security risk is Low."
  }
}
```

## Architecture

CodeVitals follows a strict layered architecture with constructor dependency
injection and a single composition root:

- **`index.ts`** — bootstraps the process: creates the server, wires the stdio transport, and connects.
- **`server/`** — `create-server.ts` assembles the application; `dependencies.ts` constructs every dependency.
- **`tools/`** — MCP tool registration only; the sole layer aware of the MCP SDK.
- **`services/`** — orchestration and scoring; coordinate analyzers without doing I/O.
- **`analyzers/`** — pure analysis logic; never import the MCP SDK.
- **`infrastructure/`** — filesystem, git, and scanning; no business logic.
- **`types/`, `utils/`, `constants/`** — shared, dependency-free helpers.

Dependencies always point inward: tools → services → analyzers → infrastructure.
Analyzers and infrastructure never depend on the MCP layer.

## Folder Structure

```
src/
  index.ts            # entry point (stdio transport)
  server/             # server assembly + dependency wiring
  tools/              # MCP tool registration
  services/           # orchestration + scoring + summary
  analyzers/          # analysis logic
  infrastructure/     # filesystem, git, scanning
  types/              # shared interfaces
  utils/, constants/  # helpers
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and
guidelines. Please make sure `npm run build` and `npm run typecheck` pass before
opening a pull request.

## FAQ

**Does CodeVitals send my code anywhere?**
No. All analysis runs locally. There are no network or external API calls.

**Does it require an API key or an LLM?**
No. The health score and summary are fully deterministic.

**Which languages does it analyze?**
It targets JavaScript/TypeScript projects (it reads `package.json` and scans
common source extensions), but file, git, and structural metrics apply to any
repository.

**Can I run it as a standalone CLI report?**
Not yet — it currently runs as an MCP server. A standalone reporting mode is on
the roadmap.

## Troubleshooting

**The server starts and then exits immediately.**
That is expected when it is run directly without an MCP client: with no client
attached to stdin, the stdio transport reaches end-of-input and shuts down. Run
it through an MCP client instead.

**`analyze_repository` returns an error.**
Ensure `repositoryPath` is an absolute path to a directory that contains a
`package.json`. The tool returns a descriptive error message when the path is
missing or unreadable.

**`npx @prakhhxrcodes/codevitals` cannot be found.**
Make sure the package name is spelled correctly (including the `@prakhhxrcodes/`
scope) and that your Node.js version is 22 or newer.

## Roadmap

- Standalone CLI reporting mode
- HTML / PDF report output
- GitHub integration
- npm registry integration for outdated-dependency checks
- AI-generated insights
- Plugin system for custom analyzers

## License

[MIT](LICENSE) © Prakhar Sharma
