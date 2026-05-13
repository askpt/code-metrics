/**
 * Sample JavaScript React (JSX) file to demonstrate cognitive complexity analysis.
 * Open this file in VS Code with the Code Metrics extension active to see CodeLens overlays.
 */

// Simple component - no complexity
function Welcome({ name }) {
  return <h1>Welcome, {name}!</h1>;
}

// Medium complexity - conditional rendering with logical operators
function Alert({ type, message, dismissible }) {
  if (!message || message.trim() === "") {
    return null;
  }

  if (type === "error" || type === "critical") {
    return (
      <div className="alert-error">
        <strong>Error:</strong> {message}
        {dismissible && <button>✕</button>}
      </div>
    );
  }

  return (
    <div className={`alert-${type}`}>
      {message}
      {dismissible && <button>✕</button>}
    </div>
  );
}

// Higher complexity - list rendering with filtering
function TodoList({ items, showCompleted }) {
  const visible = [];
  for (const item of items) {
    if (showCompleted || !item.done) {
      visible.push(item);
    }
  }

  if (visible.length === 0) {
    return <p>No items to show.</p>;
  }

  return (
    <ul>
      {visible.map((item) => (
        <li key={item.id} className={item.done ? "done" : ""}>
          {item.text}
        </li>
      ))}
    </ul>
  );
}

export { Welcome, Alert, TodoList };
