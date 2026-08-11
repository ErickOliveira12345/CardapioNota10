import React from "react";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebaseConfig.js";

const DEFAULT_PRIMARY_COLOR =
  "#f97316";

const DEFAULT_BRANDING = {
  nome: "Estabelecimento",
  nomeExibicao: "Estabelecimento",
  logoUrl: "",
  logoPath: "",
  corPrincipal:
    DEFAULT_PRIMARY_COLOR,
  tema: "light",
};

function isValidHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(
    String(value || "").trim(),
  );
}

function getContrastColor(
  hexColor,
) {
  const normalizedColor =
    hexColor.replace(
      "#",
      "",
    );

  const red =
    parseInt(
      normalizedColor.slice(
        0,
        2,
      ),
      16,
    );

  const green =
    parseInt(
      normalizedColor.slice(
        2,
        4,
      ),
      16,
    );

  const blue =
    parseInt(
      normalizedColor.slice(
        4,
        6,
      ),
      16,
    );

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
    isValidHexColor(
      primaryColor,
    )
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

    theme:
      "light",
  });
}

export function useEstablishmentBranding(
  establishmentId,
) {
  const [
    branding,
    setBranding,
  ] = React.useState(
    DEFAULT_BRANDING,
  );

  const [
    loading,
    setLoading,
  ] = React.useState(true);

  React.useEffect(() => {
    if (!establishmentId) {
      setBranding(
        DEFAULT_BRANDING,
      );

      applyDefaultBranding();

      setLoading(false);

      return undefined;
    }

    setLoading(true);

    /*
     * Dados principais do
     * estabelecimento.
     */
    let establishmentData = {};

    /*
     * Configurações visuais.
     */
    let settingsData = {};

    let establishmentLoaded =
      false;

    let settingsLoaded =
      false;

    function updateBranding() {
  if (
    !establishmentLoaded ||
    !settingsLoaded
  ) {
    return;
  }

  const primaryColor =
    settingsData
      .corPrincipal ||
    DEFAULT_PRIMARY_COLOR;

  const theme =
    settingsData.tema ||
    "light";

  const nextBranding = {
    nome:
      establishmentData.nome ||
      "Estabelecimento",

    nomeExibicao:
      settingsData.nomeExibicao ||
      establishmentData.nome ||
      "Estabelecimento",

    logoUrl:
      settingsData.logoUrl ||
      establishmentData.logoUrl ||
      "",

    logoPath:
      settingsData.logoPath ||
      establishmentData.logoPath ||
      "",

    corPrincipal:
      primaryColor,

    tema:
      theme,
  };

  console.log(
    "BRANDING APLICADO:",
    {
      establishmentId,

      establishmentData,

      settingsData,

      nextBranding,
    },
  );

  setBranding(
    nextBranding,
  );

  applyBranding({
    primaryColor,
    theme,
  });

  console.log(
    "CSS BRANDING:",
    {
      primary:
        getComputedStyle(
          document.documentElement,
        ).getPropertyValue(
          "--primary",
        ),

      brandPrimary:
        getComputedStyle(
          document.documentElement,
        ).getPropertyValue(
          "--brand-primary",
        ),
    },
  );

  setLoading(false);
}

    /*
     * establishments/{id}
     */
    const establishmentReference =
      doc(
        db,
        "establishments",
        establishmentId,
      );

    /*
     * establishments/{id}
     * /settings/general
     */
    const settingsReference =
      doc(
        db,
        "establishments",
        establishmentId,
        "settings",
        "general",
      );

    const stopEstablishment =
      onSnapshot(
        establishmentReference,

        (snapshot) => {
          establishmentData =
            snapshot.exists()
              ? snapshot.data()
              : {};

          establishmentLoaded =
            true;

          updateBranding();
        },

        (error) => {
          console.error(
            "Erro ao carregar estabelecimento:",
            error,
          );

          establishmentData = {};

          establishmentLoaded =
            true;

          updateBranding();
        },
      );

    const stopSettings =
  onSnapshot(
    settingsReference,

    (snapshot) => {
      const settings =
        snapshot.exists()
          ? snapshot.data()
          : {};

      console.log(
        "BRANDING FIRESTORE:",
        {
          establishmentId,

          exists:
            snapshot.exists(),

          settings,
        },
      );

      settingsData =
        settings;

      settingsLoaded =
        true;

      updateBranding();
    },

    (error) => {
      console.error(
        "Erro ao carregar identidade visual:",
        error,
      );

      settingsData = {};

      settingsLoaded =
        true;

      updateBranding();
    },
  );
    return () => {
      stopEstablishment();
      stopSettings();
    };
  }, [
    establishmentId,
  ]);

  return {
    branding,
    loading,
  };
}