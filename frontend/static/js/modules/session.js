import { apiRequest } from "./api.js";

export function initLogout() {
  const logoutButtons = document.querySelectorAll(".logout-button");
  if (!logoutButtons.length) {
    return;
  }

  logoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await apiRequest("/logout", { method: "POST" });
      } catch (_error) {
        // Safe to ignore if server session already expired.
      }
      localStorage.removeItem("studentTaskUser");
      window.location.href = "/login";
    });
  });
}

export function initActiveSidebarLink() {
  const links = document.querySelectorAll(".sidebar-nav a");
  if (!links.length) {
    return;
  }

  const currentPath = window.location.pathname;
  links.forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });
}
