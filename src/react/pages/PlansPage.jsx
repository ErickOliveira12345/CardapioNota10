import React, {
  useEffect,
  useState,
} from "react";

import PlanCard from "../components/PlanCard";

import "../styles/plans.css";

import {
  observePlans,
} from "../services/subscriptionService";

export default function PlansPage({
  onNavigate,
}) {
  const [plans, setPlans] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    /*
     * Escuta os planos diretamente
     * no Firebase.
     *
     * Qualquer alteração feita pelo
     * Super Admin será refletida
     * automaticamente nesta página.
     */
    const unsubscribe =
      observePlans(
        (updatedPlans) => {
          console.log(
            "PLANOS RECEBIDOS:",
            updatedPlans,
          );

          setPlans(
            Array.isArray(updatedPlans)
              ? updatedPlans
              : [],
          );

          setLoading(false);
        },

        (firebaseError) => {
          console.error(
            "Erro ao carregar planos:",
            firebaseError,
          );

          setError(
            "Não foi possível carregar os planos.",
          );

          setLoading(false);
        },
      );

    /*
     * Remove o listener quando
     * sair da página.
     */
    return () => {
      if (
        typeof unsubscribe ===
        "function"
      ) {
        unsubscribe();
      }
    };
  }, []);

  function handleSelect(plan) {
    console.log(
      "PLANO SELECIONADO:",
      plan,
    );

    /*
     * Próxima etapa:
     * integração com Mercado Pago.
     */
  }

  if (loading) {
    return (
      <div className="plans-page">
        <div className="plans-loading">
          Carregando planos...
        </div>
      </div>
    );
  }

  return (
    <div className="plans-page">
      <header className="plans-header">
        <div>
          <button
            type="button"
            className="plans-back-button"
            onClick={() =>
              onNavigate?.(
                "/admin/assinatura",
              )
            }
          >
            ← Voltar
          </button>

          <h1>
            Escolha o plano ideal
          </h1>

          <p>
            Assine o Cardápio Nota10 e
            tenha acesso às melhores
            ferramentas para o seu
            restaurante.
          </p>
        </div>
      </header>

      {error && (
        <div className="plans-error">
          {error}
        </div>
      )}

      {!error &&
        plans.length === 0 && (
          <div className="plans-empty">
            Nenhum plano disponível.
          </div>
        )}

      {!error &&
        plans.length > 0 && (
          <section className="plans-grid">
            {plans.map(
              (plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  recommended={
                    plan.id ===
                    "intermediario"
                  }
                  onSelect={
                    handleSelect
                  }
                />
              ),
            )}
          </section>
        )}
    </div>
  );
}