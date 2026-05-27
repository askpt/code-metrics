import * as assert from "assert";
import { TsxMetricsAnalyzer } from "../../../metricsAnalyzer/languages/tsxAnalyzer";

suite("TSX Metrics Analyzer Tests", () => {
  suite("JSX Parsing Correctness", () => {
    test("should report zero complexity for simple JSX component", () => {
      const sourceCode = `
function Greeting({ name }: { name: string }) {
  return <span>Hello, {name}!</span>;
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Greeting");
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should not bleed complexity across functions separated by JSX", () => {
      // When the wrong grammar (typescript) is used, JSX errors corrupt the AST
      // so that subsequent functions appear nested inside the first one.
      const sourceCode = `
function Simple({ name }: { name: string }) {
  return <span>Hello, {name}!</span>;
}

function WithLogic(items: string[]) {
  for (const item of items) {
    if (item) {
      console.log(item);
    }
  }
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 2);

      const simple = results.find((r) => r.name === "Simple");
      if (!simple) { assert.fail("Simple function not found"); }
      assert.strictEqual(simple.complexity, 0, "Simple JSX component should have complexity 0");

      const withLogic = results.find((r) => r.name === "WithLogic");
      if (!withLogic) { assert.fail("WithLogic function not found"); }
      // for loop (1) + nested if at nesting=1 (2) = 3
      assert.strictEqual(withLogic.complexity, 3, "WithLogic should have complexity 3");
    });

    test("should handle multi-element JSX return", () => {
      const sourceCode = `
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>
        <h1>Title</h1>
      </header>
      <main>{children}</main>
      <footer>Footer</footer>
    </div>
  );
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Layout");
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should count conditional rendering with && correctly", () => {
      const sourceCode = `
function Badge({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div>
      {isAdmin && <span>Admin</span>}
    </div>
  );
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Badge");
      // The && is a real logical operator and counts as +1
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "logical && operator");
    });

    test("should count JSX event handler arrow functions as nested", () => {
      const sourceCode = `
function Button({ label }: { label: string }) {
  return <button onClick={() => console.log(label)}>{label}</button>;
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Button");
      // Inline arrow function in JSX prop: nested at nesting=0 → +1
      assert.strictEqual(results[0].complexity, 1);
    });

    test("should analyze TSX file with multiple components independently", () => {
      // Regression test: using the typescript (non-tsx) grammar causes JSX errors that
      // corrupt the AST, making all functions after the first appear nested inside it.
      const sourceCode = `
function Greeting({ name }: { name: string }) {
  return <span>Hello, {name}!</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return <span className="green">Active</span>;
  } else if (status === "pending") {
    return <span className="yellow">Pending</span>;
  } else {
    return <span className="red">Inactive</span>;
  }
}

function filterAndFormat(items: { id: number; label: string; visible: boolean }[]) {
  const result: string[] = [];
  for (const item of items) {
    if (!item.visible) {
      continue;
    }
    if (item.id > 0 && item.label.trim().length > 0) {
      result.push(item.label);
    } else if (item.id === 0) {
      result.push(item.label);
    }
  }
  return result;
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 3);

      const greeting = results.find((r) => r.name === "Greeting");
      if (!greeting) { assert.fail("Greeting function not found"); }
      assert.strictEqual(greeting.complexity, 0, "Greeting should be complexity 0");

      const badge = results.find((r) => r.name === "StatusBadge");
      if (!badge) { assert.fail("StatusBadge function not found"); }
      // if(1) + else-if(1) + else(1) = 3
      assert.strictEqual(badge.complexity, 3, "StatusBadge should be complexity 3");

      const filter = results.find((r) => r.name === "filterAndFormat");
      if (!filter) { assert.fail("filterAndFormat function not found"); }
      // for(1) + if(2) + if(2) + &&(1) + else-if(1) = 7
      assert.strictEqual(filter.complexity, 7, "filterAndFormat should be complexity 7");
    });
  });

  suite("TypeScript Features in TSX", () => {
    test("should handle TypeScript generics in JSX components", () => {
      const sourceCode = `
function List<T extends { id: number; label: string }>({ items }: { items: T[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.label}</li>
      ))}
    </ul>
  );
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "List");
    });

    test("should analyze async component with conditional rendering", () => {
      const sourceCode = `
async function DataView({ id }: { id: string }) {
  if (!id) {
    return <span>No data</span>;
  }
  return <div>{id}</div>;
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "DataView");
      assert.strictEqual(results[0].complexity, 1);
      assert.strictEqual(results[0].details[0].reason, "if statement");
    });

    test("should handle ternary operator in JSX expression", () => {
      const sourceCode = `
function Status({ active }: { active: boolean }) {
  return (
    <span>{active ? "Active" : "Inactive"}</span>
  );
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Status");
      assert.strictEqual(results[0].complexity, 1);
    });

    test("should handle arrow function component with hook", () => {
      const sourceCode = `
const Counter = () => {
  const [count, setCount] = React.useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
};
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Counter");
      // inline arrow in onClick: +1 for nested function
      assert.strictEqual(results[0].complexity, 1);
    });
  });

  suite("Edge Cases", () => {
    test("should return empty array for empty source", () => {
      const results = TsxMetricsAnalyzer.analyzeFile("");
      assert.strictEqual(results.length, 0);
    });

    test("should handle JSX-only file with no logic", () => {
      const sourceCode = `
function Pure() {
  return <div><p>Hello</p></div>;
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].complexity, 0);
    });

    test("should correctly count nested conditionals in TSX", () => {
      const sourceCode = `
function Widget({ show, count }: { show: boolean; count: number }) {
  if (show) {
    if (count > 0) {
      return <span>{count}</span>;
    }
  }
  return null;
}
`;
      const results = TsxMetricsAnalyzer.analyzeFile(sourceCode);

      assert.strictEqual(results.length, 1);
      // outer if: +1, inner if at nesting=1: +2 → total 3
      assert.strictEqual(results[0].complexity, 3);
    });
  });
});
