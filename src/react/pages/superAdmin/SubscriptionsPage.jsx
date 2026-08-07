import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAllEstablishments,
  getAllPlans,
  getAllSubscriptions,
  updateSubscriptionPlan,
} from "../../services/superAdminService.js";

import {
  SubscriptionSummary,
} from "../../components/superAdmin/subscriptions/SubscriptionSummary.jsx";

import {
  SubscriptionFilters,
} from "../../components/superAdmin/subscriptions/SubscriptionFilters.jsx";

import {
  SubscriptionTable,
} from "../../components/superAdmin/subscriptions/SubscriptionTable.jsx";

import {
  SubscriptionDetailsModal,
} from "../../components/superAdmin/subscriptions/SubscriptionDetailsModal.jsx";

import {
  ChangePlanModal,
} from "../../components/superAdmin/subscriptions/ChangePlanModal.jsx";

import "../../styles/superAdminCommon.css";
import "../../styles/SubscriptionsPages.css";

const STATUS_LABELS = {
  active: "Ativa",
  overdue: "Vencida",
  trial: "Período grátis",
  canceled: "Cancelada",
  pending: "Pendente",
};

function formatCurrency(value) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(
    Number(value || 0) / 100,
  );
}

function formatDate(value) {
  if (!value) {
    return "Não informado";
  }

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(date);
}

