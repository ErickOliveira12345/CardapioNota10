import "../styles/SubscriptionsPages.css";

export default function SubscriptionSuccessPage() {
  function navigateTo(path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <main className="subscription-feedback-page">
      <section className="subscription-feedback-card">
        <div className="subscription-feedback-icon subscription-feedback-icon--success">
          ✓
        </div>

        <span className="subscription-feedback-label">
          Assinatura confirmada
        </span>

        <h1>Seu plano foi ativado</h1>

        <p>
          O pagamento foi confirmado e os recursos do seu plano já
          estão disponíveis para o estabelecimento.
        </p>

        <div className="subscription-feedback-info">
          <div>
            <span>Status</span>
            <strong>Ativa</strong>
          </div>

          <div>
            <span>Acesso</span>
            <strong>Liberado</strong>
          </div>
        </div>

        <div className="subscription-feedback-actions">
          <button
            type="button"
            className="subscription-feedback-primary"
            onClick={() => navigateTo("/admin")}
          >
            Acessar o sistema
          </button>

          <button
            type="button"
            className="subscription-feedback-secondary"
            onClick={() => navigateTo("/assinatura")}
          >
            Ver minha assinatura
          </button>
        </div>
      </section>
    </main>
  );
}