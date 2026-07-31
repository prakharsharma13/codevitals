# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-08-01

### Added

- Initial release of the CodeVitals MCP server.
- `health_check` tool — reports server status, version, and runtime info.
- `analyze_repository` tool — returns repository metadata, a weighted health
  score, and a deterministic summary.
- Analyzers: dependency, framework, git, metrics, architecture, security,
  dependency-health, dead-code, and code-quality.
- Weighted repository health scoring across security, architecture,
  dependencies, maintainability, and metrics.
- stdio transport with graceful tool-level error handling.

[Unreleased]: https://example.com/compare/v0.1.0...HEAD
[0.1.0]: https://example.com/releases/tag/v0.1.0
