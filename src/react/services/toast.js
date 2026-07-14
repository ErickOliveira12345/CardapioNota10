let toastCounter = 0;

export function showToast(
  message,
  type = "info",
  duration = 3500,
) {
  const container = document.getElementById(
    "toast-container",
  );

  if (!container) return;

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  /*
   * Evita criar dois toasts iguais
   * ao mesmo tempo.
   */
  const duplicatedToast = Array.from(
    container.children,
  ).find(
    (element) =>
      element.dataset.message === message &&
      element.dataset.type === type,
  );

  if (duplicatedToast) {
    return;
  }

  const toast = document.createElement("div");

  toastCounter += 1;

  toast.className = `toast toast--${type}`;

  toast.dataset.id = String(toastCounter);
  toast.dataset.message = message;
  toast.dataset.type = type;

  toast.innerHTML = `
    <div class="toast__content">
        <span class="toast__icon">
            ${icons[type] || icons.info}
        </span>

        <span class="toast__message">
            ${message}
        </span>
    </div>

    <button
        class="toast__close"
        aria-label="Fechar"
    >
        ×
    </button>
  `;

  const removeToast = () => {
    toast.classList.remove(
      "toast--visible",
    );

    window.setTimeout(() => {
      toast.remove();
    }, 300);
  };

  toast
    .querySelector(".toast__close")
    ?.addEventListener(
      "click",
      removeToast,
    );

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add(
      "toast--visible",
    );
  });

  window.setTimeout(
    removeToast,
    duration,
  );
}