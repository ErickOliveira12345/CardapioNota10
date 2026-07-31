import React, {
  useEffect,
  useState,
} from "react";

import DashboardCard from "../../components/superAdmin/DashboardCard.jsx";
import "../../styles/superAdminCommon.css";
import "../../styles/DashboardPage.css";

import {
  getDashboardData,
} from "../../services/superAdminService.js";

const INITIAL_DATA = {
  establishments: [],
  plans: [],
  subscriptions: [],
  payments: [],
};

function formatCurrency(value) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(Number(value) || 0);
}

function getPlanLabel(planId) {
  const plans = {
    basic: "Básico",
    intermediate: "Intermediário",
    premium: "Premium",
  };

  return plans[planId] || "Não informado";
}

export default function SuperAdminDashboardPage() {
  const [data, setData] =
    useState(INITIAL_DATA);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const dashboardData =
          await getDashboardData();

        setData({
          establishments:
            dashboardData?.establishments ||
            [],
          plans:
            dashboardData?.plans || [],
          subscriptions:
            dashboardData?.subscriptions ||
            [],
          payments:
            dashboardData?.payments || [],
        });
      } catch (dashboardError) {
        console.error(
          "Erro ao carregar dashboard:",
          dashboardError,
        );

        setError(
          "Não foi possível carregar os dados do painel.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const activeSubscriptions =
    data.subscriptions.filter(
      (subscription) =>
        subscription.status === "active",
    );

  const trialSubscriptions =
    data.subscriptions.filter(
      (subscription) =>
        subscription.status === "trial",
    );

  const activeEstablishments =
    data.establishments.filter(
      (establishment) =>
        establishment.status === "active",
    );

  const monthlyRevenue =
    data.payments
      .filter(
        (payment) =>
          payment.status === "approved",
      )
      .reduce(
        (total, payment) =>
          total +
          Number(
            payment.valor ||
              payment.amount ||
              0,
          ),
        0,
      );

  return (
    <section className="super-admin-dashboard super-admin-page">
      <div className="super-admin-page-heading">
        <div>
          <h2>
            Visão geral
          </h2>

          <p>
            Acompanhe os principais números da
            plataforma.
          </p>
        </div>
      </div>

      {error && (
        <div className="super-admin-alert super-admin-alert--error">
          {error}
        </div>
      )}

      <div className="dashboard-grid">
        <DashboardCard
          title="Estabelecimentos"
          value={data.establishments.length}
          icon="🏪"
          description={`${activeEstablishments.length} ativos`}
          loading={loading}
        />

        <DashboardCard
          title="Assinaturas ativas"
          value={activeSubscriptions.length}
          icon="📑"
          description={`${trialSubscriptions.length} em período de teste`}
          loading={loading}
        />

        <DashboardCard
          title="Planos cadastrados"
          value={data.plans.length}
          icon="💳"
          description="Planos disponíveis na plataforma"
          loading={loading}
        />

        <DashboardCard
          title="Receita registrada"
          value={formatCurrency(
            monthlyRevenue,
          )}
          icon="💰"
          description="Pagamentos aprovados"
          loading={loading}
        />
      </div>

      <div className="super-admin-panel">
        <div className="super-admin-panel__header">
          <div>
            <h3>
              Estabelecimentos recentes
            </h3>

            <p>
              Últimos estabelecimentos
              encontrados no sistema.
            </p>
          </div>
        </div>

        {loading ? (
          <p>
            Carregando estabelecimentos...
          </p>
        ) : data.establishments.length ===
          0 ? (
          <div className="super-admin-empty">
            <span>
              🏪
            </span>

            <h4>
              Nenhum estabelecimento
            </h4>

            <p>
              Ainda não há estabelecimentos
              cadastrados.
            </p>
          </div>
        ) : (
          <div className="super-admin-table-wrapper">
            <table className="super-admin-table">
              <thead>
                <tr>
                  <th>Estabelecimento</th>
                  <th>Status</th>
                  <th>Plano</th>
                  <th>Responsável</th>
                </tr>
              </thead>

              <tbody>
                {data.establishments
                  .slice(0, 5)
                  .map(
                    (establishment) => (
                      <tr
                        key={
                          establishment.id
                        }
                      >
                        <td>
                          {establishment.nome ||
                            establishment.name ||
                            "Sem nome"}
                        </td>

                        <td>
                          <span
                            className={`status-badge status-badge--${
                              establishment.status ||
                              "pending"
                            }`}
                          >
                            {establishment.status ||
                              "pending"}
                          </span>
                        </td>

                        <td>
                          {getPlanLabel(establishment.planoAtual)}
                        </td>

                        <td>
                          {establishment.responsavel?.nome ||
                            "Não informado"}
                        </td>
                      </tr>
                    ),
                  )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}