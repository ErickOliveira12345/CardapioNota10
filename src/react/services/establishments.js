import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

export const TEST_ESTABLISHMENT_ID =
  "cardapio-nota10-demo";

export async function criarEstabelecimentoTeste() {
  const establishmentRef = doc(
    db,
    "establishments",
    TEST_ESTABLISHMENT_ID
  );

  await setDoc(
    establishmentRef,
    {
      nome: "Cardápio Nota10",
      nomeFantasia: "Cardápio Nota10",

      ownerId: "admin-inicial",

      email: "",
      telefone: "",
      documento: "",

      endereco: {
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
      },

      status: "active",

      subscription: {
        planId: "premium",
        planName: "Premium",
        status: "active",
        expiresAt: null,
      },

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  return TEST_ESTABLISHMENT_ID;
}