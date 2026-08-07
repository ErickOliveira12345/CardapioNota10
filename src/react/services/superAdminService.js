import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig.js";

// =============================
// ESTABELECIMENTOS
// =============================

export async function getAllEstablishments() {
  const q = query(
    collection(db, "establishments"),
    orderBy("criadoEm", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function getEstablishmentById(id) {
  const snapshot = await getDoc(
    doc(db, "establishments", id)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function updateEstablishmentStatus(
  establishmentId,
  status
) {
  await updateDoc(
    doc(db, "establishments", establishmentId),
    {
      status,
      atualizadoEm: serverTimestamp(),
    }
  );
}

export async function deleteEstablishment(
  establishmentId
) {
  await deleteDoc(
    doc(db, "establishments", establishmentId)
  );
}

// =============================
// PLANOS
// =============================

export async function getAllPlans() {
  const snapshot = await getDocs(
    collection(db, "plans")
  );

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function createPlan(plan) {
  if (!plan.codigo) {
    throw new Error("Código do plano não informado.");
  }

  const planRef = doc(db, "plans", plan.codigo);

  await setDoc(planRef, {
    ...plan,

    // Valores padrão
    ativo: plan.ativo ?? true,
    totalAssinantes: plan.totalAssinantes ?? 0,

    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  return plan.codigo;
}

export async function updatePlan(planId, data) {
  await updateDoc(
    doc(db, "plans", planId),
    {
      ...data,
      atualizadoEm: serverTimestamp(),
    }
  );
}

export async function deletePlan(planId) {
  if (!planId) {
    throw new Error("ID do plano não informado.");
  }

  const planRef = doc(db, "plans", planId);
  const planSnapshot = await getDoc(planRef);

  if (!planSnapshot.exists()) {
    throw new Error("Plano não encontrado.");
  }

  const plan = {
    id: planSnapshot.id,
    ...planSnapshot.data(),
  };

  if (plan.protegido === true) {
    throw new Error(
      `O plano "${plan.nome}" é protegido e não pode ser excluído.`
    );
  }

  const totalAssinantes = Number(plan.totalAssinantes ?? 0);

  if (totalAssinantes > 0) {
    throw new Error(
      `O plano "${plan.nome}" possui ${totalAssinantes} assinante(s) e não pode ser excluído.`
    );
  }

  await deleteDoc(planRef);

  return true;
}

// =============================
// ASSINATURAS
// =============================

export async function getAllSubscriptions() {
  const snapshot = await getDocs(
    collection(db, "subscriptions")
  );

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function getSubscriptionById(
  subscriptionId,
) {
  if (!subscriptionId) {
    throw new Error(
      "ID da assinatura não informado.",
    );
  }

  const snapshot = await getDoc(
    doc(
      db,
      "subscriptions",
      subscriptionId,
    ),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function updateSubscriptionPlan({
  subscriptionId,
  planId,
  planName,
  valorAtual,
  proximoValor,
}) {
  if (!subscriptionId) {
    throw new Error(
      "ID da assinatura não informado.",
    );
  }

  if (!planId) {
    throw new Error(
      "Plano não informado.",
    );
  }

  const subscriptionReference = doc(
    db,
    "subscriptions",
    subscriptionId,
  );

  await updateDoc(
    subscriptionReference,
    {
      planId,

      planName:
        String(planName || "").trim(),

      valorAtual:
        Number(valorAtual || 0),

      proximoValor:
        Number(proximoValor || 0),

      atualizadoEm:
        serverTimestamp(),
    },
  );

  const updatedSnapshot =
    await getDoc(
      subscriptionReference,
    );

  if (!updatedSnapshot.exists()) {
    throw new Error(
      "Assinatura não encontrada após a atualização.",
    );
  }

  return {
    id: updatedSnapshot.id,
    ...updatedSnapshot.data(),
  };
}

// =============================
// PAGAMENTOS
// =============================

export async function getAllPayments() {
  const snapshot = await getDocs(
    collection(db, "subscriptionPayments")
  );

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

// =============================
// USUÁRIOS
// =============================

export async function getAllUsers() {
  const usersSnapshot = await getDocs(
    collection(db, "users"),
  );

  return usersSnapshot.docs.map((userDoc) => ({
    ...userDoc.data(),
    id: userDoc.id,
  }));
}

export async function updateUserStatus(userId, newStatus) {
  if (!userId) {
    throw new Error("ID do usuário não informado.");
  }

  if (!["active", "blocked"].includes(newStatus)) {
    throw new Error(`Status inválido: ${newStatus}`);
  }

  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    status: newStatus,
    atualizadoEm: serverTimestamp(),
  });

  const updatedSnapshot = await getDoc(userRef);

  if (!updatedSnapshot.exists()) {
    throw new Error("Usuário não encontrado após a atualização.");
  }

  return {
    ...updatedSnapshot.data(),
    id: updatedSnapshot.id,
  };
}

export async function updateUserRole(
  userId,
  role,
) {
  await updateDoc(doc(db, "users", userId), {
    role,
    atualizadoEm: new Date(),
  });
}

// =============================
// DASHBOARD
// =============================

export async function getDashboardData() {
  const results = await Promise.allSettled([
    getAllEstablishments(),
    getAllPlans(),
    getAllSubscriptions(),
    getAllPayments(),
  ]);

  return {
    establishments:
      results[0].status === "fulfilled"
        ? results[0].value
        : [],

    plans:
      results[1].status === "fulfilled"
        ? results[1].value
        : [],

    subscriptions:
      results[2].status === "fulfilled"
        ? results[2].value
        : [],

    payments:
      results[3].status === "fulfilled"
        ? results[3].value
        : [],
  };

}