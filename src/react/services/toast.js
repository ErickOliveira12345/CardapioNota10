export function showToast(message, type = "info", duration = 3500) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const icons = {
    success: "✓",
    error: "×",
    warning: "!",
    info: "i",
  };

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] || icons.info}</span>
    <span class="toast__message">${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast--visible"));

  window.setTimeout(() => {
    toast.classList.remove("toast--visible");
    window.setTimeout(() => toast.remove(), 350);
  }, duration);
}
