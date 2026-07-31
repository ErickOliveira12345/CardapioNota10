import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

const PLANS_COLLECTION = "plans";
const SUBSCRIPTIONS_COLLECTION = "subscriptions";

/**
 * Busca todos os planos ativos
 */
export async function getPlans() {
  const snapshot = await getDocs(
    collection(db, PLANS_COLLECTION),
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Busca um plano específico
 */
export async function getPlan(planId) {
  const snapshot = await getDoc(
    doc(db, PLANS_COLLECTION, planId),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

/**
 * Busca a assinatura do estabelecimento
 */
export async function getSubscription(
  establishmentId,
) {
  const q = query(
    collection(db, SUBSCRIPTIONS_COLLECTION),
    where(
      "establishmentId",
      "==",
      establishmentId,
    ),
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const subscription = snapshot.docs[0];

  return {
    id: subscription.id,
    ...subscription.data(),
  };
}