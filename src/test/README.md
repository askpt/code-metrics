# Code Complexity Extension - Core Logic Tests

This directory contains unit tests for the core complexity analysis logic of the Code Complexity Visual Studio Code extension. These tests run **without requiring the VS Code environment**, making them suitable for headless CI/CD environments.

## What's Included

### Core Logic Tests Only

The test suite focuses on the core complexity analysis functionality:

1. **`complexityAnalyzer/languages/csharpAnalyzer.test.ts`**
   - Tests for the C# cognitive complexity analyzer
   - Covers parsing, complexity calculation, and AST traversal
   - Tests various C# language constructs and edge cases

2. **`complexityAnalyzer/complexityAnalyzerFactory.test.ts`**
   - Tests for the analyzer factory pattern
   - Language support verification
   - Integration between different analyzer implementations
   - Line/column normalization testing

### Removed Components

The following test files have been **removed** to avoid VS Code environment dependencies:

- `providers/codeLensProvider.test.ts` (VS Code API dependent)
- `integration.test.ts` (VS Code integration tests)
- Full VS Code mock utilities in `testUtils.ts`

## Running the Tests

### Option 1: Custom Test Runner (Recommended)

Use the custom test runner that doesn't require VS Code:

```bash
# Compile the code first
npm run compile

# Run the custom test runner
node ./scripts/test-runner.js
```

This will run a focused set of tests covering:
- C# analyzer functionality
- Factory pattern implementation  
- Language support
- Error handling
- Data normalization

### Option 2: Standard Build Process

The standard npm test command may still try to run VS Code tests:

```bash
npm test  # May require VS Code environment
```

## Test Coverage

### C# Analyzer Tests (`csharpAnalyzer.test.ts`)

**Basic Function Analysis:**
- Simple functions with no complexity
- Functions with single control flow statements
- Functions with multiple complexity contributors

**Control Flow Statements:**
- If/else statements
- Loops (while, for, foreach)
- Switch statements and expressions

**Exception Handling:**
- Try-catch blocks
- Multiple catch clauses

**Logical Operators:**
- AND (`&&`) and OR (`||`) operators
- Complex boolean expressions

**Function Types:**
- Regular methods, constructors, destructors
- Property accessors, operator overloads
- Local functions, expression-bodied methods

**Edge Cases:**
- Empty classes and abstract methods
- Malformed code handling
- Position and nesting information

### Factory Tests (`complexityAnalyzerFactory.test.ts`)

**Language Support:**
- Supported language enumeration
- C# language analysis
- Unsupported language handling

**Data Normalization:**
- Line number normalization (0-based to 1-based)
- Column number normalization
- Nesting level preservation

**Error Handling:**
- Empty and whitespace-only code
- Invalid language identifiers

## What's NOT Tested

The following components require VS Code environment and are not covered:
- Code lens provider functionality
- VS Code workspace integration
- Configuration management through VS Code settings
- Extension activation and registration
- VS Code commands and UI interactions

For testing these components, you would need:
- VS Code Extension Test Environment
- VS Code API mocking
- Headless VS Code setup

## Adding New Core Logic Tests

When adding tests for core analysis logic:

1. **Focus on pure logic** - Avoid VS Code API dependencies
2. **Use inline C# samples** - Don't rely on external files
3. **Test edge cases** - Include malformed code and boundary conditions
4. **Validate data structures** - Ensure complexity objects have correct format

### Example Test Pattern

```typescript
it('should handle specific C# construct', () => {
    const sourceCode = `
        public class Test {
            public void Method() {
                // Your C# code here
            }
        }
    `;
    
    const analyzer = new CSharpCognitiveComplexityAnalyzer();
    const results = analyzer.analyzeFunctions(sourceCode);
    
    assertEqual(results.length, 1);
    assertEqual(results[0].name, 'Method');
    assert(results[0].complexity >= 0);
});
```

## Debugging

### Console Output

The custom test runner provides clear output:
- ✓ for passing tests
- ✗ for failing tests with error messages
- Summary with pass/fail counts

### Adding Debug Information

You can modify the test runner to add more debugging:

```javascript
console.log('Complexity details:', JSON.stringify(results[0].details, null, 2));
```

## CI/CD Integration

These tests are suitable for continuous integration because they:
- Don't require VS Code installation
- Don't require graphical environment  
- Have minimal dependencies (just Node.js and npm packages)
- Run quickly without UI overhead

Example GitHub Actions usage:
```yaml
- name: Run Core Logic Tests
  run: |
    npm ci
    npm run compile  
    node ./scripts/test-runner.js
```

## Running the Tests

### Prerequisites

Make sure you have installed all dependencies:
```bash
npm install
```

### Running All Tests

Use the VS Code test runner:
```bash
npm test
```

Or run through VS Code:
1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run "Test: Run All Tests"

### Running Specific Test Suites

You can run individual test files using the VS Code Test Explorer or by using Mocha directly:

```bash
# Run only C# analyzer tests
npx mocha out/test/complexityAnalyzer/languages/csharpAnalyzer.test.js

# Run only factory tests
npx mocha out/test/complexityAnalyzer/complexityAnalyzerFactory.test.js

# Run only code lens provider tests
npx mocha out/test/providers/codeLensProvider.test.js

# Run integration tests
npx mocha out/test/integration.test.js
```

## Test Coverage

### C# Analyzer Tests (`csharpAnalyzer.test.ts`)

