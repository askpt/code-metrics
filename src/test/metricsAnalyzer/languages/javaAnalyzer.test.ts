import * as assert from "assert";
import { JavaMetricsAnalyzer } from "../../../metricsAnalyzer/languages/javaAnalyzer";

suite("Java Metrics Analyzer Tests", () => {
  suite("Basic Method Analysis", () => {
    test("should analyze simple method with no complexity", () => {
      const source = `
public class Test {
  public int add(int a, int b) {
    return a + b;
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Test.add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[0].details.length, 0);
    });

    test("should analyze method with if statement", () => {
      const source = `
public class Test {
  public int max(int a, int b) {
    if (a > b) {
      return a;
    }
    return b;
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "if statement");
      assert.strictEqual(results[0].details[0].increment, 1);
    });

    test("should count if/else with else as flat increment", () => {
      const source = `
public class Test {
  public int max(int a, int b) {
    if (a > b) {
      return a;
    } else {
      return b;
    }
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 2);
      assert.strictEqual(results[0].details.length, 2);
      assert.strictEqual(results[0].details[0].reason, "if statement");
      assert.strictEqual(results[0].details[0].increment, 1);
      assert.strictEqual(results[0].details[1].reason, "else clause");
      assert.strictEqual(results[0].details[1].increment, 1);
    });

    test("should count else-if chain without nesting penalty", () => {
      const source = `
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
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results.length, 1);
      // if(1) + else-if(1) + else(1)
      assert.strictEqual(results[0].complexity, 3);
      assert.deepStrictEqual(
        results[0].details.map((detail) => detail.reason),
        ["if statement", "else if clause", "else clause"]
      );
      assert.deepStrictEqual(
        results[0].details.map((detail) => detail.increment),
        [1, 1, 1]
      );
    });

    test("should analyze constructor", () => {
      const source = `
public class Test {
  private int value;
  public Test(int v) {
    this.value = v;
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Test.Test");
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should analyze multiple methods", () => {
      const source = `
public class MathUtils {
  public int add(int a, int b) { return a + b; }
  public int max(int a, int b) {
    if (a > b) return a;
    return b;
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].name, "MathUtils.add");
      assert.strictEqual(results[0].complexity, 0);
      assert.strictEqual(results[1].name, "MathUtils.max");
      assert.strictEqual(results[1].complexity, 1);
    });
  });

  suite("Control Flow Complexity", () => {
    test("should count nested control flow with nesting increments", () => {
      const source = `
public class Test {
  public void process(int x) {
    if (x > 0) {
      for (int i = 0; i < x; i++) {
        if (i % 2 == 0) {
        }
      }
    }
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results.length, 1);
      // if(1+0) + for(1+1) + if(1+2) = 1 + 2 + 3 = 6
      assert.strictEqual(results[0].complexity, 6);
    });

    test("should count while loop", () => {
      const source = `
public class Test {
  public void loop(int n) {
    while (n > 0) {
      n--;
    }
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "while loop");
    });

    test("should count enhanced for loop", () => {
      const source = `
import java.util.List;
public class Test {
  public void iterate(List<String> items) {
    for (String item : items) {
      System.out.println(item);
    }
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "enhanced for loop");
    });

    test("should count do-while loop", () => {
      const source = `
public class Test {
  public void loop(int n) {
    do {
      n--;
    } while (n > 0);
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "do-while loop");
    });

    test("should count switch statement", () => {
      const source = `
public class Test {
  public String describe(int n) {
    switch (n) {
      case 1: return "one";
      case 2: return "two";
      default: return "other";
    }
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "switch statement");
    });

    test("should count catch clause", () => {
      const source = `
public class Test {
  public void parse(String s) {
    try {
      Integer.parseInt(s);
    } catch (NumberFormatException e) {
      System.out.println("bad");
    }
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "catch clause");
    });

    test("should count multiple catch clauses", () => {
      const source = `
public class Test {
  public void read(String path) {
    try {
      // read
    } catch (java.io.IOException e) {
      // io error
    } catch (RuntimeException e) {
      // runtime error
    }
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results[0].complexity, 2);
    });
  });

  suite("Logical Operators", () => {
    test("should count && operator", () => {
      const source = `
public class Test {
  public boolean check(int x) {
    return x > 0 && x < 10;
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "binary && operator");
    });

    test("should count || operator", () => {
      const source = `
public class Test {
  public boolean check(int x) {
    return x < 0 || x > 100;
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "binary || operator");
    });

    test("should count mixed logical operators", () => {
      const source = `
public class Test {
  public boolean check(int x, int y) {
    return (x > 0 && x < 10) || (y > 0 && y < 10);
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      // One || at outer level, two && inside
      assert.strictEqual(results[0].complexity, 3);
    });
  });

  suite("Ternary and Lambda", () => {
    test("should count ternary expression", () => {
      const source = `
public class Test {
  public String sign(int x) {
    return x > 0 ? "positive" : "non-positive";
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "ternary expression");
    });

    test("should count lambda expression", () => {
      const source = `
import java.util.List;
import java.util.function.Predicate;
public class Test {
  public void filter(List<Integer> list) {
    Predicate<Integer> isPositive = x -> x > 0;
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "lambda expression");
    });

    test("should count nested lambda with nesting", () => {
      const source = `
import java.util.List;
public class Test {
  public void process(List<Integer> list) {
    if (list != null) {
      list.forEach(x -> System.out.println(x));
    }
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      // if(1+0) + lambda(1+1) = 1 + 2 = 3
      assert.strictEqual(results[0].complexity, 3);
    });
  });

  suite("Position Information", () => {
    test("should report correct start and end lines", () => {
      const source = `public class Test {
  public int foo() {
    return 0;
  }
}`;
      const results = JavaMetricsAnalyzer.analyzeFile(source);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].startLine, 1); // 0-based
      assert.strictEqual(results[0].endLine, 3);
    });
  });
});
