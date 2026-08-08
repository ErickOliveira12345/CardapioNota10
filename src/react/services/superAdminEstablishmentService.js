import {
  httpsCallable,
} from "firebase/functions";

import {
  functions,
} from "../firebase/firebaseConfig.js";

export async function createEstablishmentByAdmin(
  data,
) {
  const callable = httpsCallable(
    functions,
    "createEstablishmentByAdmin",
  );

  const response =
    await callable(data);

  return response.data;
}