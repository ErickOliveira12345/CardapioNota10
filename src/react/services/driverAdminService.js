import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebaseConfig.js";

function driversCollection() {
  return collection(
    db,
    "deliveryDrivers",
  );
}

function driverReference(driverId) {
  return doc(
    db,
    "deliveryDrivers",
    driverId,
  );
}

export function observeDeliveryDrivers(
  onChange,
  onError,
) {
  const driversQuery =
    query(
      driversCollection(),
      orderBy(
        "criadoEm",
        "desc",
      ),
    );

  return onSnapshot(
    driversQuery,

    (snapshot) => {
      const drivers =
        snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          }),
        );

      onChange(drivers);
    },

    (error) => {
      console.error(
        "Erro ao carregar entregadores:",
        error,
      );

      onError?.(error);
    },
  );
}

export async function approveDriver({
  driverId,
  superAdminUid,
}) {
  if (!driverId) {
    throw new Error(
      "Entregador não identificado.",
    );
  }

  if (!superAdminUid) {
    throw new Error(
      "Super Admin não identificado.",
    );
  }

  await updateDoc(
    driverReference(driverId),
    {
      status: "approved",

      disponivel: false,

      aprovadoPor:
        superAdminUid,

      aprovadoEm:
        serverTimestamp(),

      atualizadoEm:
        serverTimestamp(),
    },
  );
}

export async function blockDriver({
  driverId,
  superAdminUid,
}) {
  if (!driverId) {
    throw new Error(
      "Entregador não identificado.",
    );
  }

  await updateDoc(
    driverReference(driverId),
    {
      status: "blocked",

      disponivel: false,

      bloqueadoPor:
        superAdminUid,

      bloqueadoEm:
        serverTimestamp(),

      atualizadoEm:
        serverTimestamp(),
    },
  );
}

export async function setDriverPending({
  driverId,
  superAdminUid,
}) {
  if (!driverId) {
    throw new Error(
      "Entregador não identificado.",
    );
  }

  await updateDoc(
    driverReference(driverId),
    {
      status: "pending",

      disponivel: false,

      revisadoPor:
        superAdminUid,

      atualizadoEm:
        serverTimestamp(),
    },
  );
}