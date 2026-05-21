import * as assert from "assert";
import { RustMetricsAnalyzer } from "../../../metricsAnalyzer/languages/rustAnalyzer";

suite("Rust Metrics Analyzer Tests", () => {
  let analyzer: RustMetricsAnalyzer;

  setup(() => {
    analyzer = new RustMetricsAnalyzer();
  });

  suite("Basic Function Analysis", () => {
    test("should analyze simple function with no complexity", () => {
      const sourceCode = `
fn add(a: i32, b: i32) -> i32 {
    a + b
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    test("should analyze function with if expression", () => {
      const sourceCode = `
fn max_val(a: i32, b: i32) -> i32 {
    if a > b { a } else { b }
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "max_val");
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "if expression");
    });

    test("should analyze multiple functions in same file", () => {
      const sourceCode = `
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn subtract(a: i32, b: i32) -> i32 {
    if a < b { 0 } else { a - b }
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].name, "add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[1].name, "subtract");
      assert.strictEqual(results[1].complexity, 1);
    });

    test("should handle empty source", () => {
      const results = analyzer.analyzeFunctions("");
      assert.strictEqual(results.length, 0);
    });

    test("should handle source with no functions", () => {
      const results = analyzer.analyzeFunctions("let x = 1;\n");
      assert.strictEqual(results.length, 0);
    });
  });

  suite("Control Flow Statements", () => {
    test("should handle for loop", () => {
      const sourceCode = `
fn iterate(items: &[i32]) {
    for item in items {
        println!("{}", item);
    }
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "for loop");
    });

    test("should handle while loop", () => {
      const sourceCode = `
fn countdown(mut n: i32) {
    while n > 0 {
        n -= 1;
    }
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "while loop");
    });

    test("should handle loop expression", () => {
      const sourceCode = `
fn spin() {
    loop {
        break;
    }
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "loop expression");
    });

    test("should handle match expression", () => {
      const sourceCode = `
fn classify(x: i32) -> &'static str {
    match x {
        0 => "zero",
        _ => "nonzero",
    }
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "match expression");
    });

    test("should handle nested control flow", () => {
      const sourceCode = `
fn process(items: &[i32]) {
    for item in items {
        if *item > 0 {
            println!("{}", item);
        }
    }
}
`;
      // for(1) + if(1 + 1 nesting) = 3
      const results = analyzer.analyzeFunctions(sourceCode);
      assert.strictEqual(results[0].complexity, 3);
    });

    test("should handle else if clause", () => {
      const sourceCode = `
fn sign(x: i32) -> i32 {
    if x > 0 {
        1
    } else if x < 0 {
        -1
    } else {
        0
    }
}
`;
      // if(1) + else if(1) = 2
      const results = analyzer.analyzeFunctions(sourceCode);
      assert.strictEqual(results[0].complexity, 2);
      const reasons = results[0].details.map((d) => d.reason);
      assert.ok(reasons.includes("if expression"));
      assert.ok(reasons.includes("else if clause"));
    });
  });

  suite("Boolean Operators", () => {
    test("should handle && operator", () => {
      const sourceCode = `
fn check(a: bool, b: bool) -> bool {
    a && b
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "binary && operator");
    });

    test("should handle || operator", () => {
      const sourceCode = `
fn check(a: bool, b: bool) -> bool {
    a || b
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "binary || operator");
    });

    test("should handle chained boolean operators", () => {
      const sourceCode = `
fn check(a: bool, b: bool, c: bool) -> bool {
    a && b || c
}
`;
      // &&(1) + ||(1) = 2
      const results = analyzer.analyzeFunctions(sourceCode);
      assert.strictEqual(results[0].complexity, 2);
    });
  });

  suite("Impl Methods", () => {
    test("should analyze impl method with qualified name", () => {
      const sourceCode = `
struct Counter { value: i32 }

impl Counter {
    fn increment(&mut self) {
        self.value += 1;
    }
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Counter::increment");
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should analyze impl method with complexity", () => {
      const sourceCode = `
struct Validator { max: i32 }

impl Validator {
    fn check(&self, value: i32) -> bool {
        if value > 0 && value <= self.max {
            true
        } else {
            false
        }
    }
}
`;
      // if(1) + &&(1) = 2
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results[0].name, "Validator::check");
      assert.ok(results[0].complexity >= 2);
    });

    test("should analyze multiple impl methods independently", () => {
      const sourceCode = `
struct Math;

impl Math {
    fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    fn max_val(a: i32, b: i32) -> i32 {
        if a > b { a } else { b }
    }
}
`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].name, "Math::add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[1].name, "Math::max_val");
      assert.strictEqual(results[1].complexity, 1);
    });
  });

  suite("Closures", () => {
    test("should not count top-level closure as extra complexity", () => {
      const sourceCode = `
fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
    move |x| x + n
}
`;
      // closure at nesting 0 → no increment
      const results = analyzer.analyzeFunctions(sourceCode);
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should count nested closure", () => {
      const sourceCode = `
fn process(items: &[i32]) -> i32 {
    if items.is_empty() {
        return 0;
    }
    items.iter().map(|x| x * 2).sum()
}
`;
      // if(1) + closure nested inside if context → complexity >= 1
      const results = analyzer.analyzeFunctions(sourceCode);
      assert.ok(results[0].complexity >= 1);
    });
  });

  suite("Position Information", () => {
    test("should return correct start line for function", () => {
      const sourceCode = `fn first() {}

fn second() {
    if true {}
}`;
      const results = analyzer.analyzeFunctions(sourceCode);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].startLine, 0);
      assert.strictEqual(results[1].startLine, 2);
    });
  });

  suite("Static Factory Method", () => {
    test("should analyze file using static method", () => {
      const sourceCode = `
fn check(a: i32, b: i32) -> bool {
    if a > 0 && b > 0 {
        true
    } else {
        false
    }
}
`;
      // if(1) + &&(1) = 2
      const results = RustMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "check");
      assert.ok(results[0].complexity >= 2);
    });
  });
});
