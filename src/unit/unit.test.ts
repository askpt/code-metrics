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
import { RustMetricsAnalyzer } from "../metricsAnalyzer/languages/rustAnalyzer";
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
      assert.strictEqual(results[0].name, "Test.Add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    it("should analyze if statement correctly", () => {
      const analyzer = new CSharpMetricsAnalyzer();
      const results = analyzer.analyzeFunctions(SampleCSharpCode.SINGLE_IF);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Test.Max");
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
        (r: UnifiedFunctionMetrics) => r.name === "Test.ComplexMethod"
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
      assert.strictEqual(results[0].name, "Test.Add");
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
      assert.strictEqual(results[0].name, "Calculator.add");
    });

    it("should qualify class arrow-function fields with class name", () => {
      const sourceCode = `
class Counter {
  increment = () => {
    if (this.value > 0) {
      this.value++;
    }
  };
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Counter.increment");
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
      assert.strictEqual(results[0].name, "Service.process");
      // for=1, if=2 (nesting=1) → 3
      assert.strictEqual(results[0].complexity, 3);
    });

    it("should qualify TypeScript class arrow-function fields with class name", () => {
      const sourceCode = `
class Validator {
  check = (x: number): boolean => {
    if (x > 0) {
      return true;
    }
    return false;
  };
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Validator.check");
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

  describe("MetricsAnalyzerFactory.isSupportedLanguage()", () => {
    it("should return true for all officially supported languages", () => {
      const supported = [
        "csharp",
        "go",
        "java",
        "javascript",
        "javascriptreact",
        "python",
        "typescript",
        "typescriptreact",
      ];
      for (const lang of supported) {
        assert.strictEqual(
          MetricsAnalyzerFactory.isSupportedLanguage(lang),
          true,
          `Expected ${lang} to be supported`
        );
      }
    });

    it("should return false for unsupported languages", () => {
      const unsupported = ["ruby", "cpp", "swift", "kotlin", "php", ""];
      for (const lang of unsupported) {
        assert.strictEqual(
          MetricsAnalyzerFactory.isSupportedLanguage(lang),
          false,
          `Expected ${lang} to be unsupported`
        );
      }
    });

    it("should be case-sensitive (uppercase not supported)", () => {
      assert.strictEqual(MetricsAnalyzerFactory.isSupportedLanguage("TypeScript"), false);
      assert.strictEqual(MetricsAnalyzerFactory.isSupportedLanguage("PYTHON"), false);
      assert.strictEqual(MetricsAnalyzerFactory.isSupportedLanguage("Go"), false);
    });
  });

  describe("MetricsAnalyzerFactory.getSupportedLanguages()", () => {
    it("should include all expected language identifiers", () => {
      const languages = MetricsAnalyzerFactory.getSupportedLanguages();
      const expected = [
        "csharp",
        "go",
        "java",
        "javascript",
        "javascriptreact",
        "python",
        "rust",
        "typescript",
        "typescriptreact",
      ];
      for (const lang of expected) {
        assert.ok(languages.includes(lang), `Expected getSupportedLanguages() to include '${lang}'`);
      }
    });

    it("should return at least 8 supported languages", () => {
      const languages = MetricsAnalyzerFactory.getSupportedLanguages();
      assert.ok(languages.length >= 8, `Expected at least 8 languages, got ${languages.length}`);
    });

    it("should be consistent with isSupportedLanguage()", () => {
      const languages = MetricsAnalyzerFactory.getSupportedLanguages();
      for (const lang of languages) {
        assert.strictEqual(
          MetricsAnalyzerFactory.isSupportedLanguage(lang),
          true,
          `isSupportedLanguage('${lang}') should be true since it's in getSupportedLanguages()`
        );
      }
    });
  });

  describe("Java Analyzer Additional Coverage", () => {
    it("should count for loop", () => {
      const sourceCode = `
public class Test {
  public int sum(int n) {
    int total = 0;
    for (int i = 0; i < n; i++) {
      total += i;
    }
    return total;
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const forDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "for loop"
      );
      assert.ok(forDetail, "Expected a for loop detail");
    });

    it("should count enhanced for loop (for-each)", () => {
      const sourceCode = `
public class Test {
  public int sumList(int[] items) {
    int total = 0;
    for (int item : items) {
      total += item;
    }
    return total;
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const forDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "enhanced for loop"
      );
      assert.ok(forDetail, "Expected an enhanced for loop detail");
    });

    it("should count while loop", () => {
      const sourceCode = `
public class Test {
  public int countdown(int n) {
    while (n > 0) {
      n--;
    }
    return n;
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const whileDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "while loop"
      );
      assert.ok(whileDetail, "Expected a while loop detail");
    });

    it("should count do-while loop", () => {
      const sourceCode = `
public class Test {
  public int readOnce(int n) {
    do {
      n--;
    } while (n > 0);
    return n;
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const doDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "do-while loop"
      );
      assert.ok(doDetail, "Expected a do-while loop detail");
    });

    it("should count catch clause", () => {
      const sourceCode = `
public class Test {
  public int safeParse(String s) {
    try {
      return Integer.parseInt(s);
    } catch (NumberFormatException e) {
      return 0;
    }
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const catchDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "catch clause"
      );
      assert.ok(catchDetail, "Expected a catch clause detail");
    });

    it("should count ternary expression", () => {
      const sourceCode = `
public class Test {
  public int abs(int x) {
    return x >= 0 ? x : -x;
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const ternaryDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "ternary expression"
      );
      assert.ok(ternaryDetail, "Expected a ternary expression detail");
    });

    it("should apply nesting penalty for nested control flow", () => {
      const sourceCode = `
public class Test {
  public int firstPositive(int[] items) {
    for (int item : items) {
      if (item > 0) {
        return item;
      }
    }
    return -1;
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // for-each: +1 (nesting 0), if: +1 +1 nesting = +2 → total 3
      assert.strictEqual(results[0].complexity, 3);
    });

    it("should analyze multiple methods independently", () => {
      const sourceCode = `
public class Test {
  public int simple(int x) {
    return x + 1;
  }
  public int conditional(int x) {
    if (x > 0) {
      return x;
    }
    return 0;
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2);
      const simple = results.find((r) => r.name === "Test.simple");
      const conditional = results.find((r) => r.name === "Test.conditional");
      assert.ok(simple, "Expected Test.simple method");
      assert.ok(conditional, "Expected Test.conditional method");
      assert.strictEqual(simple!.complexity, 0);
      assert.strictEqual(conditional!.complexity, 1);
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

  describe("Rust Analyzer Core Logic", () => {
    it("should analyze a simple function with no complexity", () => {
      const sourceCode = `
fn add(a: i32, b: i32) -> i32 {
  a + b
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "add");
      assert.strictEqual(results[0].complexity, 0);
    });

    it("should count if expression", () => {
      const sourceCode = `
fn check(x: i32) -> i32 {
  if x > 0 {
    1
  } else {
    0
  }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 2);
      assert.deepStrictEqual(
        results[0].details.map((d: UnifiedMetricsDetail) => d.reason),
        ["if expression", "else clause"]
      );
      assert.deepStrictEqual(
        results[0].details.map((d: UnifiedMetricsDetail) => d.increment),
        [1, 1]
      );
      assert.deepStrictEqual(
        results[0].details.map((d: UnifiedMetricsDetail) => d.nesting),
        [0, 1]
      );
      assert.strictEqual(
        results[0].details[1].increment,
        1,
        "else clause should be a flat +1 even when nested"
      );
    });

    it("should count for loop", () => {
      const sourceCode = `
fn sum(n: i32) -> i32 {
  let mut s = 0;
  for i in 0..n {
    s += i;
  }
  s
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
    });

    it("should count while loop", () => {
      const sourceCode = `
fn countdown(mut n: i32) {
  while n > 0 {
    n -= 1;
  }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
    });

    it("should count loop expression", () => {
      const sourceCode = `
fn spin() {
  loop {
    break;
  }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
    });

    it("should count match expression", () => {
      const sourceCode = `
fn classify(x: i32) -> &'static str {
  match x {
    0 => "zero",
    _ => "other",
  }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
    });

    it("should count logical && and || operators", () => {
      const sourceCode = `
fn validate(a: i32, b: i32) -> bool {
  a > 0 && b > 0 || a == b
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 2);
    });

    it("should count else-if chains without double-counting nested if expressions", () => {
      const sourceCode = `
fn classify(x: i32) -> i32 {
  if x > 0 {
    1
  } else if x < 0 {
    -1
  } else {
    0
  }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 3);
      assert.deepStrictEqual(
        results[0].details.map((d: UnifiedMetricsDetail) => d.reason),
        ["if expression", "else if clause", "else clause"]
      );
      assert.deepStrictEqual(
        results[0].details.map((d: UnifiedMetricsDetail) => d.increment),
        [1, 1, 1]
      );
    });

    it("should apply nesting penalty for nested control flow", () => {
      const sourceCode = `
fn nested(x: i32) -> i32 {
  if x > 0 {
    for i in 0..x {
      if i % 2 == 0 {
        return i;
      }
    }
  }
  0
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // outer if: +1 (nesting 0) = 1
      // for: +1 (nesting 1) + 1 = 2
      // inner if: +1 (nesting 2) + 2 = 3
      // total = 6
      assert.strictEqual(results[0].complexity, 6);
    });

    it("should count nested closures independently from enclosing control flow", () => {
      const sourceCode = `
fn wrap(flag: bool) {
  if flag {
    let _handler = || {
      if flag {
        1
      } else {
        0
      }
    };
  }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // outer if: +1 (nesting 0) = 1
      // closure: +1 (nesting 1) + 1 = 2
      // inner if: +1 (nesting 2) + 2 = 3
      // else clause: +1 (flat increment) = 1
      // total = 7
      assert.strictEqual(results[0].complexity, 7);
      assert.deepStrictEqual(
        results[0].details.map((d: UnifiedMetricsDetail) => d.reason),
        ["if expression", "closure (nested)", "if expression", "else clause"]
      );
    });

    it("should qualify impl methods with type name", () => {
      const sourceCode = `
struct Counter { val: i32 }
impl Counter {
  fn increment(&mut self) {
    self.val += 1;
  }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Counter::increment");
    });

    it("should analyze nested functions as separate entries", () => {
      const sourceCode = `
fn outer() {
  fn inner() {
    if true {
    }
  }

  inner();
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].name, "outer");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[1].name, "inner");
      assert.strictEqual(results[1].complexity, 1);
    });

    it("should analyze multiple functions independently", () => {
      const sourceCode = `
fn simple(x: i32) -> i32 { x }
fn complex(x: i32) -> i32 {
  if x > 0 {
    x
  } else {
    0
  }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[1].complexity, 2);
    });

    it("should analyze Rust code via factory with rust language id", () => {
      const sourceCode = `
fn hello() -> i32 {
  if true { 1 } else { 0 }
}
`;
      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "rust");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 2);
    });

    it("should count labeled break and continue", () => {
      const sourceCode = `
fn loops() {
  'outer: loop {
    if true {
      break 'outer;
    }

    'inner: loop {
      continue 'inner;
    }
  }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 11);
      assert.ok(
        results[0].details.some(
          (d: UnifiedMetricsDetail) => d.reason === "labeled break"
        )
      );
      assert.ok(
        results[0].details.some(
          (d: UnifiedMetricsDetail) => d.reason === "labeled continue"
        )
      );
    });

    it("should use implementing type name for trait impl (impl Trait for Type)", () => {
      const sourceCode = `
use std::fmt;

struct Point { x: f64, y: f64 }

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // Should use implementing type "Point", not trait "Display"
      assert.strictEqual(results[0].name, "Point::fmt");
    });

    it("should use inherent impl type name when no trait (impl Type)", () => {
      const sourceCode = `
struct Rectangle { width: f64, height: f64 }

impl Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Rectangle::area");
    });

    it("should handle multiple trait impl methods independently", () => {
      const sourceCode = `
use std::fmt;

struct Counter { value: i32 }

impl fmt::Display for Counter {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.value)
    }
}

impl Counter {
    fn increment(&mut self) {
        if self.value < i32::MAX {
            self.value += 1;
        }
    }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].name, "Counter::fmt");
      assert.strictEqual(results[1].name, "Counter::increment");
      assert.strictEqual(results[1].complexity, 1); // single if
    });
  });

  describe("Go Analyzer Additional Coverage", () => {
    it("should strip pointer dereference from pointer receiver method names", () => {
      const sourceCode = `
package main

type MyStruct struct{}

func (s *MyStruct) Compute(x int) int {
    if x > 0 {
        return x
    }
    return 0
}
`;
      const results = GoMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // Pointer receiver (*MyStruct) should display as "MyStruct.Compute", not "*MyStruct.Compute"
      assert.strictEqual(results[0].name, "MyStruct.Compute");
      assert.strictEqual(results[0].complexity, 1);
    });

    it("should use plain type name for value receiver methods", () => {
      const sourceCode = `
package main

type Counter struct{ count int }

func (c Counter) Get() int {
    return c.count
}
`;
      const results = GoMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Counter.Get");
      assert.strictEqual(results[0].complexity, 0);
    });

    it("should count goto statements", () => {
      const sourceCode = `
package main

func ProcessWithGoto(n int) int {
    result := 0
loop:
    if n > 0 {
        result += n
        n--
        goto loop
    }
    return result
}
`;
      const results = GoMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const gotoDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "goto statement"
      );
      assert.ok(gotoDetail, "goto statement should add complexity");
    });

    it("should count type switch statements", () => {
      const sourceCode = `
package main

func Describe(i interface{}) string {
    switch v := i.(type) {
    case int:
        return "int"
    case string:
        return "string"
    default:
        _ = v
        return "other"
    }
}
`;
      const results = GoMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const typeSwitchDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "type switch statement"
      );
      assert.ok(typeSwitchDetail, "type switch should add complexity");
    });

    it("should count labeled break statements", () => {
      const sourceCode = `
package main

func SearchMatrix(matrix [][]int, target int) bool {
outer:
    for _, row := range matrix {
        for _, val := range row {
            if val == target {
                break outer
            }
        }
    }
    return false
}
`;
      const results = GoMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const labeledBreak = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "labeled break statement"
      );
      assert.ok(labeledBreak, "labeled break should add complexity");
    });

    it("should count func literals (closures) nested inside functions", () => {
      const sourceCode = `
package main

func Apply(nums []int, transform func(int) int) []int {
    result := make([]int, len(nums))
    for i, n := range nums {
        fn := func(x int) int {
            if x > 0 {
                return transform(x)
            }
            return 0
        }
        result[i] = fn(n)
    }
    return result
}
`;
      const results = GoMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const closureDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "function literal (nested)"
      );
      assert.ok(closureDetail, "nested func literal should add complexity");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CSharp Analyzer Additional Coverage
  // ──────────────────────────────────────────────────────────────────────────
  describe("CSharp Analyzer Additional Coverage", () => {
    it("should count goto statements", () => {
      const sourceCode = `
public class Test {
    public void GotoMethod() {
        int i = 0;
        start:
        if (i < 5) {
            i++;
            goto start;
        }
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const gotoDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "goto statement"
      );
      assert.ok(gotoDetail, "goto statement should add complexity");
    });

    it("should use class name in constructor name", () => {
      const sourceCode = `
public class MyService {
    public MyService(int value) {
        if (value > 0) {
            this.value = value;
        }
    }
    private int value;
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      const ctor = results.find((r: UnifiedFunctionMetrics) =>
        r.name.includes("constructor")
      );
      assert.ok(ctor, "constructor should be found");
      assert.ok(
        ctor!.name.includes("MyService"),
        "constructor name should include class name"
      );
    });

    it("should detect destructor declarations", () => {
      const sourceCode = `
public class Resource {
    ~Resource() {
        // cleanup
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(
        results[0].name.includes("destructor") || results[0].name.startsWith("~"),
        "destructor should be found"
      );
      assert.strictEqual(results[0].complexity, 0);
    });

    it("should count switch expression (C# 8+)", () => {
      const sourceCode = `
public class Test {
    public string Classify(int n) {
        return n switch {
            > 0 => "positive",
            < 0 => "negative",
            _ => "zero"
        };
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      const switchDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "switch expression"
      );
      assert.ok(switchDetail, "switch expression should add complexity");
    });

    it("should count lambda expressions nested inside control flow", () => {
      const sourceCode = `
public class Test {
    public void LambdaMethod(List<int> items) {
        for (int i = 0; i < items.Count; i++) {
            Func<int, int> transform = x => x * 2;
        }
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      const lambdaDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "lambda expression (nested)"
      );
      assert.ok(lambdaDetail, "lambda nested in loop should add complexity");
    });

    it("should count anonymous method expressions nested inside control flow", () => {
      const sourceCode = `
public class Test {
    public void AnonMethod(List<int> items) {
        foreach (var item in items) {
            Func<int, int> fn = delegate(int x) { return x + 1; };
        }
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      const anonDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "anonymous method (nested)"
      );
      assert.ok(anonDetail, "anonymous method nested in loop should add complexity");
    });

    it("should count conditional expressions (ternary operator)", () => {
      const sourceCode = `
public class Test {
    public string Sign(int n) {
        return n > 0 ? "positive" : "non-positive";
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      const ternaryDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "ternary operator"
      );
      assert.ok(ternaryDetail, "ternary operator should add complexity");
    });

    it("should count continue statements in nested context", () => {
      const sourceCode = `
public class Test {
    public void SkipNegatives(int[] items) {
        for (int i = 0; i < items.Length; i++) {
            if (items[i] < 0) {
                continue;
            }
            Console.WriteLine(items[i]);
        }
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const continueDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "continue statement (nested)"
      );
      assert.ok(continueDetail, "continue in nested context should add complexity");
    });

    it("should count break statements in nested context", () => {
      const sourceCode = `
public class Test {
    public int FindFirst(int[] items, int target) {
        for (int i = 0; i < items.Length; i++) {
            if (items[i] == target) {
                break;
            }
        }
        return -1;
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const breakDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "break statement (nested)"
      );
      assert.ok(breakDetail, "break in nested context should add complexity");
    });

    it("should count try/catch blocks correctly", () => {
      const sourceCode = `
public class Test {
    public int SafeDivide(int a, int b) {
        try {
            return a / b;
        } catch (DivideByZeroException) {
            return 0;
        }
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity >= 1);
      const catchDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "catch clause"
      );
      assert.ok(catchDetail, "catch clause should add complexity");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Python Analyzer Additional Coverage
  // ──────────────────────────────────────────────────────────────────────────
  describe("Python Analyzer Additional Coverage", () => {
    it("should count elif clauses", () => {
      const sourceCode = `
def grade(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    else:
        return "F"
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      const elifDetails = results[0].details.filter((d: UnifiedMetricsDetail) =>
        d.reason === "elif clause"
      );
      assert.strictEqual(elifDetails.length, 2, "two elif clauses expected");
    });

    it("should count set comprehension", () => {
      const sourceCode = `
def unique_positives(items):
    return {x for x in items}
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity >= 1);
      const setCompDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "set comprehension"
      );
      assert.ok(setCompDetail, "set comprehension should add complexity");
    });

    it("should count dictionary comprehension", () => {
      const sourceCode = `
def square_dict(items):
    return {x: x*x for x in items}
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity >= 1);
      const dictCompDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "dictionary comprehension"
      );
      assert.ok(dictCompDetail, "dictionary comprehension should add complexity");
    });

    it("should count generator expression", () => {
      const sourceCode = `
def sum_squares(items):
    return sum(x*x for x in items)
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity >= 1);
      const genDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "generator expression"
      );
      assert.ok(genDetail, "generator expression should add complexity");
    });

    it("should count conditional expression (ternary)", () => {
      const sourceCode = `
def absolute(x):
    return x if x >= 0 else -x
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const condDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "conditional expression"
      );
      assert.ok(condDetail, "conditional expression should add complexity");
    });

    it("should count nested lambda expressions", () => {
      const sourceCode = `
def process(items):
    for item in items:
        transform = lambda x: x * 2
    return items
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      const lambdaDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "lambda (nested)"
      );
      assert.ok(lambdaDetail, "lambda inside for loop should add complexity");
    });

    it("should count match statement (structural pattern matching)", () => {
      const sourceCode = `
def classify(status):
    match status:
        case 200:
            return "OK"
        case 404:
            return "Not Found"
        case _:
            return "Unknown"
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      const matchDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "match statement"
      );
      assert.ok(matchDetail, "match statement should add complexity");
    });

    it("should prefix class methods with class name", () => {
      const sourceCode = `
class Calculator:
    def add(self, a, b):
        return a + b
    def divide(self, a, b):
        if b == 0:
            return 0
        return a / b
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2);
      const addMethod = results.find((r) => r.name === "Calculator.add");
      const divideMethod = results.find((r) => r.name === "Calculator.divide");
      assert.ok(addMethod, "class method should use class.method format");
      assert.ok(divideMethod, "class method should use class.method format");
      assert.strictEqual(addMethod!.complexity, 0);
      assert.strictEqual(divideMethod!.complexity, 1);
    });

    it("should count else clause on if statement", () => {
      const sourceCode = `
def sign(x):
    if x > 0:
        return 1
    elif x < 0:
        return -1
    else:
        return 0
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // if: +1, elif: +1, else: +1 → complexity 3
      assert.strictEqual(results[0].complexity, 3, "if/elif/else should each add +1");
      const elseDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "else clause"
      );
      assert.ok(elseDetail, "else clause should be counted");
      assert.strictEqual(elseDetail!.increment, 1, "else clause adds flat +1");
    });

    it("should count else clause on for loop (for...else)", () => {
      const sourceCode = `
def find_first(items, target):
    for item in items:
        if item == target:
            return item
    else:
        return None
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // for: +1, nested if: +2, else: +1 → total 4
      assert.strictEqual(results[0].complexity, 4, "for/if/else should add correct complexity");
      const elseDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "else clause"
      );
      assert.ok(elseDetail, "for...else should count the else clause");
    });

    it("should count else clause on while loop (while...else)", () => {
      const sourceCode = `
def search(n):
    i = 0
    while i < n:
        i += 1
    else:
        return i
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // while: +1, else: +1 → total 2
      assert.strictEqual(results[0].complexity, 2, "while...else should count both while and else");
      const elseDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "else clause"
      );
      assert.ok(elseDetail, "while...else should count the else clause");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // JavaScript / TypeScript Analyzer Additional Coverage
  // ──────────────────────────────────────────────────────────────────────────
  describe("JS/TS Analyzer Additional Coverage", () => {
    it("should count do-while loops in JavaScript", () => {
      const sourceCode = `
function readOnce(n) {
  do {
    n--;
  } while (n > 0);
  return n;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const doDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "do...while loop"
      );
      assert.ok(doDetail, "do-while should add complexity");
    });

    it("should count switch statements in JavaScript", () => {
      const sourceCode = `
function dayName(n) {
  switch (n) {
    case 0: return "Sun";
    case 1: return "Mon";
    default: return "?";
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const switchDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "switch statement"
      );
      assert.ok(switchDetail, "switch statement should add complexity");
    });

    it("should count nested arrow function with internal complexity", () => {
      const sourceCode = `
function process(items) {
  return items.map(x => {
    if (x > 0) {
      return x * 2;
    }
    return 0;
  });
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const arrowDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "arrow function (nested)"
      );
      assert.ok(arrowDetail, "nested arrow function should add complexity");
    });

    it("should correctly identify for...of vs for...in loops", () => {
      const forOf = `
function sumItems(items) {
  let total = 0;
  for (const item of items) {
    total += item;
  }
  return total;
}
`;
      const forIn = `
function listKeys(obj) {
  const keys = [];
  for (const key in obj) {
    keys.push(key);
  }
  return keys;
}
`;
      const ofResults = JavaScriptMetricsAnalyzer.analyzeFile(forOf);
      const inResults = JavaScriptMetricsAnalyzer.analyzeFile(forIn);

      const ofDetail = ofResults[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "for...of loop"
      );
      const inDetail = inResults[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "for...in loop"
      );
      assert.ok(ofDetail, "for...of should be labelled correctly");
      assert.ok(inDetail, "for...in should be labelled correctly");
    });

    it("should count nested function expressions with internal complexity", () => {
      const sourceCode = `
function outer(items) {
  const filtered = items.filter(function(x) {
    if (x > 0) {
      return true;
    }
    return false;
  });
  return filtered;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity > 0);
      const fnExprDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "function expression (nested)"
      );
      assert.ok(fnExprDetail, "nested function expression should add complexity");
    });

    it("should name arrow function by its object property key", () => {
      const sourceCode = `
const api = {
  getData: () => {
    if (flag) {
      return data;
    }
  }
};
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "object method arrow function is a top-level entry");
      assert.strictEqual(results[0].name, "getData", "should use the property key as the function name");
      assert.strictEqual(results[0].complexity, 1);
    });

    it("should count while loops in JavaScript", () => {
      const sourceCode = `
function processQueue(queue) {
  while (queue.length > 0) {
    const item = queue.shift();
    if (item != null) {
      item.run();
    }
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // while=1, if=2 (nesting=1) → 3
      assert.strictEqual(results[0].complexity, 3);
      const whileDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "while loop"
      );
      assert.ok(whileDetail, "while loop should produce a 'while loop' reason");
    });

    it("should count nested class method inside a function", () => {
      const sourceCode = `
function outer() {
  class Processor {
    process(x) {
      if (x > 0) {
        return x;
      }
    }
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "only outer function is a top-level entry");
      const nestedMethodDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "method (nested)"
      );
      assert.ok(nestedMethodDetail, "inner class method should produce 'method (nested)' reason");
      // method nesting penalty = +1, if inside method at nesting=1 = +2 → total 3
      assert.strictEqual(results[0].complexity, 3);
    });

    it("should use (arrow function) name for arrow function not assigned to variable or object", () => {
      const sourceCode = `
module.exports = () => {
  if (x) { return 1; }
};
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "(arrow function)", "exported arrow function with no assignment should be (arrow function)");
      assert.strictEqual(results[0].complexity, 1);
    });

    it("should use (anonymous) name for anonymous function expression", () => {
      const sourceCode = `
const result = (function() {
  if (x) { return 1; }
})();
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "(anonymous)", "anonymous function expression should show (anonymous)");
      assert.strictEqual(results[0].complexity, 1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Java Analyzer Additional Coverage
  // ──────────────────────────────────────────────────────────────────────────
  describe("Java Analyzer Additional Coverage", () => {
    it("should count switch statements", () => {
      const sourceCode = `
public class Test {
  public String dayName(int n) {
    switch (n) {
      case 0: return "Sunday";
      case 6: return "Saturday";
      default: return "Weekday";
    }
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      const switchDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "switch statement"
      );
      assert.ok(switchDetail, "switch statement should add complexity");
    });

    it("should count lambda expressions", () => {
      const sourceCode = `
import java.util.Arrays;
import java.util.List;
public class Test {
  public int sumPositive(List<Integer> items) {
    return items.stream()
      .filter(x -> x > 0)
      .mapToInt(x -> x)
      .sum();
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      const lambdaDetails = results[0].details.filter((d: UnifiedMetricsDetail) =>
        d.reason === "lambda expression"
      );
      assert.ok(lambdaDetails.length >= 1, "lambda expressions should add complexity");
    });

    it("should count binary && and || operators", () => {
      const sourceCode = `
public class Test {
  public boolean check(int a, int b, int c) {
    return a > 0 && b > 0;
  }
  public boolean checkOr(int a, int b) {
    return a > 0 || b > 0;
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2);
      const andDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "binary && operator"
      );
      assert.ok(andDetail, "binary && operator should add complexity");
      const orDetail = results[1].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "binary || operator"
      );
      assert.ok(orDetail, "binary || operator should add complexity");
    });

    it("should count chained && only once (deduplication)", () => {
      // a && b && c is ONE logical chain, not two — counts once regardless of depth
      const sourceCode = `
public class Test {
  public boolean allPositive(int a, int b, int c) {
    return a > 0 && b > 0 && c > 0;
  }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // Only 1 increment for the whole && chain, not one per operand pair
      assert.strictEqual(results[0].complexity, 1, "chained && should count once");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Go Analyzer Additional Coverage
  // ──────────────────────────────────────────────────────────────────────────
  describe("Go Analyzer Additional Coverage", () => {
    it("should count labeled continue as complexity", () => {
      const sourceCode = `
package main

func processMatrix(matrix [][]int) {
outer:
    for i := 0; i < len(matrix); i++ {
        for j := 0; j < len(matrix[i]); j++ {
            if matrix[i][j] < 0 {
                continue outer
            }
        }
    }
}
`;
      const results = new GoMetricsAnalyzer().analyzeFunctions(sourceCode);
      assert.ok(results.length >= 1, "should detect at least one function");
      const detail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "labeled continue statement"
      );
      assert.ok(detail, "labeled continue should add complexity");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CSharp Analyzer Additional Coverage (switch_statement)
  // ──────────────────────────────────────────────────────────────────────────
  describe("CSharp switch_statement Coverage", () => {
    it("should count traditional switch statements", () => {
      const sourceCode = `
public class Test {
    public string GetDay(int n) {
        switch (n) {
            case 0: return "Sunday";
            case 6: return "Saturday";
            default: return "Weekday";
        }
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity >= 1);
      const switchDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "switch statement"
      );
      assert.ok(switchDetail, "switch statement should add complexity with reason 'switch statement'");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Additional Analyzer Coverage: Python, Rust, and CSharp
  // ──────────────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────
  // Python Analyzer: try/except and nested function definitions
  // ──────────────────────────────────────────────────────────────────────────
  describe("Python Analyzer: try/except and nested function scope", () => {
    it("should apply nesting penalty to except_clause", () => {
      const sourceCode = `
def safe_divide(a, b, enabled):
    if enabled:
        try:
            return a / b
        except ZeroDivisionError:
            return None
    return 0
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // if: +1, except_clause: +1 + nesting(1) = +2 => total 3
      assert.strictEqual(results[0].complexity, 3, "except clause should include nesting penalty");
      const exceptDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "except clause"
      );
      assert.ok(exceptDetail, "except clause detail should be present");
      assert.strictEqual(exceptDetail!.increment, 2, "except clause increment should be 2 at nesting level 1");
    });

    it("should count else_clause on try...except...else", () => {
      const sourceCode = `
def load(path):
    try:
        f = open(path)
    except IOError:
        return None
    else:
        return f.read()
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // except: +1, else: +1 → complexity 2
      assert.strictEqual(results[0].complexity, 2, "except + else should add 2");
      const elseDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "else clause"
      );
      assert.ok(elseDetail, "else clause after try should be counted");
      assert.strictEqual(elseDetail!.increment, 1, "else clause adds flat +1");
    });

    it("should not include nested function complexity in outer function", () => {
      // Exercises the early-return guard in visit() for function_definition nodes.
      // Inner function constructs must not bleed into outer's complexity count.
      const sourceCode = `
def outer():
    for i in range(10):
        if i > 5:
            pass

    def inner():
        if True:
            return 1
        return 0
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      // Both functions should be analyzed as separate entries
      assert.strictEqual(results.length, 2, "outer and inner analyzed independently");
      const outer = results.find((r: UnifiedFunctionMetrics) => r.name === "outer")!;
      const inner = results.find((r: UnifiedFunctionMetrics) => r.name === "inner")!;
      assert.ok(outer, "outer function should be found");
      assert.ok(inner, "inner function should be found");
      // outer: for(+1 nesting=0) + nested if(+1+1=2) = 3; inner's complexity not counted
      assert.strictEqual(outer.complexity, 3,
        "outer complexity should exclude inner function body");
      // inner: if(+1 nesting=0) = 1
      assert.strictEqual(inner.complexity, 1,
        "inner function analyzed with its own nesting context");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Rust Analyzer: scoped type identifier in impl blocks
  // ──────────────────────────────────────────────────────────────────────────
  describe("Rust Analyzer: scoped type identifier qualification", () => {
    it("should qualify method with scoped path type (impl Trait for mod::Type)", () => {
      // Exercises the scoped_type_identifier branch in getFunctionName.
      const sourceCode = `
mod animals {
    pub struct Cat;
}

trait Speak {
    fn speak(&self) -> &str;
}

impl Speak for animals::Cat {
    fn speak(&self) -> &str {
        if true { "meow" } else { "..." }
    }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.ok(results.length >= 1, "at least one function should be found");
      const speak = results.find((r: UnifiedFunctionMetrics) => r.name === "animals::Cat::speak");
      assert.ok(speak, "method should be qualified with implementing type name");
      // if/else: if +1, else +1 = 2
      assert.strictEqual(speak!.complexity, 2, "if/else adds 2 complexity");
    });
  });

  describe("CSharp Analyzer: Operators, Accessors, and Structural Types", () => {
    it("should qualify overloaded operator with 'operator<symbol>' name", () => {
      const sourceCode = `
public class Vec2 {
    public double X, Y;
    public static Vec2 operator+(Vec2 a, Vec2 b) {
        if (a == null || b == null) return new Vec2();
        return new Vec2 { X = a.X + b.X, Y = a.Y + b.Y };
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Vec2.operator+",
        "operator declaration should be named 'EnclosingType.operator<symbol>'");
      assert.ok(results[0].complexity >= 1, "operator body with if should add complexity");
    });

    it("should qualify conversion operator with 'kind operator type' name", () => {
      const sourceCode = `
public class Temperature {
    public double Celsius;
    public static explicit operator double(Temperature t) {
        if (t == null) return 0.0;
        return t.Celsius;
    }
    public static implicit operator string(Temperature t) {
        return t.Celsius.ToString();
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2);
      const explicitOp = results.find((r: UnifiedFunctionMetrics) =>
        r.name === "Temperature.explicit operator double"
      );
      assert.ok(explicitOp, "explicit conversion operator should be named 'T.explicit operator <type>'");
      assert.ok(explicitOp!.complexity >= 1, "explicit operator with if should add complexity");

      const implicitOp = results.find((r: UnifiedFunctionMetrics) =>
        r.name === "Temperature.implicit operator string"
      );
      assert.ok(implicitOp, "implicit conversion operator should be named 'T.implicit operator <type>'");
    });

    it("should analyze property accessor declarations (get/set)", () => {
      const sourceCode = `
public class Config {
    private int _value;
    public int Value {
        get {
            if (_value < 0) return 0;
            return _value;
        }
        set {
            if (value > 100) throw new ArgumentOutOfRangeException();
            _value = value;
        }
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2, "getter and setter should each be reported");
      const getter = results.find((r: UnifiedFunctionMetrics) => r.name === "Config.get");
      const setter = results.find((r: UnifiedFunctionMetrics) => r.name === "Config.set");
      assert.ok(getter, "getter should be found as Config.get");
      assert.ok(setter, "setter should be found as Config.set");
      assert.ok(getter!.complexity >= 1, "getter with if should add complexity");
      assert.ok(setter!.complexity >= 1, "setter with if should add complexity");
    });

    it("should detect local function statements and qualify them with enclosing type", () => {
      const sourceCode = `
public class Sorter {
    public void BubbleSort(int[] arr) {
        void Swap(int[] a, int i, int j) {
            if (i != j) {
                int tmp = a[i]; a[i] = a[j]; a[j] = tmp;
            }
        }
        for (int i = 0; i < arr.Length - 1; i++) {
            if (arr[i] > arr[i + 1]) Swap(arr, i, i + 1);
        }
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2, "outer method and local function should both be reported");
      const outer = results.find((r: UnifiedFunctionMetrics) => r.name === "Sorter.BubbleSort");
      const local = results.find((r: UnifiedFunctionMetrics) => r.name === "Sorter.Swap");
      assert.ok(outer, "outer method should be named 'Sorter.BubbleSort'");
      assert.ok(local, "local function should be qualified as 'Sorter.Swap'");
      assert.ok(local!.complexity >= 1, "local function with if should add complexity");
    });

    it("should handle expression-bodied methods (arrow body)", () => {
      const sourceCode = `
public class Math {
    public int Square(int n) => n * n;
    public int Abs(int n) => n >= 0 ? n : -n;
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 2);
      const square = results.find((r: UnifiedFunctionMetrics) => r.name === "Math.Square");
      assert.ok(square, "expression-bodied Square should be detected");
      assert.strictEqual(square!.complexity, 0, "pure expression body has no complexity");

      const abs = results.find((r: UnifiedFunctionMetrics) => r.name === "Math.Abs");
      assert.ok(abs, "expression-bodied Abs should be detected");
      assert.ok(abs!.complexity >= 1, "ternary in expression body should add complexity");
    });

    it("should skip abstract methods (no body)", () => {
      const sourceCode = `
public abstract class Shape {
    public abstract double Area();
    public abstract string Describe();
    public virtual double Perimeter() => 0.0;
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      const names = results.map((r: UnifiedFunctionMetrics) => r.name);
      assert.ok(!names.includes("Shape.Area"), "abstract Area() should be skipped");
      assert.ok(!names.includes("Shape.Describe"), "abstract Describe() should be skipped");
      assert.ok(names.includes("Shape.Perimeter"), "virtual with body should be included");
    });

    it("should skip interface method declarations (no body)", () => {
      const sourceCode = `
public interface IRepository<T> {
    T GetById(int id);
    void Save(T entity);
    bool Exists(int id);
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 0, "interface method stubs should produce no results");
    });

    it("should qualify struct methods with the struct name", () => {
      const sourceCode = `
public struct Point {
    public double X, Y;
    public double DistanceTo(Point other) {
        double dx = X - other.X;
        double dy = Y - other.Y;
        return System.Math.Sqrt(dx * dx + dy * dy);
    }
    public bool IsOrigin() => X == 0 && Y == 0;
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      const distMethod = results.find((r: UnifiedFunctionMetrics) => r.name === "Point.DistanceTo");
      assert.ok(distMethod, "struct method should be qualified with struct name 'Point.DistanceTo'");
      const isOrigin = results.find((r: UnifiedFunctionMetrics) => r.name === "Point.IsOrigin");
      assert.ok(isOrigin, "expression-bodied struct method 'Point.IsOrigin' should be detected");
      assert.ok(isOrigin!.complexity >= 1, "&& in IsOrigin should add complexity");
    });

    it("should qualify record methods with the record name", () => {
      const sourceCode = `
public record Temperature(double Celsius) {
    public string Classify() {
        if (Celsius < 0) return "Freezing";
        if (Celsius > 100) return "Boiling";
        return "Normal";
    }
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Temperature.Classify",
        "record method should be qualified with record name");
      assert.strictEqual(results[0].complexity, 2, "two if statements → complexity 2");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Python: list comprehension coverage
  // ──────────────────────────────────────────────────────────────────────────
  describe("Python: list comprehension coverage", () => {
    it("should count list comprehension as complexity", () => {
      const sourceCode = `
def get_evens(numbers):
    return [x for x in numbers if x % 2 == 0]
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].complexity >= 1);
      const listCompDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "list comprehension"
      );
      assert.ok(listCompDetail, "list comprehension should add complexity");
    });

    it("should count nested list comprehension with extra nesting", () => {
      const sourceCode = `
def matrix_positives(matrix):
    for row in matrix:
        positives = [x for x in row if x > 0]
    return positives
`;
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      // for: +1 (nesting→1), list_comprehension inside for: +1+1=2
      assert.strictEqual(results[0].complexity, 3, "for(+1) + nested list comp(+2) = 3");
      const listCompDetail = results[0].details.find((d: UnifiedMetricsDetail) =>
        d.reason === "list comprehension"
      );
      assert.ok(listCompDetail, "list comprehension inside for should add complexity");
      assert.strictEqual(listCompDetail!.nesting, 1, "list comp inside for has nesting=1");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Java: abstract and interface method handling
  // ──────────────────────────────────────────────────────────────────────────
  describe("Java: abstract and interface method handling", () => {
    it("should skip interface method declarations (no body)", () => {
      const sourceCode = `
public interface Drawable {
    void draw();
    double area();
    String describe();
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 0, "interface method stubs should produce no results");
    });

    it("should skip abstract class method declarations", () => {
      const sourceCode = `
public abstract class Shape {
    public abstract double area();
    public abstract String describe();
    public String toString() {
        return describe();
    }
}
`;
      const results = JavaMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(
        results.length,
        1,
        "abstract methods should be skipped; only concrete methods should be reported"
      );
      assert.strictEqual(results[0].name, "Shape.toString");
      assert.strictEqual(results[0].complexity, 0, "toString has no control flow");
    });
  });

  describe("JS/TS Generator Function Coverage", () => {
    it("should collect a top-level generator function declaration", () => {
      const sourceCode = `
function* counter() {
  let i = 0;
  while (true) {
    yield i++;
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "generator function should be collected");
      assert.strictEqual(results[0].name, "counter");
      assert.strictEqual(results[0].complexity, 1, "while loop adds 1");
    });

    it("should collect an async generator function declaration", () => {
      const sourceCode = `
async function* asyncCounter() {
  if (true) {
    yield 1;
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "async generator should be collected");
      assert.strictEqual(results[0].name, "asyncCounter");
      assert.strictEqual(results[0].complexity, 1, "if adds 1");
    });

    it("should collect a named generator function expression", () => {
      const sourceCode = `
const myGen = function* namedGen() {
  if (true) { yield 1; }
};
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "named generator expression should be collected");
      assert.strictEqual(results[0].name, "namedGen");
    });

    it("should collect an anonymous generator function expression", () => {
      const sourceCode = `
const gen = function* () {
  yield 1;
};
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "anonymous generator expression should be collected");
      assert.ok(
        results[0].name === "(anonymous)" || results[0].name === "gen",
        "anonymous generator should have a placeholder name"
      );
    });

    it("should apply nesting penalty to a generator function expression nested inside another function", () => {
      const sourceCode = `
function outer() {
  const gen = function* () {
    if (true) { yield 1; }
  };
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "only outer should be top-level");
      // nested generator adds +1 (for the nesting penalty)
      // the if inside the generator adds +1 base + 1 nesting = 2
      // total outer = 1 (nested generator) + 2 (if inside) = 3
      assert.strictEqual(results[0].complexity, 3, "nested generator should contribute complexity to outer");
    });

    it("should collect a TypeScript generator function", () => {
      const sourceCode = `
function* tsGen(): Generator<number> {
  for (let i = 0; i < 3; i++) {
    yield i;
  }
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "TS generator should be collected");
      assert.strictEqual(results[0].name, "tsGen");
      assert.strictEqual(results[0].complexity, 1, "for loop adds 1");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // JS/TS: Unlabeled break/continue should NOT add complexity
  // ──────────────────────────────────────────────────────────────────────────
  describe("JS/TS: Unlabeled break and continue do not add complexity", () => {
    it("should not count unlabeled break in a switch as complexity", () => {
      // Exercises the branch: node.firstNamedChild?.type !== "statement_identifier" → 0
      const sourceCode = `
function getLabel(n) {
  switch (n) {
    case 1:
      break;
    default:
      break;
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "one function expected");
      const breakDetails = results[0].details.filter(
        (d: UnifiedMetricsDetail) => d.reason === "labeled break statement"
      );
      assert.strictEqual(breakDetails.length, 0, "unlabeled break should not add complexity");
      // switch adds 1 complexity; the two unlabeled breaks should add 0
      assert.strictEqual(results[0].complexity, 1, "only switch contributes complexity");
    });

    it("should not count unlabeled continue in a for loop as complexity", () => {
      // Exercises the branch: node.firstNamedChild?.type !== "statement_identifier" → 0
      const sourceCode = `
function skipEven(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] % 2 === 0) continue;
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "one function expected");
      const continueDetails = results[0].details.filter(
        (d: UnifiedMetricsDetail) => d.reason === "labeled continue statement"
      );
      assert.strictEqual(continueDetails.length, 0, "unlabeled continue should not add complexity");
      // for(+1) + if(+2) = 3
      assert.strictEqual(results[0].complexity, 3, "for + if contribute complexity, continue does not");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // JS: Anonymous class expression methods have no class name qualifier
  // ──────────────────────────────────────────────────────────────────────────
  describe("JS: Anonymous class expression method naming", () => {
    it("should name method without class prefix when class is anonymous", () => {
      // Exercises getEnclosingClassName returning null (lines 284-285 of jsLikeAnalyzer)
      // when a class expression has no name field.
      const sourceCode = `
const instance = new (class {
  compute(x) {
    if (x > 0) {
      return x;
    }
    return -x;
  }
})();
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.ok(results.length >= 1, "method inside anonymous class should be collected");
      const compute = results.find((r: UnifiedFunctionMetrics) => r.name === "compute");
      assert.ok(compute, "method should be named 'compute' without a class prefix");
      assert.ok(compute!.complexity >= 1, "if statement should add complexity");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Rust: Closure at top nesting level does not add complexity
  // ──────────────────────────────────────────────────────────────────────────
  describe("Rust: Top-level closure does not add complexity", () => {
    it("should not add complexity for a closure at nesting level 0", () => {
      // Exercises the branch: this.nesting > 0 ? 1 : 0 for closure_expression → 0
      const sourceCode = `
fn apply() -> i32 {
    let double = |x: i32| x * 2;
    double(5)
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "one function expected");
      assert.strictEqual(results[0].complexity, 0, "no complexity: top-level closure does not add complexity");
      const closureDetail = results[0].details.find(
        (d: UnifiedMetricsDetail) => d.reason === "closure (nested)"
      );
      assert.strictEqual(closureDetail, undefined, "top-level closure should not produce a complexity detail");
    });

    it("should add complexity for a closure nested inside a control flow", () => {
      // Exercises the branch: this.nesting > 0 → 1 for closure_expression
      const sourceCode = `
fn transform(items: Vec<i32>) -> Vec<i32> {
    if items.is_empty() {
        vec![]
    } else {
        items.iter().map(|x| x * 2).collect()
    }
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "one function expected");
      // if: +1 (structural); else_clause: +1 (flat, per rustAnalyzer getComplexityIncrement);
      // closure |x| inside else block runs at nesting=1, so closure_expression: +1
      assert.ok(results[0].complexity >= 2, "if, else, and nested closure add complexity");
      const closureDetail = results[0].details.find(
        (d: UnifiedMetricsDetail) => d.reason === "closure (nested)"
      );
      assert.ok(closureDetail, "closure nested inside else should produce a 'closure (nested)' detail");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Rust: Unlabeled break/continue do not add complexity
  // ──────────────────────────────────────────────────────────────────────────
  describe("Rust: Unlabeled break and continue do not add complexity", () => {
    it("should not count unlabeled break as complexity", () => {
      // Exercises the branch: hasLabel → false → return 0 for break_expression
      const sourceCode = `
fn first_positive(items: &[i32]) -> Option<i32> {
    for &x in items {
        if x > 0 {
            break;
        }
    }
    None
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "one function expected");
      const breakDetails = results[0].details.filter(
        (d: UnifiedMetricsDetail) => d.reason === "labeled break"
      );
      assert.strictEqual(breakDetails.length, 0, "unlabeled break should not add complexity");
    });

    it("should not count unlabeled continue as complexity", () => {
      // Exercises the branch: hasLabel → false → return 0 for continue_expression
      const sourceCode = `
fn sum_positives(items: &[i32]) -> i32 {
    let mut total = 0;
    for &x in items {
        if x <= 0 { continue; }
        total += x;
    }
    total
}
`;
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "one function expected");
      const continueDetails = results[0].details.filter(
        (d: UnifiedMetricsDetail) => d.reason === "labeled continue"
      );
      assert.strictEqual(continueDetails.length, 0, "unlabeled continue should not add complexity");
    });
  });

  // CSharp preprocessor-block coverage
  // These tests exercise heuristic paths in the C# analyzer that handle method bodies
  // fragmented by #if/#else preprocessor directives (tree-sitter emits ERROR nodes for
  // code that spans directive boundaries).
  describe("CSharp: preprocessor-block ERROR and malformed-declaration paths", () => {
    it("should detect a catch clause isolated in a preprocessor #else ERROR node", () => {
      // When a method body is split across #if / #else, tree-sitter emits ERROR nodes.
      // This covers getComplexityReasonFromErrorNode's "catch clause (in preprocessor block)"
      // branch (line ~714) and the getComplexityReason "ERROR" case (line ~816).
      const sourceCode = `
public class Foo {
    public void Bar()
#if DEBUG
    { }
#else
    {
        catch (Exception e) { }
    }
#endif
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "one method expected");
      const catchDetail = results[0].details.find(
        (d: UnifiedMetricsDetail) => d.reason === "catch clause (in preprocessor block)"
      );
      assert.ok(
        catchDetail !== undefined,
        "catch clause in a preprocessor ERROR node should be reported"
      );
      assert.ok(results[0].complexity >= 1, "complexity should be at least 1");
    });

    it("should detect a ternary operator in a field_declaration inside a preprocessor #if block", () => {
      // When the method body opening brace is inside #if, a local declaration with a
      // ternary gets parsed as a field_declaration by tree-sitter.
      // Covers getComplexityReasonFromMalformedDeclaration's ternary branch (~line 739-740)
      // and the getComplexityReason "field_declaration" / "variable_declaration" case (~line 819).
      const sourceCode = `
public class Foo {
    public void Ternary()
#if DEBUG
    {
        int result = x > 0 ? 1 : 0;
    }
#else
    { }
#endif
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "one method expected");
      const ternaryDetail = results[0].details.find(
        (d: UnifiedMetricsDetail) =>
          d.reason === "ternary operator (in preprocessor block)" ||
          d.reason === "ternary operator"
      );
      assert.ok(
        ternaryDetail !== undefined,
        "ternary operator inside a preprocessor-fragmented body should be detected"
      );
    });

    it("should detect logical operators in a field_declaration inside a preprocessor #if block", () => {
      // Covers getComplexityReasonFromMalformedDeclaration's logical-operator branch (~line 742-744).
      const sourceCode = `
public class Foo {
    public void Logic()
#if DEBUG
    {
        bool v = a && b || c;
    }
#else
    { }
#endif
}
`;
      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1, "one method expected");
      const logicDetail = results[0].details.find(
        (d: UnifiedMetricsDetail) =>
          d.reason === "logical operator (in preprocessor block)" ||
          d.reason.startsWith("logical") ||
          d.reason.startsWith("binary")
      );
      assert.ok(
        logicDetail !== undefined,
        "logical operator inside a preprocessor-fragmented body should be detected"
      );
    });
  });
});
