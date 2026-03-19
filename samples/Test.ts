/**
 * Sample TypeScript file to demonstrate cognitive complexity analysis.
 * Open this file in VS Code with the Code Metrics extension active to see CodeLens overlays.
 */

// Simple function - low complexity
function add(a: number, b: number): number {
  return a + b;
}

// Interface and type definitions do not contribute to complexity
interface Task {
  name: string;
  priority: "high" | "medium" | "low";
  done: boolean;
  value: number;
}

// Medium complexity - typed function with conditionals
function validateTask(task: Task | null | undefined): boolean {
  if (!task) {
    return false;
  }

  if (!task.name || task.name.trim().length === 0) {
    return false;
  }

  return task.value >= 0 && task.priority !== undefined;
}

// Higher complexity - nested loops and conditions
function processItems(items: Task[]): number[] {
  const results: number[] = [];

  for (const item of items) {
    if (item.done) {
      continue;
    }

    if (item.priority === "high") {
      for (let i = 0; i < item.value; i++) {
        if (i % 3 === 0 || item.value > 100) {
          results.push(i * item.value);
        }
      }
    } else if (item.priority === "medium") {
      results.push(item.value);
    } else {
      results.push(0);
    }
  }

  return results;
}

// Generic function - type parameters don't add complexity
function findFirst<T>(items: T[], predicate: (item: T) => boolean): T | undefined {
  for (const item of items) {
    if (predicate(item)) {
      return item;
    }
  }
  return undefined;
}

// Class with typed methods
class TaskManager {
  private tasks: Task[] = [];
  private maxTasks: number;

  constructor(maxTasks: number) {
    this.maxTasks = maxTasks;
  }

  addTask(task: Task): boolean {
    if (!validateTask(task)) {
      return false;
    }

    if (this.tasks.length >= this.maxTasks) {
      return false;
    }

    this.tasks.push(task);
    return true;
  }

  getByPriority(priority: Task["priority"]): Task[] {
    return this.tasks.filter(
      (task) => task.priority === priority && !task.done
    );
  }

  processAll(): { completed: number; skipped: number; failed: number } {
    let completed = 0;
    let skipped = 0;
    let failed = 0;

    for (const task of this.tasks) {
      try {
        if (task.done) {
          skipped++;
          continue;
        }

        if (task.priority === "high" || (task.priority === "medium" && task.value > 50)) {
          // Process important tasks
          completed++;
        } else {
          skipped++;
        }
      } catch (e) {
        failed++;
        console.error(`Task ${task.name} failed:`, e);
      }
    }

    return { completed, skipped, failed };
  }
}
