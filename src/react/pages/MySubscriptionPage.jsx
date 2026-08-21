import React from "react";

import { useSubscription } from "../contexts/SubscriptionContext";

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
  const normalizedStatus =
    String(status || "")
      .trim()
      .toLowerCase();

  const statusLabels = {
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
    statusLabels[normalizedStatus] ||
    status ||
    "-"
  );
}

function formatFeatureName(key) {
  const featureNames = {
    cardapioQrCode:
      "Cardápio por QR Code",

    chamadosAtendimento:
      "Chamados de Atendimento",

    controlePedidos:
      "Controle de Pedidos",

    marcaPersonalizada:
      "Marca Personalizada",

    relatoriosAvancados:
      "Relatórios Avançados",

    relatoriosVendas:
      "Relatórios de Vendas",

    suportePrioritario:
      "Suporte Prioritário",

    maxCategorias:
      "Categorias",

    maxFuncionarios:
      "Funcionários",

    maxMesas:
      "Mesas",

    maxProdutos:
      "Produtos",
  };

  return featureNames[key] || key;
}

export default function MySubscriptionPage({
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
          <span
            className="subscription-loading__icon"
            aria-hidden="true"
          >
            💳
          </span>

          <p>
            Carregando assinatura...
          </p>
        </div>
      </div>
    );
  }

  const funcionalidades =
    plan?.funcionalidades &&
    typeof plan.funcionalidades === "object"
      ? Object.entries(
          plan.funcionalidades,
        )
      : [];

  const funcionalidadesAtivas =
    funcionalidades.filter(
      ([, value]) =>
        typeof value === "boolean" &&
        value === true,
    );

  const limitesPlano =
    funcionalidades.filter(
      ([, value]) =>
        typeof value === "number",
    );

  return (
    <div className="subscription-page">
      <div className="subscription-header">
        <div>
          <span className="subscription-eyebrow">
            Assinatura
          </span>

          <h1>
            Minha Assinatura
          </h1>

          <p>
            Gerencie seu plano,
            pagamentos e recursos.
          </p>
        </div>

        <button
          type="button"
          className="subscription-change-button"
          onClick={() =>
            onNavigate?.(
              "/planos",
            )
          }
        >
          Alterar Plano
        </button>
      </div>

      {!subscription ? (
        <section className="subscription-empty">
          <span
            aria-hidden="true"
            className="subscription-empty__icon"
          >
            💳
          </span>

          <h2>
            Nenhuma assinatura encontrada
          </h2>

          <p>
            Este estabelecimento ainda
            não possui uma assinatura
            cadastrada.
          </p>

          <button
            type="button"
            className="subscription-change-button"
            onClick={() =>
              onNavigate?.(
                "/planos",
              )
            }
          >
            Ver Planos
          </button>
        </section>
      ) : (
        <>
          <section className="subscription-summary">
            <div className="summary-card">
              <span>
                Plano Atual
              </span>

              <h2>
                {plan?.nome ||
                  "Nenhum"}
              </h2>

              {plan?.descricao && (
                <p>
                  {plan.descricao}
                </p>
              )}
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
                Valor
              </span>

              <h2>
                {plan
                  ? formatCurrency(
                      Number(plan?.precoMensal || 0) / 100,
                    )
                  : "--"}
              </h2>

              {plan && (
                <small>
                  por mês
                </small>
              )}
            </div>
          </section>

          <section className="subscription-actions">
            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "/billing",
                )
              }
            >
              💳 Cobranças
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "/planos",
                )
              }
            >
              📋 Ver Planos
            </button>

            <button
              type="button"
              disabled
            >
              🕘 Histórico
            </button>
          </section>

          <section className="subscription-features">
  <div className="subscription-features__header">
    <div>
      <span>
        Plano {plan?.nome || ""}
      </span>

      <h2>
        Recursos Liberados
      </h2>
    </div>

    <span className="subscription-features__count">
      {funcionalidadesAtivas.length} ativos
    </span>
  </div>

  {funcionalidadesAtivas.length === 0 ? (
    <div className="subscription-features-empty">
      Nenhum recurso ativo neste plano.
    </div>
  ) : (
    <div className="subscription-features-grid">
      {funcionalidadesAtivas.map(
        ([key]) => (
          <article
            key={key}
            className="feature-item feature-item--enabled"
          >
            <span className="feature-check">
              ✔
            </span>

            <strong>
              {formatFeatureName(key)}
            </strong>
          </article>
        ),
      )}
    </div>
  )}
</section>
{limitesPlano.length > 0 && (
  <section className="subscription-limits">
    <div className="subscription-limits__header">
      <div>
        <span>
          Uso permitido
        </span>

        <h2>
          Limites do Plano
        </h2>
      </div>
    </div>

    <div className="subscription-limits-grid">
      {limitesPlano.map(
        ([key, value]) => (
          <article
            key={key}
            className="subscription-limit-item"
          >
            <span>
              {formatFeatureName(key)}
            </span>

            <strong>
              {Number(value) === -1
                ? "Ilimitado"
                : value}
            </strong>
          </article>
        ),
      )}
    </div>
  </section>
)}
        </>
      )}
    </div>
  );
}