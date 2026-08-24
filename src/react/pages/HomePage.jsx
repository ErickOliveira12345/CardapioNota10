import React, {
  useEffect,
  useState,
} from "react";

import PlanCard from "../components/PlanCard";

import {
  observePlans,
} from "../services/subscriptionService";

export function HomePage({
  currentTable,
  onSelectTable,
  onContinueSession,
  onNewSession,
  onNavigate,
}) {
  const [plans, setPlans] =
    useState([]);

  const [loadingPlans, setLoadingPlans] =
    useState(true);

  const [plansError, setPlansError] =
    useState("");

  useEffect(() => {
    setLoadingPlans(true);
    setPlansError("");

    /*
     * Busca os planos diretamente
     * do Firestore e acompanha
     * alterações em tempo real.
     */
    const unsubscribe =
      observePlans(
        (firebasePlans) => {
          setPlans(
            Array.isArray(firebasePlans)
              ? firebasePlans
              : [],
          );

          setLoadingPlans(false);
        },

        (error) => {
          console.error(
            "Erro ao carregar planos na Home:",
            error,
          );

          setPlansError(
            "Não foi possível carregar os planos.",
          );

          setLoadingPlans(false);
        },
      );

    return () => {
      if (
        typeof unsubscribe ===
        "function"
      ) {
        unsubscribe();
      }
    };
  }, []);

  function handleSelectPlan(plan) {
    console.log(
      "PLANO SELECIONADO NA HOME:",
      plan,
    );

    /*
     * Como o visitante ainda pode
     * não possuir conta, vamos levá-lo
     * para o cadastro/login.
     *
     * Depois podemos guardar o plan.id
     * para continuar a contratação.
     */
    onNavigate?.("/login");
  }

  return (
    <div className="qr-page">

      {/* ============================= */}
      {/* APRESENTAÇÃO */}
      {/* ============================= */}

      <header className="qr-header">
        <div
          className="qr-logo"
          aria-hidden="true"
        >
          🍽️
        </div>

        <h1 className="qr-restaurant-name">
          Cardápio Nota10
        </h1>

        <p className="qr-tagline">
          Bem-vindo ao seu novo
          cardápio digital
        </p>

        <div className="home-hero-actions">
          <button
            type="button"
            className="home-primary-button"
            onClick={() =>
              onNavigate?.("/login")
            }
          >
            Criar Conta Para Meu
            Estabelecimento
          </button>

          <button
            type="button"
            className="home-tutorial-button"
            onClick={() =>
              onNavigate?.("/tutorial")
            }
          >
            ▶ Ver Tutorial
          </button>
        </div>
      </header>


      {/* ============================= */}
      {/* COMO FUNCIONA */}
      {/* ============================= */}

      <div className="qr-instructions">
        <div className="instruction-step">
          <span className="step-num">
            1
          </span>

          <span>
            Cardápio com QR Code na mesa
          </span>
        </div>

        <div className="instruction-step">
          <span className="step-num">
            2
          </span>

          <span>
            Comece a inovação no seu
            estabelecimento
          </span>
        </div>

        <div className="instruction-step">
          <span className="step-num">
            3
          </span>

          <span>
            Escolha o melhor plano para
            seu estabelecimento
          </span>
        </div>
      </div>


      {/* ============================= */}
      {/* PLANOS */}
      {/* ============================= */}

      <section className="home-plans-section">

        <header className="home-plans-header">
          <span>
            Planos
          </span>

          <h2>
            Escolha o plano ideal
          </h2>

          <p>
            Encontre a melhor opção
            para modernizar e gerenciar
            seu estabelecimento.
          </p>
        </header>

        {loadingPlans && (
          <div className="home-plans-loading">
            Carregando planos...
          </div>
        )}

        {plansError && (
          <div className="home-plans-error">
            {plansError}
          </div>
        )}

        {!loadingPlans &&
          !plansError &&
          plans.length === 0 && (
            <div className="home-plans-empty">
              Nenhum plano disponível
              no momento.
            </div>
          )}

        {!loadingPlans &&
          !plansError &&
          plans.length > 0 && (
            <div className="home-plans-grid">
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
                      handleSelectPlan
                    }
                  />
                ),
              )}
            </div>
          )}
      </section>


      {/* ============================= */}
      {/* CHAMADA FINAL */}
      {/* ============================= */}

      <section className="home-final-cta">
        <h2>
          Pronto para começar?
        </h2>

        <p>
          Crie sua conta e leve seu
          estabelecimento para o
          próximo nível.
        </p>

        <button
          type="button"
          onClick={() =>
            onNavigate?.("/login")
          }
        >
          Criar Conta Para Meu
          Estabelecimento →
        </button>
      </section>
    </div>
  );
}