# Contributing to Code Metrics

We welcome contributions to the Code Metrics VS Code extension! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x
- npm 10.9.x or higher
- Visual Studio Code
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/code-complexity.git
   cd code-metrics
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Project**
   ```bash
   npm run compile
   ```

4. **Run Tests**
   ```bash
   npm run lint
   npm test
   ```

### GitHub Codespaces

For a quick start, you can use GitHub Codespaces:

1. Click "Code" → "Codespaces" → "Create codespace on main"
2. The environment will be automatically configured with all dependencies

## 🛠️ Development Workflow

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make Your Changes**
   - Write code following the existing patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run compile
   npm run lint
   npm test
   ```

4. **Debug the Extension**
   - Press `F5` in VS Code to launch Extension Development Host
   - Test your changes with sample files in the `samples/` directory

### Code Standards

- **TypeScript**: All source code is in TypeScript
- **ESLint**: Follow the project's ESLint configuration
- **Naming**: Use descriptive names following TypeScript conventions
- **Comments**: Add JSDoc comments for public APIs

### Commit Guidelines

This project follows semantic commit conventions. PR titles must include one of these prefixes:

- `feat:` A new feature
- `fix:` A bug fix  
- `docs:` Documentation only changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring without feature changes
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `build:` Build system changes
- `ci:` CI configuration changes
- `chore:` Other changes that don't modify src or test files

**Example**: `feat: add support for JavaScript complexity analysis`

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Compile and lint before testing
npm run pretest
```

### Writing Tests

- Place tests in `src/test/` following the existing structure
- Use the VS Code test framework and Mocha
- Test files should end with `.test.ts`
- Add test utilities to `src/test/testUtils.ts`

### Test Coverage

Focus testing on:

- Core complexity analysis logic
- Configuration management
- Language-specific analyzers
- Edge cases and error conditions

## 📝 Documentation

### README Updates

When adding features, update:

- Feature descriptions
- Configuration options
- Usage examples
- Requirements

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Include examples in comments where helpful

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Verify the issue with the latest version
3. Test with minimal reproduction steps

### What to Include

- VS Code version
- Extension version
- Operating system
- Sample code that reproduces the issue
- Expected vs actual behavior
- Error messages or console output

## 💡 Feature Requests

### Before Requesting

1. Check existing issues and discussions
2. Consider if the feature fits the extension's scope
3. Think about implementation challenges

### What to Include

- Clear description of the proposed feature
- Use cases and benefits
- Potential implementation approach
- Examples or mockups if applicable

## 🔍 Code Review Process

1. **Automated Checks**: PRs must pass CI checks (build, lint, tests)
2. **Manual Review**: Maintainers review code quality, design, and documentation
3. **Testing**: New features should include appropriate tests
4. **Breaking Changes**: Require discussion and careful consideration

## 📋 Project Structure

```
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── configuration.ts          # Configuration management
│   ├── complexityAnalyzer/       # Core analysis engine
│   │   ├── complexityAnalyzerFactory.ts
│   │   └── languages/           # Language-specific analyzers
│   ├── providers/               # VS Code integrations
│   └── test/                   # Test files
├── samples/                     # Sample files for testing
├── .github/                     # GitHub workflows and config
└── .devcontainer/              # Codespaces configuration
```

## 🏷️ Release Process

Releases are automated using semantic versioning:

1. PRs are merged to `main`
2. Release Please creates release PRs with version bumps
3. Merging release PRs triggers automated publishing

## 📞 Getting Help

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Code**: Review existing code and tests for examples

## 🤝 Code of Conduct

Please be respectful and constructive in all interactions. We aim to create a welcoming environment for contributors of all skill levels.

---

Thank you for contributing to Code Complexity! Your help makes this extension better for the entire VS Code community.
