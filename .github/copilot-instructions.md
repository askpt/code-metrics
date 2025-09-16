# Copilot Coding Agent Instructions

## Repository Overview

**Project Type**: Visual Studio Code Extension  
**Primary Language**: TypeScript  
**Target Runtime**: VS Code Extension Host (Node.js 22.x)  
**Repository Size**: Small-medium (~20 source files)

This repository contains a VS Code extension called "code-complexity" that calculates and displays Cognitive Complexity metrics based on SonarSource's specification. The extension analyzes C# code files and provides CodeLens overlays showing complexity scores with color-coded indicators (green/yellow/red).

**Key Features**:

- Real-time cognitive complexity analysis for C# files
- CodeLens integration showing complexity above functions
- Configurable warning/error thresholds
- Tree-sitter based parsing for accurate analysis

## Build & Development Commands

**Environment Requirements:**

- Node.js 22.x (verified working)
- npm 10.9.x (verified working)
- VS Code for testing (extension development)

**CRITICAL: Always run commands in this exact order for clean builds:**

1. **Install Dependencies** (required first step):

   ```bash
   npm install
   ```

   - Takes ~15-20 seconds
   - Installs TypeScript, ESLint, VS Code test framework, tree-sitter dependencies
   - Must be run before any build/test commands

2. **Compile TypeScript** (always required before testing):

   ```bash
   npm run compile
   ```

   - Equivalent to: `tsc -p ./`
   - Compiles TypeScript source to JavaScript in `out/` directory
   - Takes ~2-3 seconds
   - **ALWAYS run this before testing changes**

3. **Lint Code** (recommended before commits):

   ```bash
   npm run lint
   ```

   - Equivalent to: `eslint src`
   - Uses @typescript-eslint with custom rules
   - Takes ~1-2 seconds

4. **Watch Mode** (for active development):

   ```bash
   npm run watch
   ```

   - Equivalent to: `tsc -watch -p ./`
   - Auto-recompiles on file changes
   - Keep running during development
   - Stop with Ctrl+C

5. **Run Tests** (network dependent - may fail in sandboxed environments):
   ```bash
   npm test
   ```
   - Equivalent to: `npm run pretest && vscode-test`
   - Pretest runs compile + lint automatically
   - **KNOWN ISSUE**: Tests may fail with "getaddrinfo ENOTFOUND" in sandboxed environments due to VS Code download requirements
   - Tests work correctly in local/codespace environments with internet access

**Common Build Issues & Solutions:**

- If compilation fails, ensure TypeScript dependencies are installed: `npm install`
- If tests fail with network errors, this is expected in sandboxed environments
- ESLint may require Node 16+ - we use Node 22.x which works correctly
- Always clean compile before testing: `npm run compile`

## Project Architecture & Layout

### Directory Structure

```
├── .github/                     # GitHub workflows and configuration
│   ├── workflows/
│   │   ├── ci.yml              # Multi-OS CI (Ubuntu, macOS, Windows)
│   │   ├── release.yml         # Automated releases with release-please
│   │   └── validate_pr_title.yml # Semantic PR title validation
│   └── dependabot.yml          # Automated dependency updates
├── .devcontainer/               # GitHub Codespaces configuration
│   ├── devcontainer.json       # Node 22 + extensions + testing setup
│   └── start-xvfb.sh          # Xvfb for headless testing
├── .vscode/                     # VS Code workspace configuration
│   ├── launch.json             # Debug configurations
│   ├── settings.json           # Workspace settings (exclude out/)
│   ├── tasks.json              # Default build task (npm watch)
│   └── extensions.json         # Recommended extensions
├── src/                         # TypeScript source code
│   ├── extension.ts            # Main extension entry point
│   ├── configuration.ts        # Configuration management
│   ├── complexityAnalyzer/     # Core complexity analysis engine
│   │   ├── complexityAnalyzerFactory.ts # Main analyzer factory
│   │   └── languages/          # Folder that includes specific language analyzers
│   ├── providers/              # VS Code integrations
│   └── test/                   # Test files (mirrors src structure)
├── samples/                     # Sample files for testing
├── out/                         # Compiled JavaScript output
├── package.json                # Extension manifest & npm scripts
├── tsconfig.json               # TypeScript configuration
├── eslint.config.mjs           # ESLint configuration
└── .editorconfig               # Code formatting rules
```

