/**
 * Sample TypeScript React (TSX) file to demonstrate cognitive complexity analysis.
 * Open this file in VS Code with the Code Metrics extension active to see CodeLens overlays.
 */

import React from "react";

// Simple component - no complexity
function Greeting({ name }: { name: string }) {
  return <span>Hello, {name}!</span>;
}

// Medium complexity - conditional rendering
function StatusBadge({
  status,
  count,
}: {
  status: "active" | "inactive" | "pending";
  count: number;
}) {
  if (status === "active") {
    return <span className="badge-green">Active ({count})</span>;
  } else if (status === "pending") {
    return <span className="badge-yellow">Pending</span>;
  } else {
    return <span className="badge-red">Inactive</span>;
  }
}

// Higher complexity - logic with loops and conditions
function filterAndFormat(
  items: { id: number; label: string; visible: boolean }[]
): string[] {
  const result: string[] = [];
  for (const item of items) {
    if (!item.visible) {
      continue;
    }
    if (item.id > 0 && item.label.trim().length > 0) {
      result.push(`[${item.id}] ${item.label}`);
    } else if (item.id === 0) {
      result.push(item.label);
    }
  }
  return result;
}

// Higher complexity - nested conditions and early returns
function resolveRoute(
  path: string,
  isAuthenticated: boolean,
  roles: string[]
): string {
  if (!path || path.trim() === "") {
    return "/";
  }
  if (!isAuthenticated) {
    if (path.startsWith("/public")) {
      return path;
    }
    return "/login";
  }
  for (const role of roles) {
    if (role === "admin" && path.startsWith("/admin")) {
      return path;
    }
    if (role === "user" && !path.startsWith("/admin")) {
      return path;
    }
  }
  return "/forbidden";
}

export { Greeting, StatusBadge, filterAndFormat, resolveRoute };
