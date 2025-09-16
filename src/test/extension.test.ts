import * as assert from "assert";

// Import only the core logic test suites (no VS Code API dependencies)
import "./complexityAnalyzer/languages/csharpAnalyzer.test";
import "./complexityAnalyzer/complexityAnalyzerFactory.test";

suite("Extension Test Suite", () => {
  console.log("Starting core logic tests for Code Complexity extension.");

  test("should perform basic assertion test", () => {
    // Basic test to ensure the test framework is working
    assert.strictEqual(2 + 2, 4);
    assert.ok(true);
  });

  test("should handle array operations", () => {
    // Test basic JavaScript functionality
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    assert.strictEqual(1, [1, 2, 3].indexOf(2));
  });
});
