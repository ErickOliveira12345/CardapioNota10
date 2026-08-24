import React from "react";

import {
  useSubscription,
} from "../contexts/SubscriptionContext";

import "../styles/subscription.css";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

function formatStatus(status) {
  const normalized =
    String(status || "")
      .trim()
      .toLowerCase();

  const labels = {
    active: "Ativa",
    ativo: "Ativa",

    pending: "Pendente",
    pendente: "Pendente",

    trial: "Período gratuito",

    past_due:
      "Pagamento pendente",

    canceled: "Cancelada",
    cancelled: "Cancelada",

    expired: "Expirada",
    expirado: "Expirada",
  };

  return (
    labels[normalized] ||
    status ||
    "-"
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  let date = null;

  if (
    typeof value?.toDate ===
    "function"
  ) {
    date = value.toDate();
  } else if (
    typeof value?.seconds ===
    "number"
  ) {
    date = new Date(
      value.seconds * 1000,
    );
  } else {
    date = new Date(value);
  }

  if (
    !date ||
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
}

export default function SubscriptionBillingPage({
  onNavigate,
}) {
  const {
    subscription,
    plan,
    loading,
  } = useSubscription();

  if (loading) {
    return (
      <div className="subscription-page">
        <div className="subscription-loading">
          Carregando cobranças...
        </div>
      </div>
    );
  }

  const monthlyPrice =
    Number(
      plan?.precoMensal || 0,
    ) / 100;

  const nextBillingDate =
    subscription?.proximaCobrancaEm ||
    subscription?.nextPaymentAt ||
    subscription?.nextBillingAt ||
    subscription?.expiresAt ||
    null;

  return (
    <div className="subscription-page">
      <div className="subscription-header">
        
          <button
            type="button"
            className="subscription-change-button-voltar"
            onClick={() =>
                onNavigate?.(
                "/admin/assinatura",
                )
            }
            >
            ← Voltar
          </button>
        
          <span className="subscription-eyebrow">
            Assinatura
          </span>

          <h1>
            Cobranças
          </h1>

          <p>
            Acompanhe valores,
            vencimentos e pagamentos
            da sua assinatura.
          </p>
        

      </div>

      {!subscription ? (
        <section className="subscription-empty">
          <span
            className="subscription-empty__icon"
            aria-hidden="true"
          >
            💳
          </span>

          <h2>
            Nenhuma assinatura encontrada
          </h2>

          <p>
            Não existem dados de cobrança
            para este estabelecimento.
          </p>
        </section>
      ) : (
        <>
          <section className="subscription-summary">
            <div className="summary-card">
              <span>
                Plano Atual
              </span>

              <h2>
                {plan?.nome || "-"}
              </h2>
            </div>

            <div className="summary-card">
              <span>
                Valor Mensal
              </span>

              <h2>
                {formatCurrency(
                  monthlyPrice,
                )}
              </h2>
            </div>

            <div className="summary-card">
              <span>
                Status
              </span>

              <h2>
                {formatStatus(
                  subscription?.status,
                )}
              </h2>
            </div>

            <div className="summary-card">
              <span>
                Próxima Cobrança
              </span>

              <h2>
                {formatDate(
                  nextBillingDate,
                )}
              </h2>
            </div>
          </section>

          <section className="subscription-features">
            <div className="subscription-features__header">
              <div>
                <span>
                  Financeiro
                </span>

                <h2>
                  Histórico de Cobranças
                </h2>
              </div>
            </div>

            <div className="subscription-features-empty">
              Nenhuma cobrança registrada
              até o momento.
            </div>
          </section>
        </>
      )}
    </div>
  );
}