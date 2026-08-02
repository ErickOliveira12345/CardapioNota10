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
  httpsCallable,
} from "firebase/functions";

import {
  db,
  functions,
} from "../firebase/firebaseConfig.js";

function employeesCollection(establishmentId) {
  return collection(
    db,
    "establishments",
    establishmentId,
    "employees",
  );
}

export function observeEstablishmentUsers(
  establishmentId,
  onChange,
  onError,
) {
  if (!establishmentId) {
    onChange([]);
    return () => {};
  }

  const employeesQuery = query(
    employeesCollection(establishmentId),
    orderBy("nome", "asc"),
  );

  return onSnapshot(
    employeesQuery,
    (snapshot) => {
      const employees = snapshot.docs.map(
        (documentSnapshot) => ({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        }),
      );

      onChange(employees);
    },
    (error) => {
      console.error(
        "Erro ao carregar funcionários:",
        error,
      );

      onError?.(error);
    },
  );
}

export async function createEstablishmentUser(
  userData,
) {
  const callable = httpsCallable(
    functions,
    "createEstablishmentUser",
  );

  const response = await callable({
    nome: String(userData.nome || "").trim(),
    email: String(userData.email || "")
      .trim()
      .toLowerCase(),
    senha: userData.senha,
    telefone: String(
      userData.telefone || "",
    ).trim(),
    role: userData.role,
    permissoes:
      userData.permissoes || {},
  });

  return response.data;
}

export async function updateEstablishmentUser({
  employeeId,
  nome,
  telefone,
  role,
}) {
  if (!employeeId) {
    throw new Error("Funcionário inválido.");
  }

  const callable = httpsCallable(
    functions,
    "updateEstablishmentUser",
  );

  const response = await callable({
    employeeId,
    nome: String(nome || "").trim(),
    telefone: String(telefone || "").trim(),
    role,
  });

  return response.data;
}

export async function updateEstablishmentUserPermissions({
  employeeId,
  permissoes,
}) {
  if (!employeeId) {
    throw new Error("Funcionário inválido.");
  }

  const callable = httpsCallable(
    functions,
    "updateEstablishmentUserPermissions",
  );

  const response = await callable({
    employeeId,
    permissoes: permissoes || {},
  });

  return response.data;
}

export async function updateEstablishmentUserStatus({
  employeeId,
  status,
}) {
  if (!employeeId) {
    throw new Error("Funcionário inválido.");
  }

  if (!["active", "blocked"].includes(status)) {
    throw new Error(
      "Status de funcionário inválido.",
    );
  }

  const callable = httpsCallable(
    functions,
    "updateEstablishmentUserStatus",
  );

  const response = await callable({
    employeeId,
    status,
  });

  return response.data;
}