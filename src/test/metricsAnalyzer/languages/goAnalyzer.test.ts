import * as assert from "assert";
import { GoMetricsAnalyzer } from "../../../metricsAnalyzer/languages/goAnalyzer";

suite("Go Metrics Analyzer Tests", () => {
  let analyzer: GoMetricsAnalyzer;

  setup(() => {
    analyzer = new GoMetricsAnalyzer();
  });

  suite("Basic Function Analysis", () => {
    test("should analyze simple function with no complexity", () => {
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

    test("should analyze function with if statement", () => {
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
      assert.strictEqual(results[0].details[0].increment, 1);
    });

    test("should analyze function with multiple control flow statements", () => {
      const sourceCode = `
package main

func Process(value int) string {
    if value > 0 {
        for i := 0; i < value; i++ {
            if i%2 == 0 {
                continue
            }
        }
    }
    return ""
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Process");
      // Expected complexity: if(1) + for(1) + nested if(1) + nested continue(1) = 4
      assert.strictEqual(results[0].complexity, 4);
      assert.strictEqual(results[0].details.length, 4);
    });

    test("should analyze multiple functions in same file", () => {
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

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].name, "Add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[1].name, "Subtract");
      assert.strictEqual(results[1].complexity, 1);
    });
  });

  suite("Control Flow Statements", () => {
    test("should handle for loops", () => {
      const sourceCode = `
package main

func ForLoop() {
    for i := 0; i < 10; i++ {
        // do something
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for loop");
    });

    test("should handle for range loops", () => {
      const sourceCode = `
package main

func ForRangeLoop(items []int) {
    for _, item := range items {
        _ = item
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for loop");
    });

    test("should handle infinite for loops", () => {
      const sourceCode = `
package main

func InfiniteLoop() {
    for {
        break
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // for(1) + nested break(1) = 2
      assert.strictEqual(results[0].complexity, 2);
    });

    test("should handle while-style for loops", () => {
      const sourceCode = `
package main

func WhileStyleLoop(condition bool) {
    for condition {
        break
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // for(1) + nested break(1) = 2
      assert.strictEqual(results[0].complexity, 2);
    });

    test("should handle expression switch statements", () => {
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

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "switch statement");
    });

    test("should handle type switch statements", () => {
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

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "type switch statement");
    });

    test("should handle select statements", () => {
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

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "select statement");
    });

    test("should handle nested select in for loop", () => {
      const sourceCode = `
package main

func NestedSelect(ch chan int, done chan bool) {
    for {
        select {
        case v := <-ch:
            _ = v
        case <-done:
            return
        }
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // for(1) + select(1) = 2
      assert.strictEqual(results[0].complexity, 2);
    });
  });

  suite("Logical Operators", () => {
    test("should handle && operator", () => {
      const sourceCode = `
package main

func AndOperator(a, b bool) bool {
    return a && b
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "binary && operator");
    });

    test("should handle || operator", () => {
      const sourceCode = `
package main

func OrOperator(a, b bool) bool {
    return a || b
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "binary || operator");
    });

    test("should handle multiple logical operators", () => {
      const sourceCode = `
package main

func ComplexCondition(a, b, c bool) bool {
    return a && b || c
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 2); // && and ||
      assert.strictEqual(results[0].details.length, 2);
    });

    test("should handle logical operators in if conditions", () => {
      const sourceCode = `
package main

func ConditionalLogic(a, b int) bool {
    if a > 0 && b > 0 {
        return true
    }
    return false
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // if(1) + &&(1) = 2
      assert.strictEqual(results[0].complexity, 2);
    });
  });

  suite("Recover Calls", () => {
    test("should handle recover calls", () => {
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

      const results = analyzer.analyzeFunctions(sourceCode);

      // func_literal at nesting 0 doesn't add, if(1) + recover(1) = 2
      assert.ok(results[0].complexity >= 2);
    });

    test("should handle recover in deferred function", () => {
      const sourceCode = `
package main

func RecoverExample() (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = r.(error)
        }
    }()
    panic("test")
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // Should include complexity for if and recover
      const hasRecover = results[0].details.some(
        (d) => d.reason === "recover call"
      );
      assert.ok(hasRecover, "Should detect recover call");
    });
  });

  suite("Function Literals (Closures)", () => {
    test("should handle closure at top level (no extra complexity)", () => {
      const sourceCode = `
package main

func TopLevelClosure() {
    fn := func() {
        // do something
    }
    fn()
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // Closure at top level doesn't add complexity
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should handle closure in nested context", () => {
      const sourceCode = `
package main

func NestedClosure(items []int) {
    if len(items) > 0 {
        fn := func() {
            // do something
        }
        fn()
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // if(1) + nested closure(1) = 2
      assert.strictEqual(results[0].complexity, 2);
    });

    test("should handle deeply nested closures", () => {
      const sourceCode = `
package main

func DeeplyNestedClosure() {
    if true {
        if true {
            fn := func() {
                // nested closure
            }
            fn()
        }
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // if(1) + if(1) + nested closure(1) = 3
      assert.strictEqual(results[0].complexity, 3);
    });
  });

  suite("Jump Statements", () => {
    test("should handle goto statements", () => {
      const sourceCode = `
package main

func GotoTest() {
    goto label
label:
    return
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "goto statement");
    });

    test("should handle labeled break statements", () => {
      const sourceCode = `
package main

func LabeledBreak() {
outer:
    for i := 0; i < 10; i++ {
        for j := 0; j < 10; j++ {
            if j == 5 {
                break outer
            }
        }
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // for(1) + for(1) + if(1) + labeled break(1) = 4
      assert.strictEqual(results[0].complexity, 4);
      const labeledBreak = results[0].details.find(
        (d) => d.reason === "labeled break statement"
      );
      assert.ok(labeledBreak, "Should detect labeled break");
    });

    test("should handle labeled continue statements", () => {
      const sourceCode = `
package main

func LabeledContinue() {
outer:
    for i := 0; i < 10; i++ {
        for j := 0; j < 10; j++ {
            if j == 5 {
                continue outer
            }
        }
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // for(1) + for(1) + if(1) + labeled continue(1) = 4
      assert.strictEqual(results[0].complexity, 4);
      const labeledContinue = results[0].details.find(
        (d) => d.reason === "labeled continue statement"
      );
      assert.ok(labeledContinue, "Should detect labeled continue");
    });

    test("should handle break in nested context", () => {
      const sourceCode = `
package main

func NestedBreak() {
    for {
        if true {
            break
        }
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // for(1) + if(1) + nested break(1) = 3
      assert.strictEqual(results[0].complexity, 3);
    });

    test("should handle continue in nested context", () => {
      const sourceCode = `
package main

func NestedContinue() {
    for i := 0; i < 10; i++ {
        if i%2 == 0 {
            continue
        }
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // for(1) + if(1) + nested continue(1) = 3
      assert.strictEqual(results[0].complexity, 3);
    });
  });

  suite("Method Declarations", () => {
    test("should analyze methods with value receivers", () => {
      const sourceCode = `
package main

type Calculator struct{}

func (c Calculator) Add(a, b int) int {
    return a + b
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Calculator.Add");
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should analyze methods with pointer receivers", () => {
      const sourceCode = `
package main

type Counter struct {
    value int
}

func (c *Counter) Increment() {
    if c.value < 100 {
        c.value++
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "*Counter.Increment");
      assert.strictEqual(results[0].complexity, 1);
    });

    test("should analyze multiple methods on same type", () => {
      const sourceCode = `
package main

type Math struct{}

func (m Math) Add(a, b int) int {
    return a + b
}

func (m Math) Max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].name, "Math.Add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[1].name, "Math.Max");
      assert.strictEqual(results[1].complexity, 1);
    });
  });

  suite("Goroutines", () => {
    test("should not add complexity for go statement itself", () => {
      const sourceCode = `
package main

func SpawnGoroutine() {
    go func() {
        // concurrent work
    }()
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // go statement doesn't add complexity, closure at top level = 0
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should add complexity for nested goroutine with closure", () => {
      const sourceCode = `
package main

func NestedGoroutine() {
    if true {
        go func() {
            // concurrent work
        }()
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // if(1) + nested closure(1) = 2
      assert.strictEqual(results[0].complexity, 2);
    });
  });

  suite("Edge Cases", () => {
    test("should handle empty function", () => {
      const sourceCode = `
package main

func Empty() {
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Empty");
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should handle function with only return", () => {
      const sourceCode = `
package main

func ReturnOnly() int {
    return 42
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should handle empty file", () => {
      const sourceCode = `package main
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 0);
    });

    test("should handle file with only imports", () => {
      const sourceCode = `
package main

import "fmt"
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 0);
    });

    test("should handle complex real-world function", () => {
      const sourceCode = `
package main

func ProcessData(items []int, includeNegatives bool) []int {
    result := make([]int, 0)
    
    for _, item := range items {
        if item > 0 {
            result = append(result, item)
        } else if includeNegatives && item < 0 {
            result = append(result, -item)
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
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      // for(1) + if(1) + if(1) + &&(1) + continue(1) + if(1) + if(1) = 7
      assert.ok(results[0].complexity >= 6, "Should have significant complexity");
    });
  });

  suite("Position Information", () => {
    test("should return correct line numbers", () => {
      const sourceCode = `package main

func First() {
}

func Second() {
    if true {
    }
}`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);
      // First function starts at line 2 (0-based)
      assert.strictEqual(results[0].startLine, 2);
      // Second function starts at line 5 (0-based)
      assert.strictEqual(results[1].startLine, 5);
    });

    test("should return correct complexity detail positions", () => {
      const sourceCode = `package main

func Test() {
    if true {
    }
}`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].details.length, 1);
      // The if statement is on line 3 (0-based)
      assert.strictEqual(results[0].details[0].line, 3);
    });
  });

  suite("Static Factory Method", () => {
    test("should analyze file using static method", () => {
      const sourceCode = `
package main

func Add(a, b int) int {
    if a < 0 || b < 0 {
        return 0
    }
    return a + b
}
`;

      const results = GoMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Add");
      // if(1) + ||(1) = 2
      assert.strictEqual(results[0].complexity, 2);
    });
  });

  suite("If-Else Chains", () => {
    test("should handle if-else chains", () => {
      const sourceCode = `
package main

func IfElseChain(value int) string {
    if value > 100 {
        return "large"
    } else if value > 50 {
        return "medium"
    } else if value > 0 {
        return "small"
    } else {
        return "zero or negative"
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // Each if statement adds complexity
      assert.ok(results[0].complexity >= 3, "Should count multiple if statements");
    });
  });

  suite("Defer Statements", () => {
    test("should not add complexity for simple defer", () => {
      const sourceCode = `
package main

func DeferTest() {
    defer close()
}

func close() {}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // defer itself doesn't add complexity
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should add complexity for deferred closure in nested context", () => {
      const sourceCode = `
package main

func DeferredClosure() {
    if true {
        defer func() {
            // cleanup
        }()
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      // if(1) + nested func_literal(1) = 2
      assert.strictEqual(results[0].complexity, 2);
    });
  });

  suite("Channel Operations", () => {
    test("should handle channel receive in select", () => {
      const sourceCode = `
package main

func ChannelReceive(ch1, ch2 chan int) int {
    select {
    case v := <-ch1:
        return v
    case v := <-ch2:
        return v
    }
}
`;

      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "select statement");
    });
  });
});
