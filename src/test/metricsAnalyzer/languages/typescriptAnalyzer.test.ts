import * as assert from "assert";
import { TypeScriptMetricsAnalyzer } from "../../../metricsAnalyzer/languages/typescriptAnalyzer";

suite("TypeScript Metrics Analyzer Tests", () => {
  suite("Basic Function Analysis", () => {
    test("should analyze simple function with no complexity", () => {
      const sourceCode = `
function add(a: number, b: number): number {
  return a + b;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    test("should analyze typed arrow function", () => {
      const sourceCode = `
const greet = (name: string): string => \`Hello, \${name}\`;
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "greet");
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should analyze class method with TypeScript types", () => {
      const sourceCode = `
class Stack<T> {
  push(item: T): void {
    this.items.push(item);
  }
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "push");
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should ignore type-only constructs (interfaces, type aliases)", () => {
      const sourceCode = `
interface Shape {
  area(): number;
}

type Point = { x: number; y: number };

function compute(s: Shape): number {
  return s.area();
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // Only the concrete function should appear
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "compute");
    });

    test("should return empty array for source with no functions", () => {
      const sourceCode = `const x: number = 42;`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 0);
    });
  });

  suite("If / Else Statements", () => {
    test("should count if statement", () => {
      const sourceCode = `
function max(a: number, b: number): number {
  if (a > b) {
    return a;
  }
  return b;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "if statement");
      assert.strictEqual(results[0].details[0].increment, 1);
    });

    test("should count else clause as flat +1", () => {
      const sourceCode = `
function sign(n: number): string {
  if (n > 0) {
    return "positive";
  } else {
    return "non-positive";
  }
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 2);
      const elseDetail = results[0].details.find((d) => d.reason === "else clause");
      assert.ok(elseDetail);
      assert.strictEqual(elseDetail!.increment, 1);
    });

    test("should count else-if chain without double-counting", () => {
      const sourceCode = `
function grade(score: number): string {
  if (score >= 90) {
    return "A";
  } else if (score >= 80) {
    return "B";
  } else if (score >= 70) {
    return "C";
  } else {
    return "F";
  }
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // if(1) + else-if(1) + else-if(1) + else(1) = 4
      assert.strictEqual(results[0].complexity, 4);
      const reasons = results[0].details.map((d) => d.reason);
      assert.strictEqual(reasons.filter((r) => r === "else if clause").length, 2);
      assert.strictEqual(reasons.filter((r) => r === "else clause").length, 1);
    });

    test("should apply nesting to nested ifs", () => {
      const sourceCode = `
function deep(a: boolean, b: boolean, c: boolean): boolean {
  if (a) {
    if (b) {
      if (c) {
        return true;
      }
    }
  }
  return false;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // outer if(1) + middle if(2) + inner if(3) = 6
      assert.strictEqual(results[0].complexity, 6);
    });
  });

  suite("Loops", () => {
    test("should count for loop", () => {
      const sourceCode = `
function total(nums: number[]): number {
  let sum = 0;
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
  }
  return sum;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for loop");
    });

    test("should count for...in loop", () => {
      const sourceCode = `
function keys(obj: Record<string, unknown>): string[] {
  const result: string[] = [];
  for (const key in obj) {
    result.push(key);
  }
  return result;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for...in loop");
    });

    test("should count for...of loop", () => {
      const sourceCode = `
function printAll(items: string[]): void {
  for (const item of items) {
    console.log(item);
  }
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for...of loop");
    });

    test("should count while loop", () => {
      const sourceCode = `
function countdown(n: number): void {
  while (n > 0) {
    n--;
  }
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "while loop");
    });

    test("should count do...while loop", () => {
      const sourceCode = `
function atLeastOnce(n: number): void {
  do {
    n--;
  } while (n > 0);
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "do...while loop");
    });
  });

  suite("Switch Statements", () => {
    test("should count switch statement", () => {
      const sourceCode = `
function direction(key: string): string {
  switch (key) {
    case "w": return "up";
    case "s": return "down";
    default: return "none";
  }
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "switch statement");
    });
  });

  suite("Exception Handling", () => {
    test("should count catch clause", () => {
      const sourceCode = `
function safe(fn: () => void): void {
  try {
    fn();
  } catch (e) {
    console.error(e);
  }
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "catch clause");
    });
  });

  suite("Logical Operators", () => {
    test("should count && operator", () => {
      const sourceCode = `
function isActive(enabled: boolean, valid: boolean): boolean {
  return enabled && valid;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "logical && operator");
    });

    test("should count || operator", () => {
      const sourceCode = `
function hasAccess(isAdmin: boolean, isOwner: boolean): boolean {
  return isAdmin || isOwner;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "logical || operator");
    });

    test("should count ?? (nullish coalescing) operator", () => {
      const sourceCode = `
function getOrDefault(value: string | null, def: string): string {
  return value ?? def;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "logical ?? operator");
    });
  });

  suite("Ternary Expressions", () => {
    test("should count ternary expression", () => {
      const sourceCode = `
function abs(n: number): number {
  return n >= 0 ? n : -n;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "ternary expression");
    });
  });

  suite("Nested Functions and Arrow Functions", () => {
    test("should count nesting penalty for nested arrow function on outer", () => {
      const sourceCode = `
function outer(): () => number {
  const inner = (): number => {
    if (Math.random() > 0.5) {
      return 1;
    }
    return 0;
  };
  return inner;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // The analyzer only returns the outer function; nested function metrics are not accumulated
      assert.strictEqual(results.length, 1);
      const outerFunc = results.find((r) => r.name === "outer");
      assert.ok(outerFunc);
      // nested arrow at nesting=0 → +1
      assert.strictEqual(outerFunc!.complexity, 1);
    });

    test("should add nesting penalty to outer function for nested arrow", () => {
      const sourceCode = `
function outer(): void {
  if (true) {
    const inner = () => 42;
  }
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      const outerFunc = results.find((r) => r.name === "outer");
      assert.ok(outerFunc);
      // if(1) + nested arrow at nesting=1 → +2 = 3
      assert.strictEqual(outerFunc!.complexity, 3);
    });
  });

  suite("Multiple Functions", () => {
    test("should analyze multiple functions independently", () => {
      const sourceCode = `
function simple(x: number): number {
  return x * 2;
}

function complex(a: number, b: number, c: number): number {
  if (a > 0) {
    if (b > 0) {
      return a + b;
    }
  } else if (c > 0) {
    return c;
  }
  return 0;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 2);
      const simple = results.find((r) => r.name === "simple");
      const complex = results.find((r) => r.name === "complex");
      assert.strictEqual(simple!.complexity, 0);
      // if(1) + nested if(2) + else-if(1) = 4
      assert.strictEqual(complex!.complexity, 4);
    });
  });

  suite("TypeScript-Specific Constructs", () => {
    test("should not add complexity for type assertions", () => {
      const sourceCode = `
function convert(value: unknown): string {
  return (value as string).toLowerCase();
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 0);
    });

    test("should not add complexity for generic type parameters", () => {
      const sourceCode = `
function identity<T>(value: T): T {
  return value;
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 0);
    });

    test("should analyze async function correctly", () => {
      const sourceCode = `
async function fetchData(url: string): Promise<string> {
  if (!url) {
    throw new Error("URL required");
  }
  const response = await fetch(url);
  return response.text();
}
`;
      const results = TypeScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1); // one if statement
      assert.strictEqual(results[0].details[0].reason, "if statement");
    });
  });
});
