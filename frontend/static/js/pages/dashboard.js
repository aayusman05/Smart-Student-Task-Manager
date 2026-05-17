import { apiRequest, formatDate, isDueSoon, isOverdue, sortByUrgency } from "../modules/api.js";
import { createTaskCard } from "../modules/task-ui.js";

function getEmptyStateIcon(type) {
  const icons = {
    urgent: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12h15"></path>
        <path d="M13 8h4a2 2 0 0 1 0 4h-1"></path>
        <path d="M6 8v8"></path>
        <path d="M7 8h2"></path>
      </svg>
    `,
    missed: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"></path>
        <path d="M4 13h16"></path>
        <path d="M8 13l-2-6"></path>
        <path d="M16 13l2-6"></path>
        <path d="M12 3v5"></path>
      </svg>
    `,
  };

  return icons[type] ?? icons.urgent;
}

function renderEmptyState(text, type) {
  return `
    <p class="empty-state">
      <span class="empty-state-icon">${getEmptyStateIcon(type)}</span>
      <span>${text}</span>
    </p>
  `;
}

function getStatIcon(type) {
  const icons = {
    pending: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8"></circle>
        <path d="M12 8v4l3 2"></path>
      </svg>
    `,
    missed: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 9v4"></path>
        <path d="M12 17h.01"></path>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h18.94a2 2 0 0 0 1.71-3L15.71 3.86a2 2 0 0 0-3.42 0Z"></path>
      </svg>
    `,
    completed: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6 9 17l-5-5"></path>
      </svg>
    `,
    total: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2"></rect>
        <path d="M8 8h8"></path>
        <path d="M8 12h8"></path>
        <path d="M8 16h5"></path>
      </svg>
    `,
  };

  return icons[type] ?? icons.total;
}

function renderStatCard(container, { label, value, icon }) {
  const chip = document.createElement("article");
  chip.className = "stat-chip";
  chip.innerHTML = `
    <h3><span class="stat-icon">${getStatIcon(icon)}</span><span>${label}</span></h3>
    <p>${value}</p>
  `;
  container.appendChild(chip);
}

function renderStats(container, tasks) {
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const missed = tasks.filter((t) => isOverdue(t)).length;

  container.innerHTML = "";
  [
    { label: "Pending", value: pending, icon: "pending" },
    { label: "Missed", value: missed, icon: "missed" },
    { label: "Completed", value: completed, icon: "completed" },
    { label: "Total", value: tasks.length, icon: "total" },
  ].forEach((item) => renderStatCard(container, item));
}

export async function initDashboardPage() {
  const root = document.getElementById("dashboard-root");
  if (!root) {
    return;
  }

  const message = document.getElementById("dashboard-message");
  const stats = document.getElementById("summary-stats");
  const tasksList = document.getElementById("tasks-list");
  const urgentList = document.getElementById("urgent-list");
  const overdueList = document.getElementById("overdue-list");
  const completedList = document.getElementById("completed-list");
  const banner = document.getElementById("reminder-banner");

  const refresh = async () => {
    try {
      const [tasks, reminders] = await Promise.all([
        apiRequest("/tasks"),
        apiRequest("/reminders"),
      ]);

      const pending = tasks.filter((task) => task.status === "pending");
      const completed = tasks.filter((task) => task.status === "completed");
      const sorted = sortByUrgency(pending);
      const urgent = sorted.filter((task) => isDueSoon(task));
      const overdue = sorted.filter((task) => isOverdue(task));

      renderStats(stats, tasks);

      tasksList.innerHTML = "";
      if (!sorted.length) {
        tasksList.innerHTML = "<p class='subtle-text'>No tasks yet. Add your first task.</p>";
      } else {
        sorted.forEach((task) => tasksList.appendChild(createTaskCard(task, { onChanged: refresh })));
      }

      urgentList.innerHTML = "";
      if (!urgent.length) {
        urgentList.innerHTML = renderEmptyState("No urgent tasks right now.", "urgent");
      } else {
        urgent.forEach((task) => urgentList.appendChild(createTaskCard(task, { onChanged: refresh })));
      }

      overdueList.innerHTML = "";
      if (!overdue.length) {
        overdueList.innerHTML = renderEmptyState("No missed deadlines. Nice work.", "missed");
      } else {
        overdue.forEach((task) => overdueList.appendChild(createTaskCard(task, { onChanged: refresh })));
      }

      completedList.innerHTML = "";
      if (!completed.length) {
        completedList.innerHTML = "<p class='subtle-text'>No completed tasks yet. Keep working!</p>";
      } else {
        completed.forEach((task) => completedList.appendChild(createTaskCard(task, { onChanged: refresh })));
      }

      message.textContent = "";
    } catch (error) {
      message.textContent = `Failed to load dashboard: ${error.message}`;
    }
  };

  await refresh();
}
