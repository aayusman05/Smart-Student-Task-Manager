import { apiRequest, isOverdue } from "../modules/api.js";
import { createTaskCard } from "../modules/task-ui.js";

function getEmptyState(iconType, text) {
  const icons = {
    calm: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12h18"></path>
        <path d="M6 8h12"></path>
        <path d="M8 16h8"></path>
      </svg>
    `,
    coffee: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z"></path>
        <path d="M17 10h1a2 2 0 1 1 0 4h-1"></path>
        <path d="M7 3v2"></path>
        <path d="M11 3v2"></path>
      </svg>
    `,
  };

  return `
    <span class="empty-state empty-state-block">
      <span class="empty-state-icon">${icons[iconType] || icons.calm}</span>
      <span>${text}</span>
    </span>
  `;
}

function getSubjectWorkloadEmptyState() {
  return `
    <div class="chart-empty-state" role="status" aria-live="polite">
      <span class="chart-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="16" rx="2"></rect>
          <path d="M7 16v-4"></path>
          <path d="M12 16V9"></path>
          <path d="M17 16v-7"></path>
        </svg>
      </span>
      <span>No subject data yet</span>
    </div>
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

function isWithinCurrentWeek(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  const day = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - day);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return date >= weekStart && date < weekEnd;
}

export async function initWeeklySummaryPage() {
  const root = document.getElementById("weekly-summary-root");
  if (!root) {
    return;
  }

  const message = document.getElementById("weekly-summary-message");
  const cards = document.getElementById("weekly-summary-cards");
  const taskList = document.getElementById("weekly-task-list");

  try {
    const tasks = await apiRequest("/tasks");
    const weeklyTasks = tasks.filter((task) => isWithinCurrentWeek(task.deadline));
    const completed = tasks.filter((task) => task.status === "completed").length;
    const pending = tasks.filter((task) => task.status === "pending").length;
    const missed = tasks.filter((task) => isOverdue(task)).length;
    const total = tasks.length;

    cards.innerHTML = "";
    [
      { label: "Pending Tasks", value: pending, icon: "pending" },
      { label: "Missed Tasks", value: missed, icon: "missed" },
      { label: "Completed Tasks", value: completed, icon: "completed" },
      { label: "Total Tasks", value: total, icon: "total" },
    ].forEach((item) => renderStatCard(cards, item));

    const subjectEntries = Object.entries(
      tasks.reduce((acc, task) => {
        const key = task.subject || "Uncategorized";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    );

    const subjectWorkload = document.getElementById("subject-workload");
    subjectWorkload.innerHTML = "";
    if (!subjectEntries.length) {
      subjectWorkload.innerHTML = getSubjectWorkloadEmptyState();
    } else {
      const maxCount = Math.max(...subjectEntries.map(([, count]) => count), 1);
      subjectEntries
        .sort((a, b) => b[1] - a[1])
        .forEach(([subject, count]) => {
          const percentage = Math.max(Math.round((count / maxCount) * 100), 8);
          const li = document.createElement("li");
          li.className = "subject-progress-row";
          li.innerHTML = `
            <div class="subject-progress-head">
              <span class="subject-progress-label">${subject}</span>
              <span class="subject-progress-value">${count} task${count === 1 ? "" : "s"}</span>
            </div>
            <div class="subject-progress-track" aria-hidden="true">
              <span class="subject-progress-fill" style="width: ${percentage}%;"></span>
            </div>
          `;
          subjectWorkload.appendChild(li);
        });
    }

    taskList.innerHTML = "";
    if (!weeklyTasks.length) {
      taskList.innerHTML = getEmptyState("coffee", "No tasks due this week.");
    } else {
      weeklyTasks
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .forEach((task) => taskList.appendChild(createTaskCard(task, { showActions: false })));
    }
  } catch (error) {
    message.textContent = `Failed to load summary: ${error.message}`;
  }
}
