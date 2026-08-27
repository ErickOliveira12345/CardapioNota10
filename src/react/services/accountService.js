import {
  httpsCallable,
} from "firebase/functions";

import {
  functions,
} from "../firebase/firebaseConfig.js";

export async function deleteEstablishmentAccount({
  establishmentId,
}) {
  if (!establishmentId) {
    throw new Error(
      "Estabelecimento não identificado.",
    );
  }

  const deleteAccount =
    httpsCallable(
      functions,
      "deleteEstablishmentAccount",
    );

  const result =
    await deleteAccount({
      establishmentId,
      confirmation:
        "EXCLUIR",
    });

  return result.data;
}