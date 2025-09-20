import * as assert from "assert";
import { CSharpMetricsAnalyzer } from "../../../metricsAnalyzer/languages/csharpAnalyzer";

suite("CSharp Metrics Analyzer Tests", () => {
  let analyzer: CSharpMetricsAnalyzer;

  setup(() => {
    analyzer = new CSharpMetricsAnalyzer();
  });

  suite("Basic Function Analysis", () => {
    test("should analyze simple function with no complexity", () => {
      const sourceCode = `
                public class Test {
                    public int Add(int a, int b) {
                        return a + b;
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    test("should analyze function with if statement", () => {
      const sourceCode = `
                public class Test {
                    public int Max(int a, int b) {
                        if (a > b) {
                            return a;
                        }
                        return b;
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Max");
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details.length, 1);
      assert.strictEqual(results[0].details[0].reason, "if statement");
      assert.strictEqual(results[0].details[0].increment, 1);
    });

    test("should analyze function with multiple control flow statements", () => {
      const sourceCode = `
                public class Test {
                    public string Process(int value) {
                        if (value > 0) {
                            for (int i = 0; i < value; i++) {
                                if (i % 2 == 0) {
                                    continue;
                                }
                            }
                        }
                        return value.ToString();
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Process");
      // Expected complexity: if(1) + for(1) + nested if(1) + nested continue(1) = 4
      assert.strictEqual(results[0].complexity, 4);
      assert.strictEqual(results[0].details.length, 4);
    });
  });

  suite("Control Flow Statements", () => {
    test("should handle while loops", () => {
      const sourceCode = `
                public class Test {
                    public void WhileLoop() {
                        while (true) {
                            break;
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 2);
      assert.strictEqual(results[0].details[0].reason, "while loop");
      assert.strictEqual(
        results[0].details[1].reason,
        "break statement (nested)"
      );
    });

    test("should handle for loops", () => {
      const sourceCode = `
                public class Test {
                    public void ForLoop() {
                        for (int i = 0; i < 10; i++) {
                            // do something
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for loop");
    });

    test("should handle foreach loops", () => {
      const sourceCode = `
                public class Test {
                    public void ForEachLoop(int[] array) {
                        foreach (int item in array) {
                            // do something
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "foreach loop");
    });

    test("should handle switch statements", () => {
      const sourceCode = `
                public class Test {
                    public string SwitchTest(int value) {
                        switch (value) {
                            case 1: return "one";
                            case 2: return "two";
                            default: return "other";
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "switch statement");
    });

    test("should handle switch expressions", () => {
      const sourceCode = `
                public class Test {
                    public string SwitchExpression(int value) {
                        return value switch {
                            1 => "one",
                            2 => "two",
                            _ => "other"
                        };
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "switch expression");
    });
  });

  suite("Exception Handling", () => {
    test("should handle try-catch blocks", () => {
      const sourceCode = `
                public class Test {
                    public void TryCatch() {
                        try {
                            // risky code
                        }
                        catch (Exception ex) {
                            // handle exception
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 2);
      assert.strictEqual(results[0].details.length, 2);

      const tryDetail = results[0].details.find(
        (d) => d.reason === "try statement"
      );
      const catchDetail = results[0].details.find(
        (d) => d.reason === "catch clause"
      );

      assert.ok(tryDetail);
      assert.ok(catchDetail);
    });

    test("should handle multiple catch blocks", () => {
      const sourceCode = `
                public class Test {
                    public void MultipleCatch() {
                        try {
                            // risky code
                        }
                        catch (ArgumentException ex) {
                            // handle argument exception
                        }
                        catch (InvalidOperationException ex) {
                            // handle invalid operation
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 3); // try + 2 catches
      assert.strictEqual(results[0].details.length, 3);
    });
  });

  suite("Logical Operators", () => {
    test("should handle && operator", () => {
      const sourceCode = `
                public class Test {
                    public bool AndOperator(bool a, bool b) {
                        return a && b;
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "binary && operator");
    });

    test("should handle || operator", () => {
      const sourceCode = `
                public class Test {
                    public bool OrOperator(bool a, bool b) {
                        return a || b;
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "binary || operator");
    });

    test("should handle multiple logical operators", () => {
      const sourceCode = `
                public class Test {
                    public bool ComplexCondition(bool a, bool b, bool c) {
                        return a && b || c;
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 2); // && and ||
      assert.strictEqual(results[0].details.length, 2);
    });
  });

  suite("Conditional Expressions", () => {
    test("should handle ternary operator", () => {
      const sourceCode = `
                public class Test {
                    public int Ternary(bool condition) {
                        return condition ? 1 : 0;
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "ternary operator");
    });

    test("should handle nested ternary operators", () => {
      const sourceCode = `
                public class Test {
                    public int NestedTernary(bool a, bool b) {
                        return a ? (b ? 1 : 2) : 3;
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 2); // Two ternary operators
    });
  });

  suite("Nesting and Lambda Expressions", () => {
    test("should handle lambda expressions in nested context", () => {
      const sourceCode = `
                public class Test {
                    public void NestedLambda(List<int> numbers) {
                        if (numbers.Any()) {
                            numbers.Where(x => x > 0).ToList();
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      // Expected: if statement (1) + lambda in nested context (1) = 2
      assert.strictEqual(results[0].complexity, 2);
    });

    test("should not count lambda at top level", () => {
      const sourceCode = `
                public class Test {
                    public void TopLevelLambda(List<int> numbers) {
                        numbers.Where(x => x > 0).ToList();
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      // Lambda at top level doesn't increase complexity
      assert.strictEqual(results[0].complexity, 0);
    });
  });

  suite("Jump Statements", () => {
    test("should handle goto statements", () => {
      const sourceCode = `
                public class Test {
                    public void GotoTest() {
                        goto label;
                        label:
                        return;
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "goto statement");
    });

    test("should handle continue in nested context", () => {
      const sourceCode = `
                public class Test {
                    public void NestedContinue() {
                        for (int i = 0; i < 10; i++) {
                            if (i % 2 == 0) {
                                continue;
                            }
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      // for (1) + nested if (1) + nested continue (1) = 3
      assert.strictEqual(results[0].complexity, 3);
    });

    test("should handle break in nested context", () => {
      const sourceCode = `
                public class Test {
                    public void NestedBreak() {
                        while (true) {
                            if (someCondition) {
                                break;
                            }
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      // while (1) + nested if (1) + nested break (1) = 3
      assert.strictEqual(results[0].complexity, 3);
    });
  });

  suite("Function Types", () => {
    test("should analyze constructors", () => {
      const sourceCode = `
                public class Test {
                    public Test(int value) {
                        if (value < 0) {
                            throw new ArgumentException();
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Test (constructor)");
      assert.strictEqual(results[0].complexity, 1);
    });

    test("should analyze destructors", () => {
      const sourceCode = `
                public class Test {
                    ~Test() {
                        if (disposed) {
                            return;
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "~<destructor>");
      assert.strictEqual(results[0].complexity, 1);
    });

    test("should analyze property accessors", () => {
      const sourceCode = `
                public class Test {
                    private int _value;
                    public int Value {
                        get {
                            if (_value < 0) {
                                return 0;
                            }
                            return _value;
                        }
                        set {
                            if (value < 0) {
                                throw new ArgumentException();
                            }
                            _value = value;
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].complexity, 1); // getter with if
      assert.strictEqual(results[1].complexity, 1); // setter with if
    });

    test("should analyze operator overloads", () => {
      const sourceCode = `
                public class Test {
                    public static Test operator +(Test a, Test b) {
                        if (a == null || b == null) {
                            return null;
                        }
                        return new Test();
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 2); // if (+1) with logical OR (+1)
    });

    test("should analyze local functions", () => {
      const sourceCode = `
                public class Test {
                    public void OuterMethod() {
                        if (someCondition) {
                            LocalFunction();
                        }

                        void LocalFunction() {
                            for (int i = 0; i < 10; i++) {
                                // do something
                            }
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);

      const outerMethod = results.find((f) => f.name === "OuterMethod");
      const localFunction = results.find((f) => f.name === "LocalFunction");

      assert.ok(outerMethod);
      assert.ok(localFunction);
      assert.strictEqual(outerMethod.complexity, 1); // if statement
      assert.strictEqual(localFunction.complexity, 1); // for loop
    });
  });

  suite("Edge Cases", () => {
    test("should handle empty class", () => {
      const sourceCode = `
                public class EmptyClass {
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 0);
    });

    test("should handle abstract methods", () => {
      const sourceCode = `
                public abstract class Test {
                    public abstract void AbstractMethod();

                    public void ConcreteMethod() {
                        if (true) {
                            return;
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      // Should only find the concrete method, not the abstract one
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "ConcreteMethod");
    });

    test("should handle interface methods", () => {
      const sourceCode = `
                public interface ITest {
                    void InterfaceMethod();
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      // Interface methods have no body, should be empty
      assert.strictEqual(results.length, 0);
    });

    test("should handle expression-bodied methods", () => {
      const sourceCode = `
                public class Test {
                    public int ExpressionMethod(int x) => x > 0 ? x : -x;
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1); // ternary operator
    });

    test("should handle nested classes", () => {
      const sourceCode = `
                public class Outer {
                    public void OuterMethod() {
                        if (true) return;
                    }

                    public class Inner {
                        public void InnerMethod() {
                            while (true) break;
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);

      const outerMethod = results.find((f) => f.name === "OuterMethod");
      const innerMethod = results.find((f) => f.name === "InnerMethod");

      assert.ok(outerMethod);
      assert.ok(innerMethod);
      assert.strictEqual(outerMethod.complexity, 1);
      assert.strictEqual(innerMethod.complexity, 2); // while loop + nested break
    });
  });

  suite("Position Information", () => {
    test("should provide correct line and column information", () => {
      const sourceCode = `public class Test {
    public void Method() {
        if (true) {
            return;
        }
    }
}`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].startLine, 1); // 0-based line number
      assert.strictEqual(results[0].details.length, 1);
      assert.strictEqual(results[0].details[0].line, 2); // if statement line (0-based)
    });

    test("should provide correct nesting information", () => {
      const sourceCode = `
                public class Test {
                    public void Method() {
                        if (true) {
                            while (true) {
                                if (false) {
                                    break;
                                }
                            }
                        }
                    }
                }
            `;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].details.length, 4);

      // Find details by reason to check nesting levels
      const ifDetail = results[0].details.find(
        (d) => d.reason === "if statement"
      );
      const whileDetail = results[0].details.find(
        (d) => d.reason === "while loop"
      );
      const nestedIfDetail = results[0].details.filter(
        (d) => d.reason === "if statement"
      )[1];
      const breakDetail = results[0].details.find(
        (d) => d.reason === "break statement (nested)"
      );

      assert.strictEqual(ifDetail?.nesting, 0);
      assert.strictEqual(whileDetail?.nesting, 1);
      assert.strictEqual(nestedIfDetail?.nesting, 2);
      assert.strictEqual(breakDetail?.nesting, 3);
    });
  });

  suite("Static Factory Method", () => {
    test("should work with static analyzeFile method", () => {
      const sourceCode = `
                public class Test {
                    public int SimpleMethod(int x) {
                        if (x > 0) {
                            return x;
                        }
                        return 0;
                    }
                }
            `;

      const results = CSharpMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "SimpleMethod");
      assert.strictEqual(results[0].complexity, 1);
    });
  });
});
