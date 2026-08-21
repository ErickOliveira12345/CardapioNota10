import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebaseConfig.js";

const PLANS_COLLECTION =
  "plans";

const SUBSCRIPTIONS_COLLECTION =
  "subscriptions";

/**
 * Busca todos os planos.
 */
export async function getPlans() {
  const snapshot =
    await getDocs(
      collection(
        db,
        PLANS_COLLECTION,
      ),
    );

  return snapshot.docs.map(
    (documentSnapshot) => ({
      id:
        documentSnapshot.id,

      ...documentSnapshot.data(),
    }),
  );
}

/**
 * Acompanha os planos em tempo real.
 *
 * Sempre que algum plano for alterado
 * no Firebase, a página recebe os
 * novos dados automaticamente.
 */
export function observePlans(
  onChange,
  onError,
) {
  const plansReference =
    collection(
      db,
      PLANS_COLLECTION,
    );

  return onSnapshot(
    plansReference,

    (snapshot) => {
      const plans =
        snapshot.docs.map(
          (
            documentSnapshot,
          ) => ({
            id:
              documentSnapshot.id,

            ...documentSnapshot.data(),
          }),
        );

      /*
       * Ordena utilizando o campo
       * "ordem" existente nos planos.
       */
      plans.sort(
        (firstPlan, secondPlan) =>
          Number(
            firstPlan.ordem || 0,
          ) -
          Number(
            secondPlan.ordem || 0,
          ),
      );

      console.log(
        "PLANOS ATUALIZADOS DO FIREBASE:",
        plans,
      );

      onChange?.(
        plans,
      );
    },

    (error) => {
      console.error(
        "Erro ao acompanhar planos:",
        error,
      );

      onError?.(
        error,
      );
    },
  );
}

/**
 * Busca um plano específico.
 */
export async function getPlan(
  planId,
) {
  if (!planId) {
    return null;
  }

  const snapshot =
    await getDoc(
      doc(
        db,
        PLANS_COLLECTION,
        planId,
      ),
    );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id:
      snapshot.id,

    ...snapshot.data(),
  };
}

/**
 * Busca a assinatura do
 * estabelecimento.
 */
export async function getSubscription(
  establishmentId,
) {
  if (!establishmentId) {
    return null;
  }

  const subscriptionQuery =
    query(
      collection(
        db,
        SUBSCRIPTIONS_COLLECTION,
      ),

      where(
        "establishmentId",
        "==",
        establishmentId,
      ),
    );

  const snapshot =
    await getDocs(
      subscriptionQuery,
    );

  if (snapshot.empty) {
    return null;
  }

  const subscription =
    snapshot.docs[0];

  return {
    id:
      subscription.id,

    ...subscription.data(),
  };
}