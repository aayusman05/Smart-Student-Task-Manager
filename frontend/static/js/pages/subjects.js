import { apiRequest, sortByUrgency } from "../modules/api.js";
import { createTaskCard } from "../modules/task-ui.js";

function normalizeSubject(subject) {
  const value = (subject || "").trim();
  return value || "Uncategorized";
}

function groupTasksBySubject(tasks) {
  return tasks.reduce((acc, task) => {
    const subject = normalizeSubject(task.subject);
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(task);
    return acc;
  }, {});
}

export async function initSubjectsPage() {
  const root = document.getElementById("subjects-root");
  if (!root) {
    return;
  }

  const groupsContainer = document.getElementById("subjects-groups");
  const message = document.getElementById("subjects-message");

  try {
    const tasks = await apiRequest("/tasks");
    const groups = groupTasksBySubject(tasks);
    const subjects = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    groupsContainer.innerHTML = "";

    if (!subjects.length) {
      groupsContainer.innerHTML = "<p class='subtle-text'>No tasks available yet.</p>";
      return;
    }

    subjects.forEach((subject) => {
      const section = document.createElement("section");
      section.className = "card-surface";

      const heading = document.createElement("h2");
      heading.textContent = `${subject} (${groups[subject].length})`;
      section.appendChild(heading);

      const list = document.createElement("div");
      list.className = "task-list";

      sortByUrgency(groups[subject]).forEach((task) => {
        list.appendChild(createTaskCard(task, { showActions: true, onChanged: initSubjectsPage }));
      });

      section.appendChild(list);
      groupsContainer.appendChild(section);
    });
  } catch (error) {
    message.textContent = `Failed to load subjects: ${error.message}`;
  }
}
