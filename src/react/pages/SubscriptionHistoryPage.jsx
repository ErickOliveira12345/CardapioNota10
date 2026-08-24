import React from "react";

import {
  useSubscription,
} from "../contexts/SubscriptionContext";

import "../styles/subscription.css";

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

      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export default function SubscriptionHistoryPage({
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
          Carregando histórico...
        </div>
      </div>
    );
  }

  /*
   * Por enquanto montamos alguns
   * eventos utilizando os próprios
   * dados existentes na assinatura.
   *
   * Depois podemos substituir por uma
   * coleção real de histórico no
   * Firestore.
   */
  const history = [];

  const createdAt =
    subscription?.createdAt ||
    subscription?.criadoEm ||
    subscription?.startedAt ||
    subscription?.inicioEm ||
    null;

  if (createdAt) {
    history.push({
      id: "subscription-created",

      icon: "🚀",

      title:
        "Assinatura iniciada",

      description:
        plan?.nome
          ? `Plano ${plan.nome} ativado para o estabelecimento.`
          : "Assinatura criada para o estabelecimento.",

      date:
        createdAt,
    });
  }

  const updatedAt =
    subscription?.updatedAt ||
    subscription?.atualizadoEm ||
    null;

  if (updatedAt) {
    history.push({
      id: "subscription-updated",

      icon: "🔄",

      title:
        "Assinatura atualizada",

      description:
        "Os dados da assinatura foram atualizados.",

      date:
        updatedAt,
    });
  }

  const nextBilling =
    subscription?.proximaCobrancaEm ||
    subscription?.nextPaymentAt ||
    subscription?.nextBillingAt ||
    null;

  if (nextBilling) {
    history.push({
      id: "next-billing",

      icon: "💳",

      title:
        "Próxima cobrança",

      description:
        "Próxima cobrança programada para a assinatura.",

      date:
        nextBilling,
    });
  }

  return (
    <div className="subscription-page">

      {/* ============================ */}
      {/* CABEÇALHO */}
      {/* ============================ */}

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
            Histórico
          </h1>

          <p>
            Acompanhe alterações,
            renovações e eventos
            relacionados à sua assinatura.
          </p>
        
      </div>


      {!subscription ? (
        <section className="subscription-empty">
          <span
            className="subscription-empty__icon"
            aria-hidden="true"
          >
            🕘
          </span>

          <h2>
            Nenhuma assinatura encontrada
          </h2>

          <p>
            Não existem informações
            de histórico para este
            estabelecimento.
          </p>
        </section>
      ) : (
        <>

          {/* ============================ */}
          {/* RESUMO */}
          {/* ============================ */}

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
                Status Atual
              </span>

              <h2>
                {formatStatus(
                  subscription?.status,
                )}
              </h2>
            </div>

            <div className="summary-card">
              <span>
                ID da Assinatura
              </span>

              <h2 className="subscription-history-id">
                {subscription?.id || "-"}
              </h2>
            </div>
          </section>


          {/* ============================ */}
          {/* HISTÓRICO */}
          {/* ============================ */}

          <section className="subscription-history">
            <div className="subscription-history__header">
              <div>
                <span>
                  Linha do tempo
                </span>

                <h2>
                  Histórico da Assinatura
                </h2>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="subscription-features-empty">
                Nenhum evento registrado
                até o momento.
              </div>
            ) : (
              <div className="subscription-history-list">
                {history.map(
                  (event) => (
                    <article
                      key={event.id}
                      className="subscription-history-item"
                    >
                      <div className="subscription-history-icon">
                        {event.icon}
                      </div>

                      <div className="subscription-history-content">
                        <strong>
                          {event.title}
                        </strong>

                        <p>
                          {event.description}
                        </p>
                      </div>

                      <time>
                        {formatDate(
                          event.date,
                        )}
                      </time>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}