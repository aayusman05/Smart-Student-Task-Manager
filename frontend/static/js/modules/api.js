export const PRIORITY_ORDER = {
  critical: 0,
  overdue: 1,
  high: 2,
  medium: 3,
  low: 4,
};

export async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = (payload && payload.error) || response.statusText || "Request failed";
    throw new Error(message);
  }

  return payload;
}

export function formatDate(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isOverdue(task) {
  return task.status === "pending" && new Date(task.deadline) < new Date();
}

export function isDueSoon(task, hours = 24) {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const diff = deadline.getTime() - now.getTime();
  return task.status === "pending" && diff >= 0 && diff <= hours * 60 * 60 * 1000;
}

export function sortByUrgency(tasks) {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 999;
    const pb = PRIORITY_ORDER[b.priority] ?? 999;
    if (pa !== pb) {
      return pa - pb;
    }
    return new Date(a.deadline) - new Date(b.deadline);
  });
}
