import React, {
  useMemo,
  useState,
} from "react";

import "../../styles/superAdminCommon.css";
import "../../styles/SubscriptionsPages.css";

const INITIAL_SUBSCRIPTIONS = [
  {
    id: "sub-1",
    estabelecimento:
      "Restaurante Sabor da Casa",
    plano: "Premium",
    valor: 99.9,
    status: "active",
    vencimento: "15/08/2026",
  },
  {
    id: "sub-2",
    estabelecimento:
      "Lanchonete Central",
    plano: "Intermediário",
    valor: 59.9,
    status: "active",
    vencimento: "21/08/2026",
  },
  {
    id: "sub-3",
    estabelecimento: "Pizzaria Nota 10",
    plano: "Básico",
    valor: 39.9,
    status: "overdue",
    vencimento: "10/07/2026",
  },
  {
    id: "sub-4",
    estabelecimento: "Café da Praça",
    plano: "Básico",
    valor: 0,
    status: "trial",
    vencimento: "03/08/2026",
  },
];

const STATUS_LABELS = {
  active: "Ativa",
  overdue: "Vencida",
  trial: "Período grátis",
  canceled: "Cancelada",
  pending: "Pendente",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function SubscriptionsPage() {
  const [statusFilter, setStatusFilter] =
    useState("all");

  const subscriptions = useMemo(() => {
    if (statusFilter === "all") {
      return INITIAL_SUBSCRIPTIONS;
    }

    return INITIAL_SUBSCRIPTIONS.filter(
      (subscription) =>
        subscription.status ===
        statusFilter,
    );
  }, [statusFilter]);

  return (
    <section className="super-admin-page subscriptions-page">
      <header className="super-admin-page__header">
        <div>
          <span className="super-admin-page__eyebrow">
            Gestão de recorrência
          </span>

          <h1>Assinaturas</h1>

          <p>
            Acompanhe planos, vencimentos e
            situação das assinaturas.
          </p>
        </div>
      </header>

      <div className="super-admin-summary-grid">
        <article>
          <span>Assinaturas ativas</span>
          <strong>2</strong>
        </article>

        <article>
          <span>Em período grátis</span>
          <strong>1</strong>
        </article>

        <article>
          <span>Vencidas</span>
          <strong>1</strong>
        </article>

        <article>
          <span>Receita mensal</span>
          <strong>R$ 159,80</strong>
        </article>
      </div>

      <div className="super-admin-filters">
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value,
            )
          }
        >
          <option value="all">
            Todas as assinaturas
          </option>

          <option value="active">
            Ativas
          </option>

          <option value="trial">
            Período grátis
          </option>

          <option value="overdue">
            Vencidas
          </option>

          <option value="pending">
            Pendentes
          </option>

          <option value="canceled">
            Canceladas
          </option>
        </select>
      </div>

      <div className="super-admin-table-wrapper">
        <table className="super-admin-table">
          <thead>
            <tr>
              <th>Estabelecimento</th>
              <th>Plano</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {subscriptions.map(
              (subscription) => (
                <tr key={subscription.id}>
                  <td>
                    <strong>
                      {
                        subscription.estabelecimento
                      }
                    </strong>
                  </td>

                  <td>{subscription.plano}</td>

                  <td>
                    {formatCurrency(
                      subscription.valor,
                    )}
                  </td>

                  <td>
                    {subscription.vencimento}
                  </td>

                  <td>
                    <span
                      className={`super-admin-status super-admin-status--${subscription.status}`}
                    >
                      {
                        STATUS_LABELS[
                          subscription.status
                        ]
                      }
                    </span>
                  </td>

                  <td>
                    <div className="super-admin-actions">
                      <button type="button">
                        Detalhes
                      </button>

                      <button type="button">
                        Alterar plano
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}