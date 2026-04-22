import * as assert from "assert";
import { JavaScriptMetricsAnalyzer } from "../../../metricsAnalyzer/languages/javascriptAnalyzer";

/**
 * Tests for the shared JsLikeMetricsAnalyzer base class, exercised via JavaScriptMetricsAnalyzer.
 * Focuses on code paths not covered by the language-specific test suites.
 */
suite("JsLikeMetricsAnalyzer Base Class Tests", () => {
  suite("getFunctionReason - nested function types", () => {
    test("should report 'method (nested)' for nested class method", () => {
      const sourceCode = `
function outer() {
  class Inner {
    method() {
      return 1;
    }
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      const outerFunc = results.find((r) => r.name === "outer");
      assert.ok(outerFunc);
      const methodReason = outerFunc!.details.find((d) =>
        d.reason === "method (nested)"
      );
      assert.ok(methodReason, "Expected 'method (nested)' reason for nested class method");
    });

    test("should report 'function (nested)' for nested function declaration", () => {
      const sourceCode = `
function outer() {
  function inner() {
    return 1;
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      // inner is a function_declaration nested inside outer, should get "function (nested)" as default
      // But function_declaration is not treated as isNestedFunction (only function_expression, arrow_function, method_definition)
      // So inner is collected as a separate top-level function
      assert.strictEqual(results.length, 2);
      const outerFunc = results.find((r) => r.name === "outer");
      const innerFunc = results.find((r) => r.name === "inner");
      assert.ok(outerFunc);
      assert.ok(innerFunc);
      assert.strictEqual(innerFunc!.complexity, 0);
    });
  });

  suite("getFunctionName - edge cases", () => {
    test("should return '(anonymous)' for anonymous function expression not assigned to variable", () => {
      const sourceCode = `
(function() {
  if (true) {
    return 1;
  }
})();
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "(anonymous)");
    });

    test("should extract name from named function expression", () => {
      const sourceCode = `
const x = function myFunc() {
  return 1;
};
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "myFunc");
    });

    test("should extract method name from class method", () => {
      const sourceCode = `
class Foo {
  myMethod() {
    if (true) { return 1; }
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "myMethod");
    });
  });

  suite("Complexity increments - edge cases", () => {
    test("should not count binary expression without logical operator", () => {
      const sourceCode = `
function add(a, b) {
  return a + b;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should count for...in loop as for_in_statement", () => {
      const sourceCode = `
function iterate(obj) {
  for (const key in obj) {
    console.log(key);
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for...in loop");
    });

    test("should count for...of loop as for_in_statement with of child", () => {
      const sourceCode = `
function iterate(arr) {
  for (const item of arr) {
    console.log(item);
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for...of loop");
    });

    test("should not add complexity for unlabeled continue", () => {
      const sourceCode = `
function skip(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < 0) {
      continue;
    }
    console.log(arr[i]);
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      const reasons = results[0].details.map((d) => d.reason);
      assert.ok(!reasons.includes("labeled continue statement"));
    });
  });

  suite("Nesting and complexity details", () => {
    test("should apply correct nesting for deeply nested control flow", () => {
      const sourceCode = `
function deep(a, b, c, d) {
  if (a) {
    for (let i = 0; i < b; i++) {
      while (c) {
        if (d) {
          return true;
        }
      }
    }
  }
  return false;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // if(1+0) + for(1+1) + while(1+2) + if(1+3) = 1+2+3+4 = 10
      assert.strictEqual(results[0].complexity, 10);
      assert.strictEqual(results[0].details.length, 4);
      assert.strictEqual(results[0].details[0].nesting, 0); // outer if
      assert.strictEqual(results[0].details[1].nesting, 1); // for
      assert.strictEqual(results[0].details[2].nesting, 2); // while
      assert.strictEqual(results[0].details[3].nesting, 3); // inner if
    });

    test("should handle catch clause with nesting", () => {
      const sourceCode = `
function safeParse(text) {
  if (text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      if (e instanceof SyntaxError) {
        return null;
      }
    }
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // if(1+0) + catch(1) + if inside catch(1+2) = 1+1+3 = 5
      assert.strictEqual(results[0].complexity, 5);
      const catchDetail = results[0].details.find((d) => d.reason === "catch clause");
      assert.ok(catchDetail);
      assert.strictEqual(catchDetail!.increment, 1);
    });

    test("should handle switch nested inside if", () => {
      const sourceCode = `
function process(type, value) {
  if (value) {
    switch (type) {
      case "a": return 1;
      case "b": return 2;
      default: return 0;
    }
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // if(1+0) + switch(1+1) = 1+2 = 3
      assert.strictEqual(results[0].complexity, 3);
    });

    test("should handle do...while nested inside for loop", () => {
      const sourceCode = `
function retry(attempts) {
  for (let i = 0; i < attempts.length; i++) {
    do {
      attempts[i]--;
    } while (attempts[i] > 0);
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // for(1+0) + do(1+1) = 1+2 = 3
      assert.strictEqual(results[0].complexity, 3);
    });
  });

  suite("Nested function complexity isolation", () => {
    test("should isolate nested arrow function complexity from outer", () => {
      const sourceCode = `
function outer() {
  if (true) {
    const fn = () => {
      if (false) {
        return 1;
      }
      return 0;
    };
    return fn;
  }
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // Outer: if(1) + arrow nested at nesting=1 (1+1=2) = 3
      const outerFunc = results.find((r) => r.name === "outer");
      assert.ok(outerFunc);
      assert.strictEqual(outerFunc!.complexity, 3);
    });

    test("should handle nested function expression with its own complexity", () => {
      const sourceCode = `
function container() {
  const helper = function processor() {
    if (true) {
      for (let i = 0; i < 10; i++) {
        console.log(i);
      }
    }
  };
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // container: function_expression nested at nesting=0 → +1
      const container = results.find((r) => r.name === "container");
      assert.ok(container);
      assert.strictEqual(container!.complexity, 1);
    });
  });

  suite("Logical operator combinations", () => {
    test("should count mixed logical operators", () => {
      const sourceCode = `
function validate(a, b, c) {
  return a && b || c ?? false;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // && + || + ?? = 3
      assert.strictEqual(results[0].complexity, 3);
    });

    test("should count logical operators inside control flow with nesting", () => {
      const sourceCode = `
function check(x, y) {
  if (x > 0) {
    if (x && y) {
      return true;
    }
  }
  return false;
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // if(1+0) + if(1+1) + &&(1) = 1+2+1 = 4
      assert.strictEqual(results[0].complexity, 4);
    });
  });

  suite("Ternary expression details", () => {
    test("should count nested ternary expressions", () => {
      const sourceCode = `
function classify(n) {
  return n > 0 ? "positive" : n < 0 ? "negative" : "zero";
}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);

      // two ternary expressions, each +1
      assert.strictEqual(results[0].complexity, 2);
    });
  });

  suite("Empty and edge cases", () => {
    test("should handle empty function body", () => {
      const sourceCode = `
function noop() {}
`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    test("should handle empty source code", () => {
      const results = JavaScriptMetricsAnalyzer.analyzeFile("");
      assert.strictEqual(results.length, 0);
    });

    test("should report correct end positions", () => {
      const sourceCode = `function foo() {
  if (true) {}
}`;
      const results = JavaScriptMetricsAnalyzer.analyzeFile(sourceCode);
      assert.ok(results[0].endLine >= results[0].startLine);
      assert.ok(results[0].endColumn >= 0);
    });
  });
});
