import { apiRequest, formatDate, isDueSoon, isOverdue } from "./api.js";

export function createTaskCard(task, { showActions = true, onChanged = null } = {}) {
  const isCompleted = task.status === "completed";
  const overdue = isOverdue(task);
  const priorityValue = task.priority || "medium";
  const visualPriorityValue = isCompleted ? "low" : priorityValue;
  const priorityClass = `priority-${visualPriorityValue}`;
  const statusClass = isCompleted
    ? "status-completed"
    : overdue
      ? "status-overdue"
      : `status-${task.status || "pending"}`;
  const statusText = isCompleted ? "completed" : overdue ? "overdue" : (task.status || "pending");
  const taskTypeText = task.task_type || "assignment";
  const showPriorityPill = !isCompleted;
  const showStatusPill = statusText !== visualPriorityValue;
  const priorityPillMarkup = showPriorityPill
    ? `<span class="priority-pill priority-${visualPriorityValue}">${visualPriorityValue}</span>`
    : "";
  const statusPillMarkup = showStatusPill
    ? `<span class="status-pill ${statusClass}">${statusText}</span>`
    : "";

  const card = document.createElement("article");
  card.className = `task-card ${priorityClass}`;
  if (isDueSoon(task) || overdue) {
    card.classList.add("urgent-task");
  }

  card.innerHTML = `
    <h3>${task.title}</h3>
    <div class="task-meta">
      <span class="meta-pill">${task.subject || "No Subject"}</span>
      <span class="meta-pill type-pill">${taskTypeText}</span>
      <span class="meta-pill">${formatDate(task.deadline)}</span>
      ${priorityPillMarkup}
      ${statusPillMarkup}
    </div>
    <p>${task.description || "No description provided."}</p>
    <p class="subtle-text">${task.recommendation || ""}</p>
  `;

  if (!showActions) {
    return card;
  }

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const completeBtn = document.createElement("button");
  completeBtn.className = "ghost-btn";
  completeBtn.textContent = task.status === "completed" ? "Mark Pending" : "Mark Completed";
  completeBtn.addEventListener("click", async () => {
    const status = task.status === "completed" ? "pending" : "completed";
    await apiRequest(`/tasks/${task.id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (onChanged) {
      await onChanged();
    }
  });

  const editBtn = document.createElement("button");
  editBtn.className = "ghost-btn";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => {
    window.location.href = `/task-form?id=${task.id}`;
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "ghost-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", async () => {
    if (!window.confirm("Delete this task?")) {
      return;
    }
    await apiRequest(`/tasks/${task.id}`, { method: "DELETE" });
    if (onChanged) {
      await onChanged();
    }
  });

  actions.append(completeBtn, editBtn, deleteBtn);
  card.appendChild(actions);
  return card;
}

export function renderSimpleList(container, items, formatter) {
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = "<li>No data available.</li>";
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = formatter(item);
    container.appendChild(li);
  });
}
