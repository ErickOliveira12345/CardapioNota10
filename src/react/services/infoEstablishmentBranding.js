import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebaseConfig.js";

const DEFAULT_BRANDING = {
  nome: "Estabelecimento",
  nomeExibicao: "Estabelecimento",
  logoUrl: "",
  logoPath: "",
  corPrincipal: "#f97316",
  tema: "light",
};

export function observeEstablishmentBranding(
  establishmentId,
  onChange,
  onError,
) {
  if (!establishmentId) {
    onChange?.(DEFAULT_BRANDING);
    return () => {};
  }

  let establishmentData = {};
  let settingsData = {};

  let establishmentLoaded = false;
  let settingsLoaded = false;

  function emitBranding() {
    if (
      !establishmentLoaded ||
      !settingsLoaded
    ) {
      return;
    }
console.log("Establishment:", establishmentData);
console.log("Settings:", settingsData);

console.log("logoUrl:", settingsData.logoUrl);
console.log("logoPath:", settingsData.logoPath);
    const nomeExibicao =
      settingsData.nomeExibicao ||
      establishmentData.nome ||
      "Estabelecimento";

    onChange?.({
      nome:
        establishmentData.nome ||
        nomeExibicao,

      nomeExibicao,

      logoUrl:
        settingsData.logoUrl || "",

      logoPath:
        settingsData.logoPath || "",

      corPrincipal:
        settingsData.corPrincipal ||
        "#f97316",

      tema:
        settingsData.tema ||
        "light",

      establishment:
        establishmentData,

      settings:
        settingsData,
    });
  }

  const stopEstablishment = onSnapshot(
    doc(
      db,
      "establishments",
      establishmentId,
    ),
    (snapshot) => {
      establishmentData =
        snapshot.exists()
          ? snapshot.data()
          : {};

      establishmentLoaded = true;
      emitBranding();
    },
    (error) => {
      console.error(
        "Erro ao carregar estabelecimento:",
        error,
      );

      establishmentLoaded = true;
      emitBranding();

      onError?.(error);
    },
  );

  const stopSettings = onSnapshot(
    doc(
      db,
      "establishments",
      establishmentId,
      "settings",
      "general",
    ),
    (snapshot) => {
      settingsData =
        snapshot.exists()
          ? snapshot.data()
          : {};
console.log(
  "Settings:",
  settingsData,
);
      settingsLoaded = true;
      emitBranding();
    },
    (error) => {
      console.error(
        "Erro ao carregar identidade visual:",
        error,
      );

      settingsLoaded = true;
      emitBranding();

      onError?.(error);
    },
  );

  return () => {
    stopEstablishment();
    stopSettings();
  };
}