**Basic Function Analysis:**
- Simple functions with no complexity
- Functions with single control flow statements
- Functions with multiple complexity contributors

**Control Flow Statements:**
- If/else statements
- Loops (while, for, foreach)
- Switch statements and expressions

**Exception Handling:**
- Try-catch blocks
- Multiple catch clauses

**Logical Operators:**
- AND (`&&`) and OR (`||`) operators
- Complex boolean expressions

**Conditional Expressions:**
- Ternary operators
- Nested conditional expressions

**Nesting and Lambda Expressions:**
- Nested control structures
- Lambda expressions in different contexts
- Anonymous methods

**Jump Statements:**
- Break and continue statements
- Goto statements

**Function Types:**
- Regular methods
- Constructors and destructors
- Property accessors
- Operator overloads
- Local functions

**Edge Cases:**
- Empty classes and abstract methods
- Interface methods
- Expression-bodied methods
- Nested classes
- Malformed code handling

### Factory Tests (`complexityAnalyzerFactory.test.ts`)

**Language Support:**
- Supported language enumeration
- C# language analysis
- Unsupported language handling

**Data Normalization:**
- Line number normalization (0-based to 1-based)
- Column number normalization
- Nesting level preservation

**Error Handling:**
- Malformed code processing
- Empty and whitespace-only code
- Invalid language identifiers

### Code Lens Provider Tests (`codeLensProvider.test.ts`)

**Configuration Management:**
- Extension enable/disable
- Code lens visibility toggle
- Exclude pattern handling
- Threshold configuration

**Code Lens Generation:**
- Complexity-based filtering
- Icon and title generation
- Command and argument setup
- Position calculation

**VS Code Integration:**
- Document type support
- URI scheme handling
- Event handling (refresh)

**Error Handling:**
- Analyzer error recovery
- Empty document handling
- Configuration change handling

### Integration Tests (`integration.test.ts`)

**End-to-End Workflows:**
- Complete analysis pipeline
- Configuration change propagation
- Real-world C# code processing

**Performance Testing:**
- Large file handling
- Memory usage verification
- Response time validation

**Cross-Component Consistency:**
- Data format compatibility
- Error handling consistency
- Configuration respect across components

## Test Utilities

The `testUtils.ts` file provides:

**Mock Objects:**
- `createMockDocument()` - VS Code TextDocument simulation
- `createMockConfiguration()` - Workspace configuration mocking
- `createMockCancellationToken()` - Cancellation token simulation

**Sample Data:**
- `SampleCSharpCode` - Collection of C# code snippets for testing
- `ConfigurationPresets` - Common configuration scenarios
- `TestFilePaths` - File path patterns for testing

**Validation Utilities:**
- `assertValidFunctionComplexity()` - Validates complexity data structure
- `assertValidComplexityDetail()` - Validates individual complexity details
- `mockWorkspaceConfiguration()` - Temporary configuration overrides

## Adding New Tests

When adding new tests:

1. **Use the existing test structure** - Follow the established patterns
2. **Leverage test utilities** - Use helper functions from `testUtils.ts`
3. **Cover edge cases** - Include error conditions and boundary cases
4. **Validate data structures** - Use assertion utilities for complex objects
5. **Mock VS Code APIs** - Use provided mock functions for VS Code integration

### Example Test Pattern

```typescript
test('should handle specific scenario', async () => {
    // Arrange
    const mockDocument = createMockDocument('csharp', SampleCSharpCode.SINGLE_IF);
    const mockConfig = createMockConfiguration(ConfigurationPresets.DEFAULT_ENABLED);
    const restoreConfig = mockWorkspaceConfiguration(mockConfig);
    
    try {
        // Act
        const results = await someOperation(mockDocument);
        
        // Assert
        assert.strictEqual(results.length, 1);
        assertValidFunctionComplexity(results[0]);
    } finally {
        // Cleanup
        restoreConfig();
    }
});
```

## Debugging Tests

### Using VS Code Debugger

1. Open the test file you want to debug
2. Set breakpoints in the test code
3. Open Command Palette and run "Test: Debug All Tests"
4. Or use "Test: Debug Test at Cursor" for specific tests

### Console Logging

Use `console.log()` for debugging output:
```typescript
test('debug test', () => {
    const result = analyzeFunction(code);
    console.log('Analysis result:', JSON.stringify(result, null, 2));
    assert.ok(result);
});
```

### Error Investigation

Check the test output for:
- Assertion failures with expected vs actual values
- TypeScript compilation errors
- VS Code API usage issues
- Mock object configuration problems

## Common Issues

**TypeScript Errors:**
- Ensure all imports are correct
- Use proper type annotations for mock objects
- Cast complex mocks with `as` when necessary

**VS Code API Mocking:**
- Some VS Code APIs are complex to mock fully
- Use simplified mocks that provide the minimum required interface
- Leverage existing mock utilities rather than creating new ones

**Test Isolation:**
- Each test should be independent
- Use proper setup/teardown for configuration changes
- Restore original state after temporary modifications

## Contributing

When contributing tests:

1. **Write descriptive test names** - Clearly indicate what is being tested
2. **Group related tests** - Use suite/describe blocks for organization
3. **Include both positive and negative cases** - Test success and failure paths
4. **Document complex test scenarios** - Add comments for intricate test logic
5. **Update this README** - Document new test categories or utilities
