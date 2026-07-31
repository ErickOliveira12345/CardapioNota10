import "../styles/SubscriptionsPages.css";

export default function SubscriptionRequiredPage() {
  function navigateTo(path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <main className="subscription-feedback-page">
      <section className="subscription-feedback-card">
        <div className="subscription-feedback-icon subscription-feedback-icon--warning">
          !
        </div>

        <span className="subscription-feedback-label">
          Assinatura necessária
        </span>

        <h1>Escolha um plano para continuar</h1>

        <p>
          Seu estabelecimento ainda não possui uma assinatura ativa.
          Escolha um plano para liberar os recursos do Cardápio Nota10.
        </p>

        <div className="subscription-feedback-actions">
          <button
            type="button"
            className="subscription-feedback-primary"
            onClick={() => navigateTo("/planos")}
          >
            Conhecer os planos
          </button>

          <button
            type="button"
            className="subscription-feedback-secondary"
            onClick={() => navigateTo("/")}
          >
            Voltar ao início
          </button>
        </div>
      </section>
    </main>
  );
}