### Core Components

**Extension Manifest** (`package.json`):

- Activates on specific language files (`onLanguage:*`)
- Contributes configuration settings for thresholds
- Main entry point: `./out/extension.js`

**Main Extension** (`src/extension.ts`):

- Exports `activate()` and `deactivate()` functions
- Registers CodeLens provider for complexity display

**Configuration** (`src/configuration.ts`):

- Centralized VS Code settings management
- Default thresholds: warning=10, error=15
- Exclude patterns for test files and build outputs

**Complexity Analysis** (`src/complexityAnalyzer/`):

- Factory pattern for language-specific analyzers
- Tree-sitter based parsing for C#
- Returns `UnifiedFunctionComplexity` objects with details

**CodeLens Provider** (`src/providers/codeLensProvider.ts`):

- Implements VS Code CodeLens interface
- Shows complexity scores above functions
- Color-coded based on threshold configuration

### Dependencies

**Runtime Dependencies:**

- `tree-sitter`: ^0.21.1 (code parsing)
- `tree-sitter-c-sharp`: ^0.23.1 (C# language grammar)

**Development Dependencies:**

- `typescript`: ^5.9.2 (compilation)
- `@typescript-eslint/*`: ^8.39.0 (linting)
- `@vscode/test-*`: Testing framework (requires VS Code download)

## CI/CD & Validation

### GitHub Workflows

**Continuous Integration** (`.github/workflows/ci.yml`):

- Runs on: Ubuntu, macOS, Windows
- Node.js 22.x
- Steps: `npm install` → `npm test`
- Linux uses `xvfb-run -a npm test` for headless testing
- **Validates all platforms before merge**

**Release Automation** (`.github/workflows/release.yml`):

- Uses release-please for semantic versioning
- Triggered on main branch pushes
- Automatic changelog generation

**PR Title Validation** (`.github/workflows/validate_pr_title.yml`):

- Enforces conventional commit format
- Required for merge approval

### Manual Validation Steps

1. **Code Changes**: Always run `npm run compile && npm run lint`
2. **Extension Testing**: Use F5 in VS Code to launch extension development host
3. **Sample Testing**: Open `samples/` to verify complexity display
4. **Configuration Testing**: Modify thresholds in VS Code settings

## Development Environment

**GitHub Codespaces** (Recommended):

- Pre-configured with Node 22, required extensions
- Automatic dependency installation
- Xvfb configured for testing
- VS Code Extension development tools

**Local Development**:

- Requires Node.js 22.x
- Install recommended VS Code extensions from `.vscode/extensions.json`
- Use `npm run watch` for active development

## Key Configuration Files

- **`package.json`**: Extension manifest, activation events, configuration schema
- **`tsconfig.json`**: TypeScript compiler settings (ES2022, Node20 modules)
- **`eslint.config.mjs`**: ESLint with TypeScript rules, naming conventions
- **`.vscode-test.mjs`**: Test runner configuration with launch args
- **`.editorconfig`**: Consistent formatting (2 spaces, LF endings)

## Critical Notes for Agents

1. **Always run `npm install` first** - required for TypeScript compilation
2. **Always compile before testing** - `npm run compile` updates the `out/` directory
3. **Tests may fail in sandboxed environments** - this is expected, not a code issue
4. **Extension activates only declared language type files** - test with `samples` files in workspace
5. **Build output is in `out/` directory** - this is the actual extension code
6. **Use samples/\* for complexity validation** - pre-built complex code
7. **Configuration changes require extension restart** - reload VS Code window

## Trust These Instructions

These instructions have been validated by testing all commands and exploring the complete codebase. Only search for additional information if these instructions are incomplete or found to be incorrect. The build process, file locations, and workflows documented here are accurate as of the current repository state.
