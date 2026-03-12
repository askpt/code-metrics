/**
 * Sample JavaScript file to demonstrate cognitive complexity analysis.
 * Open this file in VS Code with the Code Metrics extension active to see CodeLens overlays.
 */

// Simple function - low complexity
function add(a, b) {
  return a + b;
}

// Medium complexity - if/else and logical operators
function validateAge(age) {
  if (age === null || age === undefined) {
    return false;
  } else if (age < 0 || age > 150) {
    return false;
  } else {
    return true;
  }
}

// Higher complexity - nested control flow
function processItems(items) {
  const results = [];

  for (const item of items) {
    if (item.active) {
      if (item.value > 100) {
        for (let i = 0; i < item.count; i++) {
          if (i % 2 === 0 && item.value > 50) {
            results.push(item.value * i);
          }
        }
      } else {
        results.push(item.value);
      }
    }
  }

  return results;
}

// Arrow function with ternary
const classify = (score) =>
  score >= 90 ? "A" :
  score >= 80 ? "B" :
  score >= 70 ? "C" : "F";

// Class with methods
class TaskManager {
  constructor(maxTasks) {
    this.tasks = [];
    this.maxTasks = maxTasks;
  }

  addTask(task) {
    if (!task || !task.name) {
      throw new Error("Invalid task");
    }

    if (this.tasks.length >= this.maxTasks) {
      return false;
    }

    this.tasks.push(task);
    return true;
  }

  findTask(name) {
    for (const task of this.tasks) {
      if (task.name === name) {
        return task;
      }
    }
    return null;
  }

  processAll() {
    let completed = 0;
    let failed = 0;

    for (const task of this.tasks) {
      try {
        if (task.priority === "high" && !task.done) {
          task.execute();
          completed++;
        } else if (task.priority === "low" || task.done) {
          // Skip low-priority or already done tasks
          continue;
        }
      } catch (e) {
        failed++;
        console.error(`Task ${task.name} failed:`, e);
      }
    }

    return { completed, failed };
  }
}
