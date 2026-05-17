import { apiRequest } from "../modules/api.js";

export async function initTaskFormPage() {
  const form = document.getElementById("task-form");
  const message = document.getElementById("task-form-message");
  if (!form || !message) {
    return;
  }

  const titleEl = document.getElementById("title");
  const descriptionEl = document.getElementById("description");
  const subjectEl = document.getElementById("subject");
  const typeEl = document.getElementById("task-type");
  const deadlineEl = document.getElementById("deadline");
  const statusEl = document.getElementById("status");
  const statusFieldEl = document.getElementById("status-field");
  const preview = document.getElementById("priority-preview");
  const titleBlock = document.getElementById("form-title");

  const autoWeights = {
    exam: 10,
    test: 9,
    assignment: 6,
    homework: 5,
    project: 7,
    lab_report: 6,
    presentation: 6,
    reading: 3,
    group_work: 7,
    extra_credit: 2,
  };

  const getAutoWeight = () => autoWeights[typeEl.value] || 5;

  const params = new URLSearchParams(window.location.search);
  const taskId = params.get("id");

  if (taskId) {
    titleBlock.textContent = "Edit Task";
    if (statusFieldEl) {
      statusFieldEl.hidden = false;
    }
    try {
      const tasks = await apiRequest("/tasks");
      const task = tasks.find((item) => String(item.id) === taskId);
      if (task) {
        titleEl.value = task.title || "";
        descriptionEl.value = task.description || "";
        subjectEl.value = task.subject || "";
        typeEl.value = task.task_type || "assignment";
        deadlineEl.value = task.deadline ? task.deadline.slice(0, 16) : "";
        statusEl.value = task.status || "pending";
      }
    } catch (error) {
      message.textContent = `Unable to load task: ${error.message}`;
    }
  } else {
    if (statusFieldEl) {
      statusFieldEl.hidden = true;
    }
    // Always start new tasks as pending to avoid stale browser-restored values.
    statusEl.value = "pending";
  }

  const updatePreview = () => {
    preview.textContent = deadlineEl.value
      ? `Priority will be recalculated automatically. Weight for this task type: ${getAutoWeight()}.`
      : `Priority is calculated automatically after saving. Weight for this task type: ${getAutoWeight()}.`;
  };

  deadlineEl.addEventListener("change", updatePreview);
  typeEl.addEventListener("change", updatePreview);
  updatePreview();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";

    if (!titleEl.value.trim()) {
      message.textContent = "Title is required.";
      return;
    }
    if (!deadlineEl.value) {
      message.textContent = "Deadline is required.";
      return;
    }

    const payload = {
      title: titleEl.value.trim(),
      description: descriptionEl.value.trim(),
      subject: subjectEl.value.trim(),
      task_type: typeEl.value,
      deadline: deadlineEl.value,
      status: taskId ? statusEl.value : "pending",
    };

    try {
      if (taskId) {
        await apiRequest(`/tasks/${taskId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        message.textContent = "Task updated. Redirecting...";
      } else {
        await apiRequest("/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        message.textContent = "Task created. Redirecting...";
      }
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 900);
    } catch (error) {
      message.textContent = `Failed to save task: ${error.message}`;
    }
  });
}
