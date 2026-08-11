import {
  httpsCallable,
} from "firebase/functions";

import {
  functions,
} from "../firebase/firebaseConfig.js";

const calculateDeliveryRouteCallable =
  httpsCallable(
    functions,
    "calculateDeliveryRoute",
  );

export async function calculateDeliveryRoute({
  origin,
  destination,
}) {
  if (!origin) {
    throw new Error(
      "Origem não informada.",
    );
  }

  if (!destination) {
    throw new Error(
      "Destino não informado.",
    );
  }

  const response =
    await calculateDeliveryRouteCallable({
      origin: {
        latitude:
          Number(origin.latitude),

        longitude:
          Number(origin.longitude),
      },

      destination: {
        latitude:
          Number(destination.latitude),

        longitude:
          Number(destination.longitude),
      },
    });

  return response.data;
}