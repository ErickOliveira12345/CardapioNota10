import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebaseConfig.js";

const settingsReference = () =>
  doc(
    db,
    "platformSettings",
    "general",
  );

export const DEFAULT_PLATFORM_SETTINGS = {
  nomePlataforma: "Cardápio Nota10",
  emailSuporte:
    "suporte@cardapionota10.com",
  telefoneSuporte: "",

  diasTolerancia: 3,
  bloquearInadimplente: true,
  enviarAvisoVencimento: true,

  permitirNovosCadastros: true,
  modoManutencao: false,
};

export async function getPlatformSettings() {
  const snapshot = await getDoc(
    settingsReference(),
  );

  if (!snapshot.exists()) {
    return {
      ...DEFAULT_PLATFORM_SETTINGS,
    };
  }

  return {
    ...DEFAULT_PLATFORM_SETTINGS,
    ...snapshot.data(),
  };
}

export async function savePlatformSettings(
  settings,
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "Usuário não autenticado.",
    );
  }

  const diasTolerancia = Number(
    settings.diasTolerancia,
  );

  if (
    !Number.isInteger(
      diasTolerancia,
    ) ||
    diasTolerancia < 0 ||
    diasTolerancia > 30
  ) {
    throw new Error(
      "Os dias de tolerância devem estar entre 0 e 30.",
    );
  }

  const data = {
    nomePlataforma:
      String(
        settings.nomePlataforma || "",
      ).trim(),

    emailSuporte:
      String(
        settings.emailSuporte || "",
      )
        .trim()
        .toLowerCase(),

    telefoneSuporte:
      String(
        settings.telefoneSuporte || "",
      ).trim(),

    diasTolerancia,

    bloquearInadimplente:
      Boolean(
        settings.bloquearInadimplente,
      ),

    enviarAvisoVencimento:
      Boolean(
        settings.enviarAvisoVencimento,
      ),

    permitirNovosCadastros:
      Boolean(
        settings.permitirNovosCadastros,
      ),

    modoManutencao:
      Boolean(
        settings.modoManutencao,
      ),

    atualizadoEm:
      serverTimestamp(),

    atualizadoPor:
      user.uid,
  };
  await setDoc(
    settingsReference(),
    data,
    {
      merge: true,
    },
  );
  return data;
}

export function observePlatformSettings(
  onChange,
  onError,
) {
  return onSnapshot(
    settingsReference(),

    (snapshot) => {
      if (!snapshot.exists()) {
        onChange({
          ...DEFAULT_PLATFORM_SETTINGS,
        });

        return;
      }

      onChange({
        ...DEFAULT_PLATFORM_SETTINGS,
        ...snapshot.data(),
      });
    },

    (error) => {
      console.error(
        "Erro ao observar configurações da plataforma:",
        error,
      );

      if (onError) {
        onError(error);
      }
    },
  );
}