import {
  addDoc,
  collection,
  deleteDoc,
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

function tablesCollection(establishmentId) {
  return collection(
    db,
    "establishments",
    establishmentId,
    "tables",
  );
}

function createTableToken() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

export function observeTables(
  establishmentId,
  onChange,
  onError,
) {
  if (!establishmentId) {
    onChange([]);
    return () => {};
  }

  const tablesQuery = query(
    tablesCollection(establishmentId),
    orderBy("numero", "asc"),
  );

  return onSnapshot(
    tablesQuery,
    (snapshot) => {
      const tables = snapshot.docs.map(
        (document) => ({
          id: document.id,
          ...document.data(),
        }),
      );

      onChange(tables);
    },
    (error) => {
      console.error(
        "Erro ao carregar mesas:",
        error,
      );

      onError?.(error);
    },
  );
}

export async function createTable({
  establishmentId,
  numero,
  nome,
  descricao,
}) {
  if (!establishmentId) {
    throw new Error(
      "Estabelecimento não identificado.",
    );
  }

  const tableNumber = Number(numero);

  if (
    !Number.isInteger(tableNumber) ||
    tableNumber <= 0
  ) {
    throw new Error(
      "Informe um número de mesa válido.",
    );
  }

  const tableReference = await addDoc(
    tablesCollection(establishmentId),
    {
      numero: tableNumber,

      nome:
        String(nome || "").trim() ||
        `Mesa ${tableNumber}`,

      descricao: String(
        descricao || "",
      ).trim(),

      token: createTableToken(),

      ativa: true,

      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    },
  );

  return tableReference.id;
}

export async function updateTable({
  establishmentId,
  tableId,
  numero,
  nome,
  descricao,
}) {
  if (!establishmentId || !tableId) {
    throw new Error("Mesa inválida.");
  }

  const tableNumber = Number(numero);

  if (
    !Number.isInteger(tableNumber) ||
    tableNumber <= 0
  ) {
    throw new Error(
      "Informe um número de mesa válido.",
    );
  }

  const tableReference = doc(
    db,
    "establishments",
    establishmentId,
    "tables",
    tableId,
  );

  await updateDoc(tableReference, {
    numero: tableNumber,

    nome:
      String(nome || "").trim() ||
      `Mesa ${tableNumber}`,

    descricao: String(
      descricao || "",
    ).trim(),

    atualizadoEm: serverTimestamp(),
  });
}

export async function updateTableStatus({
  establishmentId,
  tableId,
  ativa,
}) {
  if (!establishmentId || !tableId) {
    throw new Error("Mesa inválida.");
  }

  const tableReference = doc(
    db,
    "establishments",
    establishmentId,
    "tables",
    tableId,
  );

  await updateDoc(tableReference, {
    ativa: Boolean(ativa),
    atualizadoEm: serverTimestamp(),
  });
}

export async function regenerateTableToken({
  establishmentId,
  tableId,
}) {
  if (!establishmentId || !tableId) {
    throw new Error("Mesa inválida.");
  }

  const token = createTableToken();

  const tableReference = doc(
    db,
    "establishments",
    establishmentId,
    "tables",
    tableId,
  );

  await updateDoc(tableReference, {
    token,
    atualizadoEm: serverTimestamp(),
  });

  return token;
}

export async function deleteTable({
  establishmentId,
  tableId,
}) {
  if (!establishmentId || !tableId) {
    throw new Error("Mesa inválida.");
  }

  const tableReference = doc(
    db,
    "establishments",
    establishmentId,
    "tables",
    tableId,
  );

  await deleteDoc(tableReference);
}