import "../styles/SubscriptionsPages.css";

export default function SubscriptionPendingPage() {
  function navigateTo(path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <main className="subscription-feedback-page">
      <section className="subscription-feedback-card">
        <div className="subscription-feedback-icon subscription-feedback-icon--pending">
          ⏳
        </div>

        <span className="subscription-feedback-label">
          Pagamento pendente
        </span>

        <h1>Estamos aguardando a confirmação</h1>

        <p>
          O pagamento foi iniciado, mas ainda não foi confirmado.
          Assim que recebermos a atualização, sua assinatura será
          ativada automaticamente.
        </p>

        <div className="subscription-feedback-alert">
          Alguns meios de pagamento podem levar alguns minutos para
          serem processados.
        </div>

        <div className="subscription-feedback-actions">
          <button
            type="button"
            className="subscription-feedback-primary"
            onClick={() => navigateTo("/assinatura")}
          >
            Consultar assinatura
          </button>

          <button
            type="button"
            className="subscription-feedback-secondary"
            onClick={() => window.location.reload()}
          >
            Atualizar página
          </button>
        </div>
      </section>
    </main>
  );
}