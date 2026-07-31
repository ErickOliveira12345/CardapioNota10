import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./AuthContext";
import {
  getPlan,
  getSubscription,
} from "../services/subscriptionService";

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const {
    establishmentId,
    loading: authLoading,
  } = useAuth();

  const [subscription, setSubscription] =
    useState(null);

  const [plan, setPlan] = useState(null);

  const [loading, setLoading] = useState(true);

  const loadSubscription = useCallback(async () => {
    if (!establishmentId) {
      setSubscription(null);
      setPlan(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const subscriptionData =
        await getSubscription(establishmentId);

      if (!subscriptionData) {
        setSubscription(null);
        setPlan(null);
        return;
      }

      const planData = await getPlan(
        subscriptionData.planId,
      );

      setSubscription(subscriptionData);
      setPlan(planData);
    } catch (error) {
      console.error(
        "Erro ao carregar assinatura:",
        error,
      );

      setSubscription(null);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadSubscription();
  }, [authLoading, loadSubscription]);

  const value = useMemo(
    () => ({
      loading,
      subscription,
      plan,

      reloadSubscription: loadSubscription,
    }),
    [
      loading,
      subscription,
      plan,
      loadSubscription,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(
    SubscriptionContext,
  );

  if (!context) {
    throw new Error(
      "useSubscription deve ser utilizado dentro de SubscriptionProvider.",
    );
  }

  return context;
}