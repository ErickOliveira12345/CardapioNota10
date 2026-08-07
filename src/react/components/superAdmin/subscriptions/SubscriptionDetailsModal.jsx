import React from "react";

export function SubscriptionDetailsModal({
  subscription,
  statusLabels,
  formatCurrency,
  formatDate,
  onClose,
  onChangePlan,
}) {
  if (!subscription) {
    return null;
  }

  return (
    <div
      className="subscription-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="subscription-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-details-title"
      >
        <header className="subscription-modal__header">
          <div>
            <span>
              Informações da assinatura
            </span>

            <h2 id="subscription-details-title">
              Detalhes
            </h2>
          </div>

          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="subscription-details-grid">
          <div>
            <span>Estabelecimento</span>
            <strong>
              {subscription.estabelecimento}
            </strong>
          </div>

          <div>
            <span>Plano atual</span>
            <strong>
              {subscription.plano}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong>
              {statusLabels[
                subscription.status
              ] ||
                subscription.status ||
                "Não informado"}
            </strong>
          </div>

          <div>
            <span>Valor atual</span>
            <strong>
              {formatCurrency(
                subscription.valor,
              )}
            </strong>
          </div>

          <div>
            <span>Próximo valor</span>
            <strong>
              {formatCurrency(
                subscription.proximoValor,
              )}
            </strong>
          </div>

          <div>
            <span>Próxima cobrança</span>
            <strong>
              {formatDate(
                subscription.proximaCobrancaEm,
              )}
            </strong>
          </div>

          <div>
            <span>Início do teste</span>
            <strong>
              {formatDate(
                subscription.periodoTeste
                  ?.inicio,
              )}
            </strong>
          </div>

          <div>
            <span>Fim do teste</span>
            <strong>
              {formatDate(
                subscription.periodoTeste
                  ?.fim,
              )}
            </strong>
          </div>

          <div>
            <span>Renovação automática</span>
            <strong>
              {subscription.renovacaoAutomatica
                ? "Ativada"
                : "Desativada"}
            </strong>
          </div>

          <div>
            <span>ID da assinatura</span>
            <code>{subscription.id}</code>
          </div>
        </div>

        <footer className="subscription-modal__actions">
          <button
            type="button"
            onClick={onClose}
          >
            Fechar
          </button>

          <button
            type="button"
            className="subscription-modal__primary"
            onClick={() =>
              onChangePlan(subscription)
            }
          >
            Alterar plano
          </button>
        </footer>
      </div>
    </div>
  );
}