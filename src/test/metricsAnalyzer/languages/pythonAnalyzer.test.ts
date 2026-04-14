import * as assert from "assert";
import { PythonMetricsAnalyzer } from "../../../metricsAnalyzer/languages/pythonAnalyzer";

suite("Python Metrics Analyzer Tests", () => {
  let analyzer: PythonMetricsAnalyzer;

  setup(() => {
    analyzer = new PythonMetricsAnalyzer();
  });

  suite("Basic Function Analysis", () => {
    test("should analyze simple function with no complexity", () => {
      const sourceCode = `
def add(a, b):
    return a + b
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    test("should analyze function with if statement", () => {
      const sourceCode = `
def max_val(a, b):
    if a > b:
        return a
    return b
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "max_val");
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "if statement");
    });

    test("should analyze multiple functions in same file", () => {
      const sourceCode = `
def add(a, b):
    return a + b

def subtract(a, b):
    if a < b:
        return 0
    return a - b
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].name, "add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[1].name, "subtract");
      assert.strictEqual(results[1].complexity, 1);
    });

    test("should handle empty file", () => {
      const results = analyzer.analyzeFunctions("");
      assert.strictEqual(results.length, 0);
    });

    test("should handle file with no functions", () => {
      const results = analyzer.analyzeFunctions("x = 1\ny = 2\n");
      assert.strictEqual(results.length, 0);
    });
  });

  suite("Control Flow Statements", () => {
    test("should handle elif clause", () => {
      const sourceCode = `
def classify(x):
    if x > 0:
        return "positive"
    elif x < 0:
        return "negative"
    else:
        return "zero"
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 2);
      const reasons = results[0].details.map((d) => d.reason);
      assert.ok(reasons.includes("if statement"));
      assert.ok(reasons.includes("elif clause"));
    });

    test("should handle for loop", () => {
      const sourceCode = `
def iterate(items):
    for item in items:
        pass
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for loop");
    });

    test("should handle while loop", () => {
      const sourceCode = `
def countdown(n):
    while n > 0:
        n -= 1
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "while loop");
    });

    test("should handle try/except", () => {
      const sourceCode = `
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return 0
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "except clause");
    });

    test("should handle multiple except clauses", () => {
      const sourceCode = `
def parse(text):
    try:
        return int(text)
    except ValueError:
        return 0
    except TypeError:
        return -1
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 2);
      assert.ok(results[0].details.every((d) => d.reason === "except clause"));
    });

    test("should handle nested control flow", () => {
      const sourceCode = `
def process(items):
    for item in items:
        if item > 0:
            pass
`;
      // for(1) + if(1+1 nesting) = 3
      const results = analyzer.analyzeFunctions(sourceCode);
      assert.strictEqual(results[0].complexity, 3);
    });
  });

  suite("Boolean Operators", () => {
    test("should handle 'and' operator", () => {
      const sourceCode = `
def check(a, b):
    return a and b
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "boolean and operator");
    });

    test("should handle 'or' operator", () => {
      const sourceCode = `
def check(a, b):
    return a or b
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "boolean or operator");
    });

    test("should handle chained boolean operators", () => {
      const sourceCode = `
def check(a, b, c):
    return a and b or c
`;
      // and(1) + or(1) = 2
      const results = analyzer.analyzeFunctions(sourceCode);
      assert.strictEqual(results[0].complexity, 2);
    });
  });

  suite("Conditional Expressions", () => {
    test("should handle ternary conditional expression", () => {
      const sourceCode = `
def absolute(x):
    return x if x >= 0 else -x
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "conditional expression");
    });
  });

  suite("Comprehensions", () => {
    test("should handle list comprehension", () => {
      const sourceCode = `
def evens(items):
    return [x for x in items]
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "list comprehension");
    });

    test("should handle dictionary comprehension", () => {
      const sourceCode = `
def invert(d):
    return {v: k for k, v in d.items()}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "dictionary comprehension");
    });

    test("should handle generator expression", () => {
      const sourceCode = `
def total(items):
    return sum(x for x in items)
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "generator expression");
    });
  });

  suite("Lambda Expressions", () => {
    test("should not count top-level lambda as extra complexity", () => {
      const sourceCode = `
def make_adder(n):
    return lambda x: x + n
`;
      // lambda at nesting 0 → no increment
      const results = analyzer.analyzeFunctions(sourceCode);
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should count nested lambda", () => {
      const sourceCode = `
def process(items):
    if items:
        fn = lambda x: x * 2
        return fn
`;
      // if(1) + lambda nested at nesting 1 → 1+1 = 2, total = 3
      const results = analyzer.analyzeFunctions(sourceCode);
      assert.ok(results[0].complexity >= 2, "nested lambda should add complexity");
    });
  });

  suite("Class Methods", () => {
    test("should analyze methods with class prefix", () => {
      const sourceCode = `
class Calculator:
    def add(self, a, b):
        return a + b
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Calculator.add");
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should analyze multiple methods independently", () => {
      const sourceCode = `
class Math:
    def add(self, a, b):
        return a + b

    def max_val(self, a, b):
        if a > b:
            return a
        return b
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].name, "Math.add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[1].name, "Math.max_val");
      assert.strictEqual(results[1].complexity, 1);
    });
  });

  suite("Nested Functions", () => {
    test("should analyze nested function as separate entry", () => {
      const sourceCode = `
def outer():
    def inner():
        if True:
            pass
    return inner
`;
      // outer: 0 complexity (inner's if is not counted here)
      // inner: 1 complexity
      const results = analyzer.analyzeFunctions(sourceCode);
      const outer = results.find((r) => r.name === "outer");
      const inner = results.find((r) => r.name === "inner");
      assert.ok(outer, "outer function should be found");
      assert.ok(inner, "inner function should be found");
      assert.strictEqual(outer!.complexity, 0);
      assert.strictEqual(inner!.complexity, 1);
    });
  });

  suite("Position Information", () => {
    test("should return correct start line for function", () => {
      const sourceCode = `def first():
    pass

def second():
    if True:
        pass`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].startLine, 0);
      assert.strictEqual(results[1].startLine, 3);
    });
  });

  suite("Static Factory Method", () => {
    test("should analyze file using static method", () => {
      const sourceCode = `
def check(a, b):
    if a > 0 and b > 0:
        return True
    return False
`;
      // if(1) + and(1+1 nesting) = 3
      const results = PythonMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "check");
      assert.strictEqual(results[0].complexity, 3);
    });
  });
});
