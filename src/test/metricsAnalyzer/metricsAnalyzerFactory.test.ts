import * as assert from "assert";
import {
  MetricsAnalyzerFactory,
  UnifiedFunctionMetrics,
  UnifiedMetricsDetail,
} from "../../metricsAnalyzer/metricsAnalyzerFactory";

suite("Metrics Analyzer Factory Tests", () => {
  suite("Supported Languages", () => {
    test("should return array of supported languages", () => {
      const languages = MetricsAnalyzerFactory.getSupportedLanguages();

      assert.ok(Array.isArray(languages));
      assert.ok(languages.length > 0);
      assert.ok(languages.includes("csharp"));
      assert.ok(languages.includes("go"));
    });

    test("should return consistent language list", () => {
      const languages1 = MetricsAnalyzerFactory.getSupportedLanguages();
      const languages2 = MetricsAnalyzerFactory.getSupportedLanguages();

      assert.deepStrictEqual(languages1, languages2);
    });
  });

  suite("C# Language Analysis", () => {
    test("should analyze simple C# function", () => {
      const sourceCode = `
                public class Test {
                    public int Add(int a, int b) {
                        return a + b;
                    }
                }
            `;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    test("should analyze C# function with complexity", () => {
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

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Max");
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details.length, 1);
      assert.strictEqual(results[0].details[0].reason, "if statement");
      assert.strictEqual(results[0].details[0].increment, 1);
    });

    test("should handle complex C# code with multiple functions", () => {
      const sourceCode = `
                public class Calculator {
                    public int Add(int a, int b) {
                        return a + b;
                    }

                    public int Divide(int a, int b) {
                        if (b == 0) {
                            throw new ArgumentException("Division by zero");
                        }
                        return a / b;
                    }

                    public string ProcessNumbers(List<int> numbers) {
                        if (numbers == null || numbers.Count == 0) {
                            return "Empty";
                        }

                        foreach (var number in numbers) {
                            if (number < 0) {
                                continue;
                            }
                        }

                        return "Processed";
                    }
                }
            `;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results.length, 3);

      const addFunction = results.find((f) => f.name === "Add");
      const divideFunction = results.find((f) => f.name === "Divide");
      const processFunction = results.find((f) => f.name === "ProcessNumbers");

      assert.ok(addFunction);
      assert.ok(divideFunction);
      assert.ok(processFunction);

      assert.strictEqual(addFunction.complexity, 0);
      assert.strictEqual(divideFunction.complexity, 1); // if statement
      assert.strictEqual(processFunction.complexity, 5); // if + || operator + foreach + nested if + nested continue
    });

    test("should handle C# code with logical operators", () => {
      const sourceCode = `
                public class Test {
                    public bool ComplexCondition(bool a, bool b, bool c) {
                        return a && b || c;
                    }
                }
            `;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 2); // && and || operators
      assert.strictEqual(results[0].details.length, 2);

      const andDetail = results[0].details.find((d) => d.reason.includes("&&"));
      const orDetail = results[0].details.find((d) => d.reason.includes("||"));

      assert.ok(andDetail);
      assert.ok(orDetail);
    });

    test("should handle C# code with try-catch blocks", () => {
      const sourceCode = `
                public class Test {
                    public void RiskyOperation() {
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

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 3); // try + 2 catch blocks

      const tryDetail = results[0].details.find(
        (d) => d.reason === "try statement"
      );
      const catchDetails = results[0].details.filter(
        (d) => d.reason === "catch clause"
      );

      assert.ok(tryDetail);
      assert.strictEqual(catchDetails.length, 2);
    });
  });

  suite("Unsupported Languages", () => {
    test("should return empty array for unsupported language", () => {
      const sourceCode = `
                def hello_world():
                    print("Hello, World!")
            `;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "python");

      assert.strictEqual(results.length, 0);
    });

    test("should return empty array for unknown language", () => {
      const sourceCode = "some code";

      const results = MetricsAnalyzerFactory.analyzeFile(
        sourceCode,
        "unknown-language"
      );

      assert.strictEqual(results.length, 0);
    });

    test("should handle null/undefined language gracefully", () => {
      const sourceCode = "some code";

      const resultsNull = MetricsAnalyzerFactory.analyzeFile(
        sourceCode,
        null as any
      );
      const resultsUndefined = MetricsAnalyzerFactory.analyzeFile(
        sourceCode,
        undefined as any
      );

      assert.strictEqual(resultsNull.length, 0);
      assert.strictEqual(resultsUndefined.length, 0);
    });
  });

  suite("Line and Column Normalization", () => {
    test("should normalize line numbers to 1-based indexing", () => {
      const sourceCode = `public class Test {
    public void Method() {
        if (true) {
            return;
        }
    }
}`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].details.length, 1);

      // The if statement should be on line 3 (1-based)
      // Original analyzer returns 0-based (line 2), factory should normalize to 1-based (line 3)
      assert.strictEqual(results[0].details[0].line, 3);
    });

    test("should normalize column numbers to 1-based indexing", () => {
      const sourceCode = `public class Test {
    public void Method() {
        if (true) return;
    }
}`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].details.length, 1);

      // Column should be normalized from 0-based to 1-based
      assert.ok(results[0].details[0].column >= 1);
    });

    test("should preserve nesting levels", () => {
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

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results[0].details.length, 4);

      // Find details and verify nesting is preserved
      const sortedDetails = results[0].details.sort(
        (a, b) => a.nesting - b.nesting
      );

      assert.strictEqual(sortedDetails[0].nesting, 0); // outer if
      assert.strictEqual(sortedDetails[1].nesting, 1); // while
      assert.strictEqual(sortedDetails[2].nesting, 2); // inner if
      assert.strictEqual(sortedDetails[3].nesting, 3); // break
    });
  });

  suite("Function Boundary Information", () => {
    test("should preserve function start and end positions", () => {
      const sourceCode = `public class Test {
    public void FirstMethod() {
        if (true) return;
    }

    public void SecondMethod() {
        while (false) break;
    }
}`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results.length, 2);

      const firstMethod = results.find((f) => f.name === "FirstMethod");
      const secondMethod = results.find((f) => f.name === "SecondMethod");

      assert.ok(firstMethod);
      assert.ok(secondMethod);

      // Verify positions are numbers and in correct order
      assert.ok(typeof firstMethod.startLine === "number");
      assert.ok(typeof firstMethod.endLine === "number");
      assert.ok(typeof firstMethod.startColumn === "number");
      assert.ok(typeof firstMethod.endColumn === "number");

      assert.ok(firstMethod.startLine <= firstMethod.endLine);
      assert.ok(secondMethod.startLine <= secondMethod.endLine);
      assert.ok(firstMethod.endLine < secondMethod.startLine);
    });
  });

  suite("Data Structure Validation", () => {
    test("should return valid UnifiedFunctionMetrics objects", () => {
      const sourceCode = `
                public class Test {
                    public void TestMethod() {
                        if (true && false) {
                            return;
                        }
                    }
                }
            `;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results.length, 1);

      const func = results[0];

      // Verify all required properties exist
      assert.ok(typeof func.name === "string");
      assert.ok(typeof func.complexity === "number");
      assert.ok(Array.isArray(func.details));
      assert.ok(typeof func.startLine === "number");
      assert.ok(typeof func.endLine === "number");
      assert.ok(typeof func.startColumn === "number");
      assert.ok(typeof func.endColumn === "number");

      // Verify details structure
      func.details.forEach((detail: UnifiedMetricsDetail) => {
        assert.ok(typeof detail.increment === "number");
        assert.ok(typeof detail.reason === "string");
        assert.ok(typeof detail.line === "number");
        assert.ok(typeof detail.column === "number");
        assert.ok(typeof detail.nesting === "number");

        assert.ok(detail.increment > 0);
        assert.ok(detail.reason.length > 0);
        assert.ok(detail.line >= 1); // 1-based indexing
        assert.ok(detail.column >= 1); // 1-based indexing
        assert.ok(detail.nesting >= 0);
      });
    });
  });

  suite("Error Handling", () => {
    test("should handle malformed C# code gracefully", () => {
      const malformedCode = `
                public class Test {
                    public void Method() {
                        if (true {  // Missing closing parenthesis
                            return;
                        }
                    }
                }
            `;

      // Should not throw an exception, but may return empty or partial results
      assert.doesNotThrow(() => {
        const results = MetricsAnalyzerFactory.analyzeFile(
          malformedCode,
          "csharp"
        );
        assert.ok(Array.isArray(results));
      });
    });

    test("should handle empty source code", () => {
      const results = MetricsAnalyzerFactory.analyzeFile("", "csharp");

      assert.strictEqual(results.length, 0);
    });

    test("should handle whitespace-only source code", () => {
      const results = MetricsAnalyzerFactory.analyzeFile(
        "   \n\t  \n  ",
        "csharp"
      );

      assert.strictEqual(results.length, 0);
    });

    test("should handle source code with only comments", () => {
      const sourceCode = `
                // This is a comment
                /* This is a block comment */
                // Another comment
            `;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results.length, 0);
    });
  });

  suite("Integration with Real-World C# Code", () => {
    test("should analyze complex real-world example", () => {
      const sourceCode = `
                using System;
                using System.Collections.Generic;
                using System.Linq;

                namespace ComplexityTest
                {
                    public class Calculator
                    {
                        public int Add(int a, int b)
                        {
                            return a + b;
                        }

                        public string ProcessData(List<int> numbers, bool includeNegatives)
                        {
                            var result = new List<string>();

                            foreach (var number in numbers)
                            {
                                if (number > 0)
                                {
                                    result.Add(number.ToString());
                                }
                                else if (includeNegatives && number < 0)
                                {
                                    result.Add($"({Math.Abs(number)})");
                                }
                                else
                                {
                                    continue;
                                }
                            }

                            if (result.Count > 10)
                            {
                                return string.Join(", ", result.Take(10)) + "...";
                            }
                            else if (result.Count == 0)
                            {
                                return "No valid numbers";
                            }
                            else
                            {
                                return string.Join(", ", result);
                            }
                        }

                        public bool IsComplexCondition(int value, bool flag1, bool flag2)
                        {
                            if ((value > 10 && flag1) || (value < 0 && flag2))
                            {
                                for (int i = 0; i < value; i++)
                                {
                                    if (i % 2 == 0 && i % 3 == 0)
                                    {
                                        try
                                        {
                                            var result = 100 / i;
                                            if (result > 50)
                                            {
                                                return true;
                                            }
                                        }
                                        catch (DivideByZeroException)
                                        {
                                            return false;
                                        }
                                    }
                                }
                            }

                            return false;
                        }
                    }
                }
            `;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "csharp");

      assert.strictEqual(results.length, 3);

      const addFunction = results.find((f) => f.name === "Add");
      const processDataFunction = results.find((f) => f.name === "ProcessData");
      const isComplexConditionFunction = results.find(
        (f) => f.name === "IsComplexCondition"
      );

      assert.ok(addFunction);
      assert.ok(processDataFunction);
      assert.ok(isComplexConditionFunction);

      // Add function should have no complexity
      assert.strictEqual(addFunction.complexity, 0);

      // ProcessData should have moderate complexity
      assert.ok(processDataFunction.complexity > 0);
      assert.ok(processDataFunction.complexity < 10);

      // IsComplexCondition should have high complexity due to nested conditions
      assert.ok(isComplexConditionFunction.complexity > 5);

      // Verify that all functions have reasonable position information
      results.forEach((func) => {
        assert.ok(func.startLine >= 0);
        assert.ok(func.endLine >= func.startLine);
        assert.ok(func.startColumn >= 0);
        assert.ok(func.endColumn >= 0);
      });
    });
  });

  suite("Go Language Analysis", () => {
    test("should analyze simple Go function", () => {
      const sourceCode = `
package main

func Add(a, b int) int {
    return a + b
}
`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "go");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    test("should analyze Go function with complexity", () => {
      const sourceCode = `
package main

func Max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "go");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Max");
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details.length, 1);
      assert.strictEqual(results[0].details[0].reason, "if statement");
      assert.strictEqual(results[0].details[0].increment, 1);
    });

    test("should handle complex Go code with multiple functions", () => {
      const sourceCode = `
package main

func Add(a, b int) int {
    return a + b
}

func Divide(a, b int) int {
    if b == 0 {
        panic("division by zero")
    }
    return a / b
}

func ProcessNumbers(numbers []int) string {
    if numbers == nil || len(numbers) == 0 {
        return "Empty"
    }

    for _, number := range numbers {
        if number < 0 {
            continue
        }
    }

    return "Processed"
}
`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "go");

      assert.strictEqual(results.length, 3);

      const addFunction = results.find((f) => f.name === "Add");
      const divideFunction = results.find((f) => f.name === "Divide");
      const processFunction = results.find((f) => f.name === "ProcessNumbers");

      assert.ok(addFunction);
      assert.ok(divideFunction);
      assert.ok(processFunction);

      assert.strictEqual(addFunction.complexity, 0);
      assert.strictEqual(divideFunction.complexity, 1); // if statement
      // if(1) + ||(2) + for(1) + nested if(2) + nested continue(3) = 9
      assert.strictEqual(processFunction.complexity, 9);
    });

    test("should handle Go code with logical operators", () => {
      const sourceCode = `
package main

func ComplexCondition(a, b, c bool) bool {
    return a && b || c
}
`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "go");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 2); // && and || operators
      assert.strictEqual(results[0].details.length, 2);

      const andDetail = results[0].details.find((d) => d.reason.includes("&&"));
      const orDetail = results[0].details.find((d) => d.reason.includes("||"));

      assert.ok(andDetail);
      assert.ok(orDetail);
    });

    test("should handle Go methods with receivers", () => {
      const sourceCode = `
package main

type Calculator struct{}

func (c Calculator) Add(a, b int) int {
    return a + b
}

func (c *Calculator) MultiplyWithCheck(a, b int) int {
    if a < 0 || b < 0 {
        return 0
    }
    return a * b
}
`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "go");

      assert.strictEqual(results.length, 2);

      const addMethod = results.find((f) => f.name === "Calculator.Add");
      const multiplyMethod = results.find(
        (f) => f.name === "*Calculator.MultiplyWithCheck"
      );

      assert.ok(addMethod);
      assert.ok(multiplyMethod);

      assert.strictEqual(addMethod.complexity, 0);
      assert.strictEqual(multiplyMethod.complexity, 3); // if(1) + ||(2 nested in if)
    });

    test("should handle Go switch statements", () => {
      const sourceCode = `
package main

func SwitchTest(value int) string {
    switch value {
    case 1:
        return "one"
    case 2:
        return "two"
    default:
        return "other"
    }
}
`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "go");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "switch statement");
    });

    test("should handle Go type switch statements", () => {
      const sourceCode = `
package main

func TypeSwitchTest(value interface{}) string {
    switch value.(type) {
    case int:
        return "integer"
    case string:
        return "string"
    default:
        return "unknown"
    }
}
`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "go");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "type switch statement");
    });

    test("should handle Go select statements", () => {
      const sourceCode = `
package main

func SelectTest(ch chan int) {
    select {
    case v := <-ch:
        _ = v
    default:
        return
    }
}
`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "go");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "select statement");
    });

    test("should normalize Go line numbers to 1-based indexing", () => {
      const sourceCode = `package main

func Method() {
    if true {
        return
    }
}`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "go");

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].details.length, 1);

      // The if statement should be on line 4 (1-based)
      // Original analyzer returns 0-based (line 3), factory should normalize to 1-based (line 4)
      assert.strictEqual(results[0].details[0].line, 4);
    });

    test("should handle Go recover calls", () => {
      const sourceCode = `
package main

func SafeOperation() {
    defer func() {
        if r := recover(); r != nil {
            // handle panic
        }
    }()
}
`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "go");

      assert.strictEqual(results.length, 1);
      // Should have complexity for recover call
      const hasRecover = results[0].details.some(
        (d) => d.reason === "recover call"
      );
      assert.ok(hasRecover, "Should detect recover call");
    });
  });

  suite("Integration with Real-World Go Code", () => {
    test("should analyze complex real-world Go example", () => {
      const sourceCode = `
package main

import "fmt"

func Add(a, b int) int {
    return a + b
}

func ProcessData(numbers []int, includeNegatives bool) []string {
    result := make([]string, 0)

    for _, number := range numbers {
        if number > 0 {
            result = append(result, fmt.Sprintf("%d", number))
        } else if includeNegatives && number < 0 {
            result = append(result, fmt.Sprintf("(%d)", -number))
        } else {
            continue
        }
    }

    if len(result) > 10 {
        return result[:10]
    } else if len(result) == 0 {
        return nil
    }

    return result
}

func IsComplexCondition(value int, flag1, flag2 bool) bool {
    if (value > 10 && flag1) || (value < 0 && flag2) {
        for i := 0; i < value; i++ {
            if i%2 == 0 && i%3 == 0 {
                defer func() {
                    if r := recover(); r != nil {
                        // handle
                    }
                }()
                if 100/i > 50 {
                    return true
                }
            }
        }
    }

    return false
}
`;

      const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, "go");

      assert.strictEqual(results.length, 3);

      const addFunction = results.find((f) => f.name === "Add");
      const processDataFunction = results.find((f) => f.name === "ProcessData");
      const isComplexConditionFunction = results.find(
        (f) => f.name === "IsComplexCondition"
      );

      assert.ok(addFunction);
      assert.ok(processDataFunction);
      assert.ok(isComplexConditionFunction);

      // Add function should have no complexity
      assert.strictEqual(addFunction.complexity, 0);

      // ProcessData should have moderate complexity
      assert.ok(processDataFunction.complexity > 0);
      assert.ok(processDataFunction.complexity < 20);
      results.forEach((func) => {
        assert.ok(func.startLine >= 0);
        assert.ok(func.endLine >= func.startLine);
        assert.ok(func.startColumn >= 0);
        assert.ok(func.endColumn >= 0);
      });
    });
  });
});
