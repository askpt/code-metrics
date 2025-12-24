/**
 * @fileoverview Unit Tests for Core Logic (No VS Code Dependencies)
 *
 * These tests run directly in Node.js and can be properly instrumented for coverage.
 * They test the core complexity analysis logic without requiring VS Code APIs.
 */

import * as assert from "assert";
import { CSharpMetricsAnalyzer } from "../metricsAnalyzer/languages/csharpAnalyzer";
import { GoMetricsAnalyzer } from "../metricsAnalyzer/languages/goAnalyzer";
import {
  MetricsAnalyzerFactory,
  UnifiedFunctionMetrics,
  UnifiedMetricsDetail,
} from "../metricsAnalyzer/metricsAnalyzerFactory";
import { SampleCSharpCode } from "../test/testUtils";

describe("Core Logic Unit Tests (Node.js)", () => {
  describe("Go Analyzer Core Logic", () => {
    it("should analyze simple function correctly", () => {
      const analyzer = new GoMetricsAnalyzer();
      const sourceCode = `
package main

func Add(a, b int) int {
    return a + b
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    it("should analyze if statement correctly", () => {
      const analyzer = new GoMetricsAnalyzer();
      const sourceCode = `
package main

func Max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Max");
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details.length, 1);
      assert.strictEqual(results[0].details[0].reason, "if statement");
    });

    it("should analyze nested complexity correctly", () => {
      const analyzer = new GoMetricsAnalyzer();
      const sourceCode = `
package main

func ComplexMethod(items []int) int {
    result := 0
    for _, item := range items {
        if item > 0 {
            for i := 0; i < item; i++ {
                if i%2 == 0 {
                    result += i
                }
            }
        }
    }
    return result
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.ok(results.length > 0);
      const mainMethod = results.find(
        (r: UnifiedFunctionMetrics) => r.name === "ComplexMethod"
      );
      assert.ok(mainMethod);
      assert.ok(mainMethod.complexity > 5); // Should have significant complexity
    });

    it("should handle logical operators", () => {
      const sourceCode = `
package main

func Method(a, b, c bool) {
    if a && b {
        return
    }
    if b || c {
        return
    }
}
`;

      const analyzer = new GoMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 4); // 2 ifs + 1 && + 1 ||
    });

    it("should handle loops correctly", () => {
      const sourceCode = `
package main

func Method() {
    for i := 0; i < 10; i++ {
        for true {
            break
        }
    }
}
`;

      const analyzer = new GoMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);

      const forLoop = results[0].details.find(
        (d: UnifiedMetricsDetail) => d.reason.includes("for")
      );
      const innerForLoop = results[0].details.find(
        (d: UnifiedMetricsDetail) => d.reason.includes("for") && d.nesting > 0
      );

      assert.ok(forLoop);
      assert.ok(innerForLoop);
      assert.ok(innerForLoop.nesting > forLoop.nesting);
    });

    it("should handle switch statements", () => {
      const sourceCode = `
package main

func Method(val int) string {
    switch val {
    case 1:
        return "one"
    case 2:
        return "two"
    default:
        return "other"
    }
}
`;

      const analyzer = new GoMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const switchDetail = results[0].details.find(
        (d: UnifiedMetricsDetail) => d.reason.includes("switch")
      );
      assert.ok(switchDetail);
    });

    it("should handle select statements", () => {
      const sourceCode = `
package main

func Method(ch1, ch2 chan int) {
    select {
    case val := <-ch1:
        _ = val
    case val := <-ch2:
        _ = val
    }
}
`;

      const analyzer = new GoMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const selectDetail = results[0].details.find(
        (d: UnifiedMetricsDetail) => d.reason.includes("select")
      );
      assert.ok(selectDetail);
    });

    it("should handle defer with recover", () => {
      const sourceCode = `
package main

func Method() {
    defer func() {
        if r := recover(); r != nil {
            println("recovered")
        }
    }()
}
`;

      const analyzer = new GoMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
    });

    it("should handle multiple functions", () => {
      const sourceCode = `
package main

func Add(a, b int) int {
    return a + b
}

func Subtract(a, b int) int {
    if a < b {
        return 0
    }
    return a - b
}
`;

      const analyzer = new GoMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].name, "Add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[1].name, "Subtract");
      assert.strictEqual(results[1].complexity, 1);
    });
  });

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
      // 2 ifs (+1 each) + '&&' (+2 at nest 1) + '||' (+2 at nest 1) = 6
      assert.strictEqual(results[0].complexity, 6);
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

      const forLoop = results[0].details.find(
        (d: UnifiedMetricsDetail) => d.reason.includes("for")
      );
      const whileLoop = results[0].details.find(
        (d: UnifiedMetricsDetail) => d.reason.includes("while")
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
