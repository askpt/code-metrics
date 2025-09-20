# Code Metrics

A Visual Studio Code extension that calculates and displays **Cognitive Complexity** metrics based on [SonarSource's Cognitive Complexity specification](https://www.sonarsource.com/docs/cognitiveComplexity/).

## Features

- **Real-time Analysis**: Analyzes code metrics as you write code
- **CodeLens Integration**: Shows complexity scores directly above functions
- **Color-coded Indicators**: Visual feedback with green/yellow/red status based on configurable thresholds
- **Multi-language Support**: Currently supports C# with more languages planned
- **Configurable Thresholds**: Customize warning and error complexity thresholds
- **Smart Exclusions**: Automatically excludes test files, build artifacts, and other specified patterns

### What is Cognitive Complexity?

Cognitive Complexity is a metric that measures how difficult code is to understand. Unlike Cyclomatic Complexity, it considers the cognitive burden of code constructs:

- **Linear code**: No complexity increase
- **Nested structures**: Higher complexity for deeply nested code  
- **Breaks in control flow**: Additional complexity for jumps and returns
- **Recursive calls**: Extra complexity penalty

## Requirements

- Visual Studio Code 1.103.0 or higher
- Supported language files for analysis

## Extension Settings

This extension contributes the following settings:

- `codeMetrics.enabled`: Enable or disable the code metrics extension (default: `true`)
- `codeMetrics.showCodeLens`: Show code metrics information as CodeLens above functions (default: `true`)
- `codeMetrics.warningThreshold`: Metrics threshold for showing warning status with yellow indicator (default: `10`)
- `codeMetrics.errorThreshold`: Metrics threshold for showing error status with red indicator (default: `15`)
- `codeMetrics.excludePatterns`: Glob patterns for files to exclude from metrics analysis (default: excludes node_modules, dist, build, out, minified files, and test files)

## Installation

Install from the [VS Code Extension Marketplace](https://marketplace.visualstudio.com/vscode) or search for "code-metrics" in the Extensions view.

## Usage

1. Open a supported language file in VS Code
2. The extension will automatically analyze code metrics
3. Complexity scores appear as CodeLens above each function
4. Color coding indicates complexity level:
   - **Green**: Below warning threshold (good)
   - **Yellow**: Above warning threshold (review recommended)  
   - **Red**: Above error threshold (refactoring recommended)

## Development Setup

### Prerequisites

- Node.js 22.x
- npm 10.9.x or higher

### Building from Source

```bash
# Clone the repository
git clone https://github.com/askpt/code-metrics.git
cd code-metrics

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run linter
npm run lint

# Run tests (requires VS Code)
npm test
```

### GitHub Codespaces

This project is configured to work with GitHub Codespaces:

1. Click the "Code" button on the GitHub repository
2. Select "Codespaces" tab  
3. Click "Create codespace on main"

The development environment will be automatically configured with Node.js 22.x and all necessary dependencies.

### Development Commands

- `npm run compile`: Compile TypeScript to JavaScript
- `npm run watch`: Auto-compile on file changes
- `npm run lint`: Run ESLint
- `npm test`: Run extension tests

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