export default function SubscriptionsPage() {
  const [
    subscriptionsData,
    setSubscriptionsData,
  ] = useState([]);

  const [
    establishments,
    setEstablishments,
  ] = useState([]);

  const [plans, setPlans] =
    useState([]);

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    selectedSubscription,
    setSelectedSubscription,
  ] = useState(null);

  const [
    subscriptionToChange,
    setSubscriptionToChange,
  ] = useState(null);

  const [
    selectedPlanId,
    setSelectedPlanId,
  ] = useState("");

  const [
    changingPlan,
    setChangingPlan,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    actionSuccess,
    setActionSuccess,
  ] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSubscriptionsPage() {
      try {
        setLoading(true);
        setError("");

        const [
          subscriptionsResult,
          establishmentsResult,
          plansResult,
        ] = await Promise.all([
          getAllSubscriptions(),
          getAllEstablishments(),
          getAllPlans(),
        ]);

        if (!mounted) {
          return;
        }

        setSubscriptionsData(
          subscriptionsResult,
        );

        setEstablishments(
          establishmentsResult,
        );

        setPlans(plansResult);
      } catch (loadError) {
        console.error(
          "Erro ao carregar assinaturas:",
          loadError,
        );

        if (mounted) {
          setError(
            loadError?.message ||
              "Não foi possível carregar as assinaturas.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSubscriptionsPage();

    return () => {
      mounted = false;
    };
  }, []);

  const establishmentsMap =
    useMemo(() => {
      return new Map(
        establishments.map(
          (establishment) => [
            establishment.id,
            establishment,
          ],
        ),
      );
    }, [establishments]);

  const plansMap =
    useMemo(() => {
      return new Map(
        plans.map((plan) => [
          plan.id,
          plan,
        ]),
      );
    }, [plans]);

  const subscriptions =
    useMemo(() => {
      const normalizedSubscriptions =
        subscriptionsData.map(
          (subscription) => {
            const establishment =
              establishmentsMap.get(
                subscription.establishmentId,
              );

            const plan =
              plansMap.get(
                subscription.planId,
              );

            return {
              ...subscription,

              estabelecimento:
                establishment?.nome ||
                "Estabelecimento não encontrado",

              plano:
                plan?.nome ||
                subscription.planName ||
                subscription.planId ||
                "Plano não identificado",

              valor: Number(
                subscription.valorAtual ??
                  plan?.precoMensal ??
                  0,
              ),

              vencimento:
                subscription
                  .proximaCobrancaEm ||
                subscription
                  .periodoTeste?.fim ||
                null,
            };
          },
        );

      if (statusFilter === "all") {
        return normalizedSubscriptions;
      }

      return normalizedSubscriptions.filter(
        (subscription) =>
          subscription.status ===
          statusFilter,
      );
    }, [
      subscriptionsData,
      establishmentsMap,
      plansMap,
      statusFilter,
    ]);

  const summary =
    useMemo(() => {
      const active =
        subscriptionsData.filter(
          (subscription) =>
            subscription.status ===
            "active",
        ).length;

      const trial =
        subscriptionsData.filter(
          (subscription) =>
            subscription.status ===
            "trial",
        ).length;

      const overdue =
        subscriptionsData.filter(
          (subscription) =>
            subscription.status ===
            "overdue",
        ).length;

      const monthlyRevenue =
        subscriptionsData
          .filter(
            (subscription) =>
              subscription.status ===
              "active",
          )
          .reduce(
            (total, subscription) =>
              total +
              Number(
                subscription.valorAtual ||
                  0,
              ),
            0,
          );

      return {
        active,
        trial,
        overdue,
        monthlyRevenue,
      };
    }, [subscriptionsData]);

  function handleOpenDetails(
    subscription,
  ) {
    setActionError("");
    setActionSuccess("");

    setSelectedSubscription(
      subscription,
    );
  }

  function handleOpenChangePlan(
    subscription,
  ) {
    setActionError("");
    setActionSuccess("");

    setSubscriptionToChange(
      subscription,
    );

    setSelectedPlanId(
      subscription.planId || "",
    );
  }

  function handleCloseDetails() {
    setSelectedSubscription(null);
  }

  function handleCloseChangePlan() {
    if (changingPlan) {
      return;
    }

    setSubscriptionToChange(null);
    setSelectedPlanId("");
  }

  async function handleConfirmChangePlan() {
    if (!subscriptionToChange?.id) {
      setActionError(
        "Assinatura selecionada inválida.",
      );

      return;
    }

    if (!selectedPlanId) {
      setActionError(
        "Selecione um plano.",
      );

      return;
    }

    const selectedPlan =
      plans.find(
        (plan) =>
          plan.id === selectedPlanId,
      );

    if (!selectedPlan) {
      setActionError(
        "Plano selecionado não encontrado.",
      );

      return;
    }

    try {
      setChangingPlan(true);
      setActionError("");
      setActionSuccess("");

      const selectedPlanValue =
        Number(
          selectedPlan.precoMensal ??
            selectedPlan.valor ??
            0,
        );

      const updatedSubscription =
        await updateSubscriptionPlan({
          subscriptionId:
            subscriptionToChange.id,

          planId:
            selectedPlan.id,

          planName:
            selectedPlan.nome ||
            selectedPlan.name ||
            selectedPlan.id,

          valorAtual:
            selectedPlanValue,

          proximoValor:
            selectedPlanValue,
        });

      setSubscriptionsData(
        (currentSubscriptions) =>
          currentSubscriptions.map(
            (subscription) =>
              subscription.id ===
              updatedSubscription.id
                ? updatedSubscription
                : subscription,
          ),
      );

      setSubscriptionToChange(null);
      setSelectedPlanId("");

      setActionSuccess(
        `Plano alterado para "${
          selectedPlan.nome ||
          selectedPlan.id
        }" com sucesso.`,
      );
    } catch (changeError) {
      console.error(
        "Erro ao alterar plano:",
        changeError,
      );

      setActionError(
        changeError?.message ||
          "Não foi possível alterar o plano.",
      );
    } finally {
      setChangingPlan(false);
    }
  }

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

      {error && (
        <div className="super-admin-alert super-admin-alert--error">
          {error}
        </div>
      )}

      {actionError && (
        <div className="super-admin-alert super-admin-alert--error">
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="super-admin-alert super-admin-alert--success">
          {actionSuccess}
        </div>
      )}

      <SubscriptionSummary
        summary={summary}
        formatCurrency={formatCurrency}
      />

      <SubscriptionFilters
        statusFilter={statusFilter}
        onStatusChange={
          setStatusFilter
        }
      />

      <SubscriptionTable
        subscriptions={subscriptions}
        loading={loading}
        statusLabels={STATUS_LABELS}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onOpenDetails={
          handleOpenDetails
        }
        onOpenChangePlan={
          handleOpenChangePlan
        }
      />

      <SubscriptionDetailsModal
        subscription={
          selectedSubscription
        }
        statusLabels={STATUS_LABELS}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onClose={handleCloseDetails}
        onChangePlan={(subscription) => {
          setSelectedSubscription(null);
          handleOpenChangePlan(
            subscription,
          );
        }}
      />

      <ChangePlanModal
        subscription={
          subscriptionToChange
        }
        plans={plans}
        selectedPlanId={
          selectedPlanId
        }
        changingPlan={changingPlan}
        formatCurrency={formatCurrency}
        onSelectPlan={
          setSelectedPlanId
        }
        onClose={
          handleCloseChangePlan
        }
        onConfirm={
          handleConfirmChangePlan
        }
      />
    </section>
  );
}