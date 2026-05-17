import { apiRequest, isOverdue, sortByUrgency } from "../modules/api.js";
import { createTaskCard } from "../modules/task-ui.js";

export async function initMissedTasksPage() {
  const root = document.getElementById("missed-page-root");
  if (!root) {
    return;
  }

  const message = document.getElementById("missed-message");
  const stats = document.getElementById("missed-stats");
  const list = document.getElementById("missed-list");

  const refresh = async () => {
    try {
      const tasks = await apiRequest("/tasks");
      const overdueTasks = sortByUrgency(tasks.filter((task) => isOverdue(task)));

      stats.innerHTML = "";
      [
        { label: "Overdue", value: overdueTasks.length },
        { label: "Recovered", value: tasks.filter((t) => t.status === "completed").length },
      ].forEach((item) => {
        const chip = document.createElement("article");
        chip.className = "stat-chip";
        chip.innerHTML = `<h3>${item.label}</h3><p>${item.value}</p>`;
        stats.appendChild(chip);
      });

      list.innerHTML = "";
      if (!overdueTasks.length) {
        list.innerHTML = "<p class='subtle-text'>No missed tasks right now.</p>";
      } else {
        overdueTasks.forEach((task) => list.appendChild(createTaskCard(task, { onChanged: refresh })));
      }
      message.textContent = "";
    } catch (error) {
      message.textContent = `Failed to load missed tasks: ${error.message}`;
    }
  };

  await refresh();
}
