import React from "react";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebaseConfig.js";

const DEFAULT_PRIMARY_COLOR = "#f97316";

function isValidHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(
    String(value || "").trim(),
  );
}

function getContrastColor(hexColor) {
  const normalizedColor = hexColor.replace(
    "#",
    "",
  );

  const red = parseInt(
    normalizedColor.slice(0, 2),
    16,
  );

  const green = parseInt(
    normalizedColor.slice(2, 4),
    16,
  );

  const blue = parseInt(
    normalizedColor.slice(4, 6),
    16,
  );

  /*
   * Calcula a luminosidade aproximada.
   */
  const luminance =
    red * 0.299 +
    green * 0.587 +
    blue * 0.114;

  return luminance > 165
    ? "#0f172a"
    : "#ffffff";
}

function applyBranding({
  primaryColor,
  theme,
}) {
  const root =
    document.documentElement;

  const normalizedColor =
    isValidHexColor(primaryColor)
      ? primaryColor
      : DEFAULT_PRIMARY_COLOR;

  const contrastColor =
    getContrastColor(
      normalizedColor,
    );

  root.style.setProperty(
    "--brand-primary",
    normalizedColor,
  );

  root.style.setProperty(
    "--primary",
    normalizedColor,
  );

  root.style.setProperty(
    "--brand-on-primary",
    contrastColor,
  );

  root.style.setProperty(
    "--primary-dark",
    `color-mix(
      in srgb,
      ${normalizedColor} 82%,
      black
    )`,
  );

  root.style.setProperty(
    "--primary-light",
    `color-mix(
      in srgb,
      ${normalizedColor} 12%,
      white
    )`,
  );

  root.style.setProperty(
    "--brand-border",
    `color-mix(
      in srgb,
      ${normalizedColor} 35%,
      white
    )`,
  );

  root.style.setProperty(
    "--brand-shadow",
    `color-mix(
      in srgb,
      ${normalizedColor} 28%,
      transparent
    )`,
  );

  root.dataset.establishmentTheme =
    theme === "dark"
      ? "dark"
      : "light";
}

function applyDefaultBranding() {
  applyBranding({
    primaryColor:
      DEFAULT_PRIMARY_COLOR,
    theme: "light",
  });
}

export function useEstablishmentBranding(
  establishmentId,
) {
  /*
   * A escuta acontece em tempo real.
   * Quando a cor for salva nas configurações,
   * a interface será atualizada automaticamente.
   */
  React.useEffect(() => {
    if (!establishmentId) {
      applyDefaultBranding();
      return undefined;
    }

    const settingsReference = doc(
      db,
      "establishments",
      establishmentId,
      "settings",
      "general",
    );

    const unsubscribe = onSnapshot(
      settingsReference,

      (snapshot) => {
        const settings =
          snapshot.exists()
            ? snapshot.data()
            : {};

        applyBranding({
          primaryColor:
            settings.corPrincipal ||
            DEFAULT_PRIMARY_COLOR,

          theme:
            settings.tema ||
            "light",
        });
      },

      (error) => {
        console.error(
          "Erro ao carregar identidade visual:",
          error,
        );

        applyDefaultBranding();
      },
    );

    return unsubscribe;
  }, [establishmentId]);
}