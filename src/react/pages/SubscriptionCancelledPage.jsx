import "../styles/SubscriptionsPages.css";

export default function SubscriptionCancelledPage() {
  function navigateTo(path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <main className="subscription-feedback-page">
      <section className="subscription-feedback-card">
        <div className="subscription-feedback-icon subscription-feedback-icon--danger">
          ×
        </div>

        <span className="subscription-feedback-label">
          Assinatura não concluída
        </span>

        <h1>O pagamento não foi finalizado</h1>

        <p>
          A contratação foi cancelada ou não pôde ser processada.
          Nenhuma cobrança adicional será realizada por esta tentativa.
        </p>

        <div className="subscription-feedback-actions">
          <button
            type="button"
            className="subscription-feedback-primary"
            onClick={() => navigateTo("/planos")}
          >
            Tentar novamente
          </button>

          <button
            type="button"
            className="subscription-feedback-secondary"
            onClick={() => navigateTo("/assinatura")}
          >
            Ver assinatura
          </button>
        </div>
      </section>
    </main>
  );
}