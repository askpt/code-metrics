/**
 * @fileoverview Unit Tests for Core Logic (No VS Code Dependencies)
 *
 * These tests run directly in Node.js and can be properly instrumented for coverage.
 * They test the core complexity analysis logic without requiring VS Code APIs.
 */

import * as assert from "assert";
import { CSharpMetricsAnalyzer } from "../metricsAnalyzer/languages/csharpAnalyzer";
import { GoMetricsAnalyzer } from "../metricsAnalyzer/languages/goAnalyzer";
import { JavaMetricsAnalyzer } from "../metricsAnalyzer/languages/javaAnalyzer";
import { JavaScriptMetricsAnalyzer } from "../metricsAnalyzer/languages/javascriptAnalyzer";
import { PythonMetricsAnalyzer } from "../metricsAnalyzer/languages/pythonAnalyzer";
import { TsxMetricsAnalyzer } from "../metricsAnalyzer/languages/tsxAnalyzer";
import { TypeScriptMetricsAnalyzer } from "../metricsAnalyzer/languages/typescriptAnalyzer";
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
      assert.strictEqual(results[0].complexity, 6); // 2 ifs + && (nested +2) + || (nested +2)
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

      const forLoop = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason.includes("for")
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
      const switchDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason.includes("switch")
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
      const selectDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason.includes("select")
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

      const forLoop = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason.includes("for")
      );
      const whileLoop = results[0].details.find((d: UnifiedMetricsDetail) =>
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

    it("should analyze C# code via factory", () => {
      const results = MetricsAnalyzerFactory.analyzeFile(
        SampleCSharpCode.SIMPLE_METHOD,
        "csharp"
      );
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Add");
      assert.strictEqual(results[0].complexity, 0);
    });

    it("should return empty for unsupported language", () => {
      const results = MetricsAnalyzerFactory.analyzeFile(
        "def hello(): pass",
        "ruby"
      );
      assert.strictEqual(results.length, 0);
    });

    it("should normalize line numbers to 1-based", () => {
      const results = MetricsAnalyzerFactory.analyzeFile(
        SampleCSharpCode.SINGLE_IF,
        "csharp"
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
      const results = MetricsAnalyzerFactory.analyzeFile("", "csharp");
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
      const results = MetricsAnalyzerFactory.analyzeFile(malformed, "csharp");
      assert.ok(Array.isArray(results));
    });

    it("should handle code with only comments", () => {
      const commentsOnly = `
        // This is just a comment
        /* Another comment */
      `;

      const results = MetricsAnalyzerFactory.analyzeFile(
        commentsOnly,
        "csharp"
      );
      assert.strictEqual(results.length, 0);
    });
  });

  describe("JavaScript Analyzer Core Logic", () => {
    it("should analyze simple function correctly", () => {
      const sourceCode = `
function add(a, b) {
  return a + b;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "add");
      assert.strictEqual(results[0].complexity, 0);
    });

    it("should analyze if statement correctly", () => {
      const sourceCode = `
function max(a, b) {
  if (a > b) {
    return a;
  }
  return b;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "max");
      assert.strictEqual(results[0].complexity, 1);
    });

    it("should count if/else correctly", () => {
      const sourceCode = `
function greet(name) {
  if (name) {
    return 'Hello ' + name;
  } else {
    return 'Hello World';
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results[0].complexity, 2);
    });

    it("should count else-if chains correctly", () => {
      const sourceCode = `
function classify(x) {
  if (x > 10) {
    return 'big';
  } else if (x > 5) {
    return 'medium';
  } else {
    return 'small';
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results[0].complexity, 3);
    });

    it("should count logical operators", () => {
      const sourceCode = `
function check(a, b, c) {
  if (a && b || c) {
    return true;
  }
  return false;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      // if=1, &&=1, ||=1 → 3
      assert.strictEqual(results[0].complexity, 3);
    });

    it("should count nested complexity", () => {
      const sourceCode = `
function process(items) {
  for (let i = 0; i < items.length; i++) {
    if (items[i] > 0) {
      console.log(items[i]);
    }
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      // for=1, if=2 (nesting=1) → 3
      assert.strictEqual(results[0].complexity, 3);
    });

    it("should analyze arrow functions", () => {
      const sourceCode = `
const double = (x) => x * 2;
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "double");
      assert.strictEqual(results[0].complexity, 0);
    });

    it("should analyze class methods", () => {
      const sourceCode = `
class Calculator {
  add(a, b) {
    return a + b;
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "add");
    });

    it("should handle factory analyzeFile with javascript language id", () => {
      const sourceCode = `
function hello() {
  return 'world';
}
`;
      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "javascript");
      assert.ok(Array.isArray(results));
      assert.strictEqual(results.length, 1);
    });
  });

  describe("TypeScript Analyzer Core Logic", () => {
    it("should analyze typed function correctly", () => {
      const sourceCode = `
function add(a: number, b: number): number {
  return a + b;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "add");
      assert.strictEqual(results[0].complexity, 0);
    });

    it("should analyze if with logical operators", () => {
      const sourceCode = `
function validate(a: number, b: number): boolean {
  if (a < 0 || b < 0) {
    return false;
  }
  return true;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results[0].complexity, 2); // if=1, ||=1
    });

    it("should analyze class methods with control flow", () => {
      const sourceCode = `
class Service {
  process(items: number[]): number {
    let total = 0;
    for (const item of items) {
      if (item > 0) {
        total += item;
      }
    }
    return total;
  }
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "process");
      // for=1, if=2 (nesting=1) → 3
      assert.strictEqual(results[0].complexity, 3);
    });

    it("should handle factory analyzeFile with typescript language id", () => {
      const sourceCode = `
function hello(): string {
  return 'world';
}
`;
      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "typescript");
      assert.ok(Array.isArray(results));
      assert.strictEqual(results.length, 1);
    });

    it("should include javascript and typescript in supported languages", () => {
      const languages = MetricsAnalyzerFactory.getSupportedLanguages();
      assert.ok(languages.includes("java"));
      assert.ok(languages.includes("javascript"));
      assert.ok(languages.includes("python"));
      assert.ok(languages.includes("typescript"));
      assert.ok(languages.includes("javascriptreact"));
      assert.ok(languages.includes("typescriptreact"));
    });

    it("should count ternary expressions", () => {
      const sourceCode = `
function abs(x: number): number {
  return x >= 0 ? x : -x;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const ternaryDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "ternary expression"
      );
      assert.ok(ternaryDetail);
    });

    it("should count try/catch clauses", () => {
      const sourceCode = `
function parse(s: string): number {
  try {
    return parseInt(s, 10);
  } catch (e) {
    return 0;
  }
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const catchDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "catch clause"
      );
      assert.ok(catchDetail);
    });

    it("should count nullish coalescing operator", () => {
      const sourceCode = `
function greet(name: string | null): string {
  return name ?? "World";
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const nullishDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason.includes("??")
      );
      assert.ok(nullishDetail);
    });

    it("should count labeled break statements", () => {
      const sourceCode = `
function search(matrix: number[][]): boolean {
  outer: for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] === 0) {
        break outer;
      }
    }
  }
  return true;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const labeledBreak = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "labeled break statement"
      );
      assert.ok(labeledBreak);
    });
  });

  describe("Java Analyzer Core Logic", () => {
    it("should count if/else with flat else increment", () => {
      const sourceCode = `
public class Test {
  public int max(int a, int b) {
    if (a > b) {
      return a;
    } else {
      return b;
    }
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 2);
      assert.deepStrictEqual(
        results[0].details.map((d: UnifiedMetricsDetail) => d.reason),
        ["if statement", "else clause"]
      );
    });

    it("should count else-if chains without nesting penalty", () => {
      const sourceCode = `
public class Test {
  public String grade(int score) {
    if (score >= 90) {
      return "A";
    } else if (score >= 80) {
      return "B";
    } else {
      return "C";
    }
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 3);
      assert.deepStrictEqual(
        results[0].details.map((d: UnifiedMetricsDetail) => d.reason),
        ["if statement", "else if clause", "else clause"]
      );
    });
  });

  describe("JavaScript Analyzer Additional Coverage", () => {
    it("should count ternary expressions", () => {
      const sourceCode = `
function abs(x) {
  return x >= 0 ? x : -x;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const ternaryDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "ternary expression"
      );
      assert.ok(ternaryDetail);
    });

    it("should count try/catch clauses", () => {
      const sourceCode = `
function parse(s) {
  try {
    return parseInt(s, 10);
  } catch (e) {
    return 0;
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const catchDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "catch clause"
      );
      assert.ok(catchDetail);
    });

    it("should count nullish coalescing operator", () => {
      const sourceCode = `
function greet(name) {
  return name ?? "World";
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const nullishDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason.includes("??")
      );
      assert.ok(nullishDetail);
    });

    it("should count labeled continue statements", () => {
      const sourceCode = `
function process(matrix) {
  outer: for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] < 0) {
        continue outer;
      }
    }
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const labeledContinue = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "labeled continue statement"
      );
      assert.ok(labeledContinue);
    });
  });

  describe("Analysis Cache Behavior", () => {
    it("should return same results on cache hit", () => {
      const sourceCode = `
function cached(x: number): number {
  return x * 2;
}
`;
      const first = MetricsAnalyzerFactory.analyzeFile(sourceCode, "typescript");
      const second = MetricsAnalyzerFactory.analyzeFile(sourceCode, "typescript");
      assert.deepStrictEqual(first, second);
      assert.strictEqual(first.length, 1);
    });

    it("should handle cache eviction without errors (fill beyond CACHE_MAX_SIZE)", () => {
      // Each iteration uses a unique source so all entries are distinct cache keys.
      // After CACHE_MAX_SIZE+1 entries the LRU eviction fires; this should not throw.
      for (let i = 0; i <= 20; i++) {
        const src = `function f${i}(): number { return ${i}; }`;
        const results = MetricsAnalyzerFactory.analyzeFile(src, "typescript");
        assert.ok(Array.isArray(results));
      }
    });

    it("should return empty array for unsupported language even when cache has entries", () => {
      MetricsAnalyzerFactory.analyzeFile("function x() {}", "typescript");
      const results = MetricsAnalyzerFactory.analyzeFile("def x(): pass", "ruby");
      assert.strictEqual(results.length, 0);
    });
  });

  describe("createAnalyzer Error Handling", () => {
    it("should throw when module does not export the expected class", () => {
      const { createAnalyzer } = require("../metricsAnalyzer/metricsAnalyzerFactory");
      const badAnalyzer = createAnalyzer(
        "../metricsAnalyzer/metricsAnalyzerFactory",
        "NonExistentClass"
      );
      assert.throws(
        () => badAnalyzer("some source"),
        /does not export a class named "NonExistentClass"/
      );
    });
  });

  describe("Python Analyzer Core Logic", () => {
    it("should analyze simple function with no complexity", () => {
      const sourceCode = `
def add(a, b):
    return a + b
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    it("should count if statement", () => {
      const sourceCode = `
def sign(x):
    if x > 0:
        return 1
    return 0
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const ifDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "if statement"
      );
      assert.ok(ifDetail);
    });

    it("should count for loop", () => {
      const sourceCode = `
def sum_list(items):
    total = 0
    for item in items:
        total += item
    return total
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const forDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "for loop"
      );
      assert.ok(forDetail);
    });

    it("should count while loop", () => {
      const sourceCode = `
def countdown(n):
    while n > 0:
        n -= 1
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const whileDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "while loop"
      );
      assert.ok(whileDetail);
    });

    it("should apply nesting penalty for nested control flow", () => {
      const sourceCode = `
def nested(items):
    for item in items:
        if item > 0:
            return item
    return -1
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // for: +1 (nesting 0), if: +1 +1 nesting = +2 → total 3
      assert.strictEqual(results[0].complexity, 3);
    });

    it("should count logical operators", () => {
      const sourceCode = `
def check(a, b, c):
    if a and b or c:
        return True
    return False
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // if: +1 (nesting=0); children visited at nesting=1
      // or boolean_operator: +1+1=2 (nesting=1); and boolean_operator: +1+1=2 (nesting=1) → total 5
      assert.strictEqual(results[0].complexity, 5);
    });

    it("should count except clause", () => {
      const sourceCode = `
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return 0
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity >= 1);
      const exceptDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason.toLowerCase().includes("except")
      );
      assert.ok(exceptDetail);
    });

    it("should handle multiple functions independently", () => {
      const sourceCode = `
def simple():
    return 42

def complex_fn(x):
    if x > 0:
        for i in range(x):
            if i % 2 == 0:
                return i
    return 0
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2);
      const simple = results.find((r) => r.name === "simple");
      const complex = results.find((r) => r.name === "complex_fn");
      assert.ok(simple);
      assert.ok(complex);
      assert.strictEqual(simple!.complexity, 0);
      assert.ok(complex!.complexity > 0);
    });

    it("should analyze Python code via factory", () => {
      const sourceCode = `
def greet(name):
    if name:
        return "Hello, " + name
    return "Hello, World"
`;
      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "python");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
    });

    it("should normalize detail line numbers to 1-based", () => {
      // No leading blank line: the `if` is at 0-based row 1.
      // After factory normalization (+1) it must be exactly 2.
      // Without normalization the raw row (1) would also satisfy >= 1,
      // so an exact assertion is required to catch a regression.
      const sourceCode = `def check(x):
    if x > 0:
        return True
    return False
`;
      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "python");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].details.length, 1);
      assert.strictEqual(results[0].details[0].line, 2, "detail line should be 1-based (0-based row 1 + 1 = 2)");
    });
  });

  describe("TSX Analyzer Core Logic", () => {
    it("should report zero complexity for a simple JSX component", () => {
      const sourceCode = `
function Greeting({ name }: { name: string }) {
  return <span>Hello, {name}!</span>;
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Greeting");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    it("should count if statement complexity in TSX component", () => {
      const sourceCode = `
function Badge({ count }: { count: number }) {
  if (count > 0) {
    return <span>{count}</span>;
  }
  return null;
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Badge");
      assert.strictEqual(results[0].complexity, 1);
    });

    it("should count logical && operator in JSX conditional rendering", () => {
      const sourceCode = `
function AdminBadge({ isAdmin }: { isAdmin: boolean }) {
  return <div>{isAdmin && <span>Admin</span>}</div>;
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "AdminBadge");
      assert.strictEqual(results[0].complexity, 1);
    });

    it("should not bleed complexity across functions separated by JSX", () => {
      const sourceCode = `
function Simple() {
  return <div>Hello</div>;
}

function WithIf(x: number) {
  if (x > 0) {
    return <span>{x}</span>;
  }
  return null;
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2);
      const simple = results.find((r) => r.name === "Simple");
      const withIf = results.find((r) => r.name === "WithIf");
      assert.ok(simple, "Simple function should be found");
      assert.ok(withIf, "WithIf function should be found");
      assert.strictEqual(simple!.complexity, 0);
      assert.strictEqual(withIf!.complexity, 1);
    });

    it("should analyze TSX via factory with typescriptreact languageId", () => {
      const sourceCode = `
function Toggle({ on }: { on: boolean }) {
  return <button>{on ? "ON" : "OFF"}</button>;
}
`;
      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "typescriptreact");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Toggle");
      // ternary operator adds complexity
      assert.ok(results[0].complexity > 0, "ternary operator should add complexity");
    });

    it("should handle multi-element JSX return with no complexity", () => {
      const sourceCode = `
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>Title</header>
      <main>{children}</main>
    </div>
  );
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Layout");
      assert.strictEqual(results[0].complexity, 0);
    });
  });
});
