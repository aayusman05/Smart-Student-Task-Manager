import { apiRequest } from "../modules/api.js";

export function initAuthPages() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const message = document.getElementById("auth-message");

  if (registerForm && message) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.textContent = "";

      const username = document.getElementById("register-username").value.trim();
      const email = document.getElementById("register-email").value.trim();
      const password = document.getElementById("register-password").value;
      const confirmPassword = document.getElementById("register-confirm-password").value;

      if (username.length < 3) {
        message.textContent = "Username must be at least 3 characters.";
        return;
      }
      if (!email.includes("@")) {
        message.textContent = "Please enter a valid email.";
        return;
      }
      if (password.length < 6) {
        message.textContent = "Password must be at least 6 characters.";
        return;
      }
      if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        return;
      }

      try {
        await apiRequest("/register", {
          method: "POST",
          body: JSON.stringify({ username, email, password }),
        });
        message.textContent = "Signup successful. Redirecting to login...";
        setTimeout(() => {
          window.location.href = "/login";
        }, 900);
      } catch (error) {
        message.textContent = `Signup failed: ${error.message}`;
      }
    });
  }

  if (loginForm && message) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.textContent = "";

      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value;
      if (username.length < 3 || password.length < 6) {
        message.textContent = "Enter a valid username and password.";
        return;
      }

      try {
        const result = await apiRequest("/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        localStorage.setItem("studentTaskUser", JSON.stringify({ username, userId: result.user_id }));
        window.location.href = "/dashboard";
      } catch (error) {
        message.textContent = `Login failed: ${error.message}`;
      }
    });
  }
}
