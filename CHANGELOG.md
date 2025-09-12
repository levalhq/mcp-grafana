# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2024-12-09

### Fixed
- Corrected version display in CLI (was showing 0.1.0, now shows correct version)

### Added
- Quick setup commands for Claude Desktop in README
- Copy-paste terminal commands for macOS/Linux and Windows

## [1.0.1] - 2024-12-09

### Changed
- Updated package name from @leval/mcp-server to @leval/mcp-grafana
- Updated all documentation references to new package name

## [1.0.0] - 2024-12-09

### Added
- Complete TypeScript/JavaScript implementation of MCP Grafana server
- All 43 Grafana tools across 13 categories:
  - Dashboard management (5 tools)
  - Data source operations (3 tools)
  - Prometheus queries (5 tools)
  - Loki log analysis (5 tools)
  - Incident management (4 tools)
  - Alert management (3 tools)
  - OnCall schedules (5 tools)
  - Sift investigations (4 tools)
  - Pyroscope profiling (4 tools)
  - Admin operations (2 tools)
  - Navigation (1 tool)
  - Asserts (1 tool)
  - Search (1 tool)
- Support for all major MCP clients:
  - Claude Desktop
  - Claude Code (VS Code)
  - Cursor
  - Zed
  - Continue.dev
  - Windsurf
  - Codex
- Multiple authentication methods:
  - Service account tokens (recommended)
  - API keys
  - Basic authentication
  - mTLS support
- Comprehensive documentation and setup scripts
- Interactive setup script for automatic configuration
- Example configurations for all supported clients

### Changed
- Migrated from Go to TypeScript/JavaScript
- Changed from binary distribution to npm package
- Installation via npm/npx instead of go install

### Breaking Changes
- Package installation method changed from `go install` to `npm install`
- Binary name changed from compiled Go binary to Node.js script
- Configuration now uses Node.js environment variables

## Pre-1.0.0

### Previous Go Implementation
The original Go implementation can be found in the git history.
Key features of the Go version:
- 66 tools organized in similar categories
- Binary distribution
- SSE and HTTP transport support
- Docker container support