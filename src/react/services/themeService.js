export function normalizeTheme(theme) {
  return theme === "dark"
    ? "dark"
    : "light";
}

export function applyTheme(theme) {
  const normalizedTheme =
    normalizeTheme(theme);

  document.documentElement.setAttribute(
    "data-theme",
    normalizedTheme,
  );

  document.body.setAttribute(
    "data-theme",
    normalizedTheme,
  );

  return normalizedTheme;
}

export function getClientTheme(
  establishmentId,
) {
  if (!establishmentId) {
    return null;
  }

  const value =
    localStorage.getItem(
      `cardapionota10-theme-${establishmentId}`,
    );

  if (
    value !== "light" &&
    value !== "dark"
  ) {
    return null;
  }

  return value;
}

export function saveClientTheme(
  establishmentId,
  theme,
) {
  if (!establishmentId) {
    return;
  }

  const normalizedTheme =
    normalizeTheme(theme);

  localStorage.setItem(
    `cardapionota10-theme-${establishmentId}`,
    normalizedTheme,
  );

  applyTheme(normalizedTheme);
}

export function removeClientTheme(
  establishmentId,
) {
  if (!establishmentId) {
    return;
  }

  localStorage.removeItem(
    `cardapionota10-theme-${establishmentId}`,
  );
}