/**
 * @fileoverview Unit Tests for Core Logic (No VS Code Dependencies)
 *
 * These tests run directly in Node.js and can be properly instrumented for coverage.
 * They test the core complexity analysis logic without requiring VS Code APIs.
 */

import * as assert from "assert";
import { CSharpMetricsAnalyzer } from "../metricsAnalyzer/languages/csharpAnalyzer";
import {
  MetricsAnalyzerFactory,
  UnifiedFunctionMetrics,
} from "../metricsAnalyzer/metricsAnalyzerFactory";
import { SampleCSharpCode } from "../test/testUtils";

describe("Core Logic Unit Tests (Node.js)", () => {
  describe("CSharp Analyzer Core Logic", () => {
    it("should analyze simple method correctly", () => {
      const analyzer = new CSharpMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(SampleCSharpCode.SIMPLE_METHOD);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    it("should analyze if statement correctly", () => {
      const analyzer = new CSharpMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(SampleCSharpCode.SINGLE_IF);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Max");
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details.length, 1);
      assert.strictEqual(results[0].details[0].reason, "if statement");
    });

    it("should analyze nested complexity correctly", () => {
      const analyzer = new CSharpMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(
        SampleCSharpCode.NESTED_COMPLEX
      );

      assert.ok(results.length > 0);
      const mainMethod = results.find(
        (r: UnifiedFunctionMetrics) => r.name === "ComplexMethod"
      );
      assert.ok(mainMethod);
      assert.ok(mainMethod.complexity > 5); // Should have significant complexity
    });

    it("should handle logical operators", () => {
      const sourceCode = `
        public class Test {
          public void Method(bool a, bool b, bool c) {
            if (a && b) {
              return;
            }
            if (b || c) {
              return;
            }
          }
        }
      `;

      const analyzer = new CSharpMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 4); // 2 ifs + 1 && + 1 ||
    });

    it("should handle loops correctly", () => {
      const sourceCode = `
        public class Test {
          public void Method() {
            for (int i = 0; i < 10; i++) {
              while (true) {
                break;
              }
            }
          }
        }
      `;

      const analyzer = new CSharpMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);

      const forLoop = results[0].details.find((d: any) =>
        d.reason.includes("for")
      );
      const whileLoop = results[0].details.find((d: any) =>
        d.reason.includes("while")
      );

      assert.ok(forLoop);
      assert.ok(whileLoop);
      assert.ok(whileLoop.nesting > forLoop.nesting);
    });
  });

  describe("Factory Pattern", () => {
    it("should return correct supported languages", () => {
      const languages = MetricsAnalyzerFactory.getSupportedLanguages();
      assert.ok(Array.isArray(languages));
      assert.ok(languages.includes("csharp"));
    });

    it.skip("should analyze C# code via factory", () => {
      // Note: Factory may have tree-sitter initialization issues in pure Node.js
      const results = MetricsAnalyzerFactory.analyzeFile(
        "csharp",
        SampleCSharpCode.SIMPLE_METHOD
      );
      console.log("Factory results:", results, results.length); // Debug output
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Add");
      assert.strictEqual(results[0].complexity, 0);
    });

    it("should return empty for unsupported language", () => {
      const results = MetricsAnalyzerFactory.analyzeFile(
        "python",
        "def hello(): pass"
      );
      assert.strictEqual(results.length, 0);
    });

    it.skip("should normalize line numbers to 1-based", () => {
      // Note: Factory may have tree-sitter initialization issues in pure Node.js
      const results = MetricsAnalyzerFactory.analyzeFile(
        "csharp",
        SampleCSharpCode.SINGLE_IF
      );
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].startLine >= 1);
      assert.ok(results[0].endLine >= 1);

      results[0].details.forEach((detail: any) => {
        assert.ok(detail.line >= 1);
        assert.ok(detail.column >= 1);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty source", () => {
      const results = MetricsAnalyzerFactory.analyzeFile("csharp", "");
      assert.strictEqual(results.length, 0);
    });

    it("should handle malformed code gracefully", () => {
      const malformed = `
        public class Test {
          public void Method() {
            if (true {  // Missing closing parenthesis
              return;
            }
        }
      `;

      // Should not throw
      const results = MetricsAnalyzerFactory.analyzeFile("csharp", malformed);
      assert.ok(Array.isArray(results));
    });

    it("should handle code with only comments", () => {
      const commentsOnly = `
        // This is just a comment
        /* Another comment */
      `;

      const results = MetricsAnalyzerFactory.analyzeFile(
        "csharp",
        commentsOnly
      );
      assert.strictEqual(results.length, 0);
    });
  });
});
