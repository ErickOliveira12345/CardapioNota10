import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebaseConfig.js";

function settingsReference(
  establishmentId,
) {
  return doc(
    db,
    "establishments",
    establishmentId,
    "settings",
    "general",
  );
}

export function observeEstablishmentSettings(
  establishmentId,
  onChange,
  onError,
) {
  if (!establishmentId) {
    onChange({});
    return () => {};
  }

  return onSnapshot(
    settingsReference(establishmentId),

    (snapshot) => {
      onChange(
        snapshot.exists()
          ? snapshot.data()
          : {},
      );
    },

    (error) => {
      console.error(
        "Erro ao acompanhar configurações:",
        error,
      );

      onError?.(error);
    },
  );
}

export async function saveEstablishmentSettings({
  establishmentId,
  settings,
}) {
  if (!establishmentId) {
    throw new Error(
      "Estabelecimento não identificado.",
    );
  }

  await setDoc(
    settingsReference(establishmentId),

    {
      ...settings,
      atualizadoEm:
        serverTimestamp(),
    },

    {
      merge: true,
    },
  );
}