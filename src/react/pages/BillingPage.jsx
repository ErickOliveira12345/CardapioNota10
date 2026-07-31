function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

import { useSubscription } from "../contexts/SubscriptionContext";

import "../styles/billing.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "Não definida";
  }

  let date;

  if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "Não definida";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function getStatusInfo(status) {
  const statusMap = {
    trial: {
      label: "Período de teste",
      className: "billing-status--trial",
    },

    active: {
      label: "Assinatura ativa",
      className: "billing-status--active",
    },

    pending: {
      label: "Pagamento pendente",
      className: "billing-status--pending",
    },

    past_due: {
      label: "Pagamento atrasado",
      className: "billing-status--danger",
    },

    cancelled: {
      label: "Assinatura cancelada",
      className: "billing-status--danger",
    },

    expired: {
      label: "Assinatura expirada",
      className: "billing-status--danger",
    },
  };

  return (
    statusMap[status] || {
      label: "Sem assinatura",
      className: "billing-status--inactive",
    }
  );
}

export default function BillingPage() {
  const navigate = useNavigate();

  const {
    loading,
    subscription,
    plan,
    reloadSubscription,
  } = useSubscription();

  if (loading) {
    return (
      <main className="billing-page">
        <div className="billing-loading">
          Carregando informações da assinatura...
        </div>
      </main>
    );
  }

  if (!subscription || !plan) {
    return (
      <main className="billing-page">
        <section className="billing-empty">
          <div className="billing-empty__icon">
            💳
          </div>

          <h1>Nenhuma assinatura encontrada</h1>

          <p>
            Escolha um plano para liberar os recursos
            do Cardápio Nota10.
          </p>

          <button
            type="button"
            className="billing-primary-button"
            onClick={() => navigate("/planos")}
          >
            Ver planos disponíveis
          </button>
        </section>
      </main>
    );
  }

  const statusInfo = getStatusInfo(
    subscription.status,
  );

  const billingDate =
    subscription.nextBillingDate ||
    subscription.trialEndsAt;

  return (
    <main className="billing-page">
      <header className="billing-header">
        <div>
          <span className="billing-eyebrow">
            Assinatura
          </span>

          <h1>Plano e cobrança</h1>

          <p>
            Consulte seu plano atual, vencimento,
            recursos e informações de cobrança.
          </p>
        </div>

        <button
          type="button"
          className="billing-refresh-button"
          onClick={reloadSubscription}
        >
          Atualizar dados
        </button>
      </header>

      <section className="billing-summary-grid">
        <article className="billing-plan-card">
          <div className="billing-plan-card__header">
            <div>
              <span className="billing-card-label">
                Plano atual
              </span>

              <h2>{plan.nome}</h2>
            </div>

            <span
              className={`billing-status ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <p className="billing-plan-description">
            {plan.descricao ||
              "Plano atual do seu estabelecimento."}
          </p>

          <div className="billing-plan-price">
            <strong>
              {formatCurrency(plan.preco)}
            </strong>

            <span>/mês</span>
          </div>

          <div className="billing-plan-actions">
            <button
              type="button"
              className="billing-primary-button"
              onClick={() => navigate("/planos")}
            >
              Trocar de plano
            </button>

            <button
              type="button"
              className="billing-secondary-button"
              disabled
              title="Disponível após integrar o Mercado Pago"
            >
              Cancelar assinatura
            </button>
          </div>
        </article>

        <article className="billing-info-card">
          <span className="billing-card-label">
            Próxima cobrança
          </span>

          <strong className="billing-info-card__value">
            {formatDate(billingDate)}
          </strong>

          <p>
            {subscription.status === "trial"
              ? "Data prevista para o término do período gratuito."
              : "Data prevista para a próxima renovação."}
          </p>
        </article>

        <article className="billing-info-card">
          <span className="billing-card-label">
            Valor da assinatura
          </span>

          <strong className="billing-info-card__value">
            {formatCurrency(plan.preco)}
          </strong>

          <p>
            Cobrança recorrente mensal.
          </p>
        </article>
      </section>

      <section className="billing-content-grid">
        <article className="billing-section-card">
          <header className="billing-section-card__header">
            <div>
              <h2>Recursos do plano</h2>

              <p>
                Funcionalidades disponíveis para seu
                estabelecimento.
              </p>
            </div>
          </header>

          <div className="billing-features-grid">
            {Object.entries(plan.recursos || {}).map(
              ([resource, enabled]) => (
                <div
                  className={`billing-feature ${
                    enabled
                      ? "billing-feature--enabled"
                      : "billing-feature--disabled"
                  }`}
                  key={resource}
                >
                  <span>
                    {enabled ? "✓" : "×"}
                  </span>

                  <strong>
                    {resource.replaceAll("_", " ")}
                  </strong>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="billing-section-card">
          <header className="billing-section-card__header">
            <div>
              <h2>Limites do plano</h2>

              <p>
                Capacidade contratada atualmente.
              </p>
            </div>
          </header>

          <div className="billing-limits-list">
            <div className="billing-limit-item">
              <span>Mesas</span>

              <strong>
                {plan.limites?.mesas ?? "Ilimitado"}
              </strong>
            </div>

            <div className="billing-limit-item">
              <span>Produtos</span>

              <strong>
                {plan.limites?.produtos ??
                  "Ilimitado"}
              </strong>
            </div>

            <div className="billing-limit-item">
              <span>Usuários</span>

              <strong>
                {plan.limites?.usuarios ??
                  "Ilimitado"}
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section className="billing-section-card">
        <header className="billing-section-card__header">
          <div>
            <h2>Histórico de pagamentos</h2>

            <p>
              As cobranças do Mercado Pago aparecerão
              aqui após a integração.
            </p>
          </div>
        </header>

        <div className="billing-payments-empty">
          <span>🧾</span>

          <strong>
            Nenhum pagamento registrado
          </strong>

          <p>
            Os pagamentos aprovados, pendentes ou
            recusados serão exibidos nesta seção.
          </p>
        </div>
      </section>
    </main>
  );
}