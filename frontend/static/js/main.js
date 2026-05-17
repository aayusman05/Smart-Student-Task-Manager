import { initActiveSidebarLink, initLogout } from "./modules/session.js";
import { initAuthPages } from "./pages/auth.js";
import { initDashboardPage } from "./pages/dashboard.js";
import { initTaskFormPage } from "./pages/task-form.js";
import { initCalendarPage } from "./pages/calendar.js";
import { initWeeklySummaryPage } from "./pages/weekly-summary.js";
import { initMissedTasksPage } from "./pages/missed-tasks.js";
import { initSubjectsPage } from "./pages/subjects.js";

document.addEventListener("DOMContentLoaded", async () => {
  initActiveSidebarLink();
  initLogout();
  initAuthPages();
  await initDashboardPage();
  await initTaskFormPage();
  await initCalendarPage();
  await initWeeklySummaryPage();
  await initMissedTasksPage();
  await initSubjectsPage();
});
