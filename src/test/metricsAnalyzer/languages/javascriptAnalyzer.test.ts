import * as assert from "assert";
import { JavaScriptMetricsAnalyzer } from "../../../metricsAnalyzer/languages/javascriptAnalyzer";

suite("JavaScript Metrics Analyzer Tests", () => {
  suite("Basic Function Analysis", () => {
    test("should analyze simple function with no complexity", () => {
      const sourceCode = `
function add(a, b) {
  return a + b;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    test("should analyze arrow function with no complexity", () => {
      const sourceCode = `
const multiply = (a, b) => a * b;
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "multiply");
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should analyze class method", () => {
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
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should return empty array for source with no functions", () => {
      const sourceCode = `const x = 42;`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 0);
    });
  });

  suite("If / Else Statements", () => {
    test("should count if statement with nesting", () => {
      const sourceCode = `
function max(a, b) {
  if (a > b) {
    return a;
  }
  return b;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "if statement");
      assert.strictEqual(results[0].details[0].increment, 1);
      assert.strictEqual(results[0].details[0].nesting, 0);
    });

    test("should count else clause as flat +1", () => {
      const sourceCode = `
function classify(n) {
  if (n > 0) {
    return "positive";
  } else {
    return "non-positive";
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 2);
      const elseDetail = results[0].details.find((d) => d.reason === "else clause");
      assert.ok(elseDetail);
      assert.strictEqual(elseDetail!.increment, 1);
    });

    test("should count else-if clause as flat +1 (not double-counted)", () => {
      const sourceCode = `
function grade(score) {
  if (score >= 90) {
    return "A";
  } else if (score >= 80) {
    return "B";
  } else {
    return "C";
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // if(1) + else-if(1) + else(1) = 3
      assert.strictEqual(results[0].complexity, 3);
      const reasons = results[0].details.map((d) => d.reason);
      assert.ok(reasons.includes("if statement"));
      assert.ok(reasons.includes("else if clause"));
      assert.ok(reasons.includes("else clause"));
    });

    test("should apply nesting to nested if statements", () => {
      const sourceCode = `
function nested(a, b, c) {
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
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // outer if(1) + middle if(1+1=2) + inner if(1+2=3) = 6
      assert.strictEqual(results[0].complexity, 6);
      assert.strictEqual(results[0].details[0].increment, 1); // outer if
      assert.strictEqual(results[0].details[1].increment, 2); // middle if
      assert.strictEqual(results[0].details[2].increment, 3); // inner if
    });
  });

  suite("Loops", () => {
    test("should count for loop", () => {
      const sourceCode = `
function sum(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for loop");
    });

    test("should count for...in loop", () => {
      const sourceCode = `
function keys(obj) {
  const result = [];
  for (const key in obj) {
    result.push(key);
  }
  return result;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for...in loop");
    });

    test("should count for...of loop", () => {
      const sourceCode = `
function printAll(items) {
  for (const item of items) {
    console.log(item);
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for...of loop");
    });

    test("should count while loop", () => {
      const sourceCode = `
function countdown(n) {
  while (n > 0) {
    n--;
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "while loop");
    });

    test("should count do...while loop", () => {
      const sourceCode = `
function atLeastOnce(n) {
  do {
    n--;
  } while (n > 0);
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "do...while loop");
    });
  });

  suite("Switch Statements", () => {
    test("should count switch statement", () => {
      const sourceCode = `
function dayName(day) {
  switch (day) {
    case 1: return "Monday";
    case 2: return "Tuesday";
    default: return "Other";
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "switch statement");
    });
  });

  suite("Exception Handling", () => {
    test("should count catch clause", () => {
      const sourceCode = `
function safe(fn) {
  try {
    fn();
  } catch (e) {
    console.error(e);
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "catch clause");
    });
  });

  suite("Logical Operators", () => {
    test("should count && operator", () => {
      const sourceCode = `
function isAdult(age, hasId) {
  return age >= 18 && hasId;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "logical && operator");
    });

    test("should count || operator", () => {
      const sourceCode = `
function isWeekend(day) {
  return day === "Saturday" || day === "Sunday";
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "logical || operator");
    });

    test("should count ?? (nullish coalescing) operator", () => {
      const sourceCode = `
function getOrDefault(value, defaultValue) {
  return value ?? defaultValue;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "logical ?? operator");
    });

    test("should count each logical operator separately", () => {
      const sourceCode = `
function check(a, b, c) {
  return a && b || c;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // && and || are each +1
      assert.strictEqual(results[0].complexity, 2);
    });
  });

  suite("Ternary Expressions", () => {
    test("should count ternary expression", () => {
      const sourceCode = `
function abs(n) {
  return n >= 0 ? n : -n;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "ternary expression");
    });
  });

  suite("Nested Functions", () => {
    test("should analyze nested arrow function separately", () => {
      const sourceCode = `
function outer() {
  const inner = () => {
    if (true) {
      return 1;
    }
  };
  return inner;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // Both outer and inner should appear
      assert.strictEqual(results.length, 2);
      const outerFunc = results.find((r) => r.name === "outer");
      const innerFunc = results.find((r) => r.name === "inner");
      assert.ok(outerFunc);
      assert.ok(innerFunc);
      // inner has an if statement (+1)
      assert.strictEqual(innerFunc!.complexity, 1);
    });

    test("should add nesting penalty to outer function for nested arrow function", () => {
      const sourceCode = `
function outer() {
  if (true) {
    const inner = () => 42;
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      const outerFunc = results.find((r) => r.name === "outer");
      assert.ok(outerFunc);
      // if(1) + nested arrow inside if(1+1=2) = 3
      assert.strictEqual(outerFunc!.complexity, 3);
    });
  });

  suite("Multiple Functions", () => {
    test("should analyze multiple top-level functions independently", () => {
      const sourceCode = `
function simple() {
  return 1;
}

function complex(a, b) {
  if (a > 0) {
    if (b > 0) {
      return a + b;
    }
  }
  return 0;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 2);
      const simple = results.find((r) => r.name === "simple");
      const complex = results.find((r) => r.name === "complex");
      assert.strictEqual(simple!.complexity, 0);
      assert.strictEqual(complex!.complexity, 3); // if(1) + nested if(2)
    });
  });

  suite("Line and Column Positions", () => {
    test("should report correct 0-based start position for function", () => {
      const sourceCode = `
function foo() {
  if (true) {}
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results[0].startLine, 1); // 0-based, line 2 in editor
      assert.strictEqual(results[0].startColumn, 0);
    });

    test("should report 1-based line for complexity detail (normalized by factory)", () => {
      // The raw analyzer returns 0-based lines; the factory normalizes to 1-based.
      // Test the raw analyzer directly (before factory normalization).
      const analyzer = new JavaScriptMetricsAnalyzer();
      const sourceCode = `
function foo() {
  if (x) {}
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      // Raw: if is on line index 2 (0-based)
      assert.strictEqual(results[0].details[0].line, 2);
    });
  });
});
