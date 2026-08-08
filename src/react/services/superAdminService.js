import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
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
  establishmentId,
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

  if (!establishmentId) {
    throw new Error(
      "ID do estabelecimento não informado.",
    );
  }

  if (!planId) {
    throw new Error(
      "ID do novo plano não informado.",
    );
  }

  const subscriptionRef = doc(
    db,
    "subscriptions",
    subscriptionId,
  );

  const establishmentRef = doc(
    db,
    "establishments",
    establishmentId,
  );

  const updatedSubscription =
    await runTransaction(
      db,
      async (transaction) => {
        /*
         * 1. Lê a assinatura atual.
         */
        const subscriptionSnapshot =
          await transaction.get(
            subscriptionRef,
          );

        if (
          !subscriptionSnapshot.exists()
        ) {
          throw new Error(
            "Assinatura não encontrada.",
          );
        }

        const currentSubscription =
          subscriptionSnapshot.data();

        const oldPlanId =
          currentSubscription.planId;

        /*
         * Se escolheu exatamente o mesmo
         * plano, não precisamos mexer nos
         * contadores.
         */
        const samePlan =
          oldPlanId === planId;

        /*
         * 2. Confirma o estabelecimento.
         */
        const establishmentSnapshot =
          await transaction.get(
            establishmentRef,
          );

        if (
          !establishmentSnapshot.exists()
        ) {
          throw new Error(
            "Estabelecimento não encontrado.",
          );
        }

        /*
         * 3. Busca o novo plano.
         */
        const newPlanRef = doc(
          db,
          "plans",
          planId,
        );

        const newPlanSnapshot =
          await transaction.get(
            newPlanRef,
          );

        if (!newPlanSnapshot.exists()) {
          throw new Error(
            "Novo plano não encontrado.",
          );
        }

        const newPlan =
          newPlanSnapshot.data();

        if (newPlan.ativo === false) {
          throw new Error(
            `O plano "${
              newPlan.nome || planId
            }" está desativado.`,
          );
        }

        /*
         * 4. Se realmente mudou de plano,
         * buscamos também o plano anterior.
         */
        let oldPlanRef = null;
        let oldPlanSnapshot = null;

        if (
          !samePlan &&
          oldPlanId
        ) {
          oldPlanRef = doc(
            db,
            "plans",
            oldPlanId,
          );

          oldPlanSnapshot =
            await transaction.get(
              oldPlanRef,
            );
        }

        /*
         * IMPORTANTE:
         * Todas as leituras já foram feitas.
         * Daqui em diante fazemos apenas
         * gravações.
         */

        /*
         * 5. Atualiza a assinatura.
         */
        transaction.update(
          subscriptionRef,
          {
            planId,

            planName:
              String(
                planName ||
                  newPlan.nome ||
                  planId,
              ).trim(),

            valorAtual:
              Number(
                valorAtual ??
                  newPlan.precoMensal ??
                  0,
              ),

            proximoValor:
              Number(
                proximoValor ??
                  newPlan.precoMensal ??
                  0,
              ),

            atualizadoEm:
              serverTimestamp(),
          },
        );

        /*
         * 6. Atualiza o plano atual
         * no estabelecimento.
         */
        transaction.update(
          establishmentRef,
          {
            planoAtual: planId,
            atualizadoEm:
              serverTimestamp(),
          },
        );

        /*
         * 7. Ajusta os contadores somente
         * quando houve troca real.
         */
        if (!samePlan) {
          if (
            oldPlanRef &&
            oldPlanSnapshot?.exists()
          ) {
            const oldTotal = Number(
              oldPlanSnapshot.data()
                .totalAssinantes ?? 0,
            );

            transaction.update(
              oldPlanRef,
              {
                totalAssinantes:
                  Math.max(
                    oldTotal - 1,
                    0,
                  ),

                atualizadoEm:
                  serverTimestamp(),
              },
            );
          }

          const newTotal = Number(
            newPlan.totalAssinantes ?? 0,
          );

          transaction.update(
            newPlanRef,
            {
              totalAssinantes:
                newTotal + 1,

              atualizadoEm:
                serverTimestamp(),
            },
          );
        }

        return {
          id:
            subscriptionSnapshot.id,

          ...currentSubscription,

          planId,

          planName:
            String(
              planName ||
                newPlan.nome ||
                planId,
            ).trim(),

          valorAtual:
            Number(
              valorAtual ??
                newPlan.precoMensal ??
                0,
            ),

          proximoValor:
            Number(
              proximoValor ??
                newPlan.precoMensal ??
                0,
            ),
        };
      },
    );

  console.log(
    "Troca de plano concluída:",
    updatedSubscription,
  );

  return updatedSubscription;
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