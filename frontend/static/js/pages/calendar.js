import { apiRequest, sortByUrgency } from "../modules/api.js";
import { createTaskCard } from "../modules/task-ui.js";

let currentDate = new Date();
let cachedTasks = [];
let selectedDate = null;

function getTaskDateParts(task) {
  const deadline = String(task.deadline || "");
  const isoPrefixMatch = deadline.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoPrefixMatch) {
    return {
      year: Number(isoPrefixMatch[1]),
      month: Number(isoPrefixMatch[2]) - 1,
      day: Number(isoPrefixMatch[3]),
    };
  }

  const date = new Date(task.deadline);
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

function selectedDateInCurrentMonth(year, month) {
  return selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === month;
}

function isUrgentTask(task) {
  const priority = String(task.priority || "").toLowerCase();
  return priority === "high" || priority === "critical" || priority === "overdue";
}

function collectTaskIndicatorsByDay(tasks, year, month) {
  const counts = {};
  tasks.forEach((task) => {
    const taskDate = getTaskDateParts(task);
    if (taskDate.year === year && taskDate.month === month) {
      const day = taskDate.day;
      if (!counts[day]) {
        counts[day] = { total: 0, urgent: 0, normal: 0 };
      }
      counts[day].total += 1;
      if (isUrgentTask(task)) {
        counts[day].urgent += 1;
      } else {
        counts[day].normal += 1;
      }
    }
  });
  return counts;
}

function buildTaskDots(info) {
  const MAX_DOTS = 4;
  const totalDots = Math.min(info.total, MAX_DOTS);
  const urgentDots = Math.min(info.urgent, totalDots);
  const normalDots = Math.max(0, totalDots - urgentDots);

  const dotsWrap = document.createElement("span");
  dotsWrap.className = "calendar-dots";
  dotsWrap.setAttribute("aria-hidden", "true");

  for (let i = 0; i < urgentDots; i += 1) {
    const dot = document.createElement("span");
    dot.className = "calendar-dot calendar-dot-urgent";
    dotsWrap.appendChild(dot);
  }

  for (let i = 0; i < normalDots; i += 1) {
    const dot = document.createElement("span");
    dot.className = "calendar-dot calendar-dot-normal";
    dotsWrap.appendChild(dot);
  }

  return dotsWrap;
}

function renderCalendarGrid(tasks) {
  const grid = document.getElementById("calendar-grid");
  const monthEl = document.getElementById("calendar-month");
  if (!grid || !monthEl) {
    return;
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const indicators = collectTaskIndicatorsByDay(tasks, year, month);

  if (!selectedDateInCurrentMonth(year, month)) {
    selectedDate = new Date(year, month, 1);
  }

  monthEl.textContent = firstDay.toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });

  grid.innerHTML = "";
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((label) => {
    const head = document.createElement("div");
    head.className = "calendar-head";
    head.textContent = label;
    grid.appendChild(head);
  });

  for (let i = 0; i < startOffset; i += 1) {
    const dayNumber = daysInPrevMonth - startOffset + i + 1;
    const leading = document.createElement("div");
    leading.className = "calendar-day out-month";
    leading.innerHTML = `<strong>${dayNumber}</strong>`;
    leading.setAttribute("aria-hidden", "true");
    grid.appendChild(leading);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-day";
    cell.setAttribute("aria-label", `View tasks for ${month + 1}/${day}/${year}`);
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      cell.classList.add("today");
    }
    if (
      selectedDate &&
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    ) {
      cell.classList.add("selected");
    }
    cell.innerHTML = `<strong>${day}</strong>`;

    const dayInfo = indicators[day];
    if (dayInfo && dayInfo.total > 0) {
      cell.appendChild(buildTaskDots(dayInfo));
      cell.setAttribute(
        "title",
        `${dayInfo.total} task${dayInfo.total > 1 ? "s" : ""} due (${dayInfo.urgent} urgent, ${dayInfo.normal} normal)`
      );
    }

    cell.addEventListener("click", () => {
      selectedDate = new Date(year, month, day);
      renderCalendarGrid(cachedTasks);
      renderSelectedDateTaskList(cachedTasks);
    });

    grid.appendChild(cell);
  }

  const cellsUsed = startOffset + daysInMonth;
  const trailingCount = (7 - (cellsUsed % 7)) % 7;
  for (let day = 1; day <= trailingCount; day += 1) {
    const trailing = document.createElement("div");
    trailing.className = "calendar-day out-month";
    trailing.innerHTML = `<strong>${day}</strong>`;
    trailing.setAttribute("aria-hidden", "true");
    grid.appendChild(trailing);
  }
}

function renderSelectedDateTaskList(tasks) {
  const list = document.getElementById("calendar-task-list");
  const heading = document.getElementById("calendar-task-list-title");
  if (!list) {
    return;
  }

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const day = selectedDate.getDate();

  const dayTasks = sortByUrgency(
    tasks.filter((task) => {
      const taskDate = getTaskDateParts(task);
      return taskDate.year === year && taskDate.month === month && taskDate.day === day;
    })
  );

  if (heading) {
    heading.textContent = `Tasks on ${selectedDate.toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  list.innerHTML = "";
  if (!dayTasks.length) {
    list.innerHTML = "<p class='subtle-text'>No tasks due on this date.</p>";
    return;
  }

  dayTasks.forEach((task) => list.appendChild(createTaskCard(task, { showActions: false })));
}

export async function initCalendarPage() {
  const root = document.getElementById("calendar-page-root");
  if (!root) {
    return;
  }

  const message = document.getElementById("calendar-message");
  const todayBtn = document.getElementById("calendar-today");
  const prev = document.getElementById("calendar-prev");
  const next = document.getElementById("calendar-next");

  const render = () => {
    renderCalendarGrid(cachedTasks);
    renderSelectedDateTaskList(cachedTasks);
  };

  todayBtn.addEventListener("click", () => {
    const now = new Date();
    currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
    selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    render();
  });

  prev.addEventListener("click", () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    render();
  });

  next.addEventListener("click", () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    render();
  });

  try {
    cachedTasks = await apiRequest("/tasks");
    render();
  } catch (error) {
    message.textContent = `Failed to load calendar: ${error.message}`;
  }
}
