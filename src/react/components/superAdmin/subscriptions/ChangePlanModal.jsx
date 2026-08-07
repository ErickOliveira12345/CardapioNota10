import React from "react";

export function ChangePlanModal({
  subscription,
  plans,
  selectedPlanId,
  changingPlan,
  formatCurrency,
  onSelectPlan,
  onClose,
  onConfirm,
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
            event.currentTarget &&
          !changingPlan
        ) {
          onClose();
        }
      }}
    >
      <div
        className="subscription-modal subscription-modal--small"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-change-title"
      >
        <header className="subscription-modal__header">
          <div>
            <span>
              Gestão da assinatura
            </span>

            <h2 id="subscription-change-title">
              Alterar plano
            </h2>

            <p>
              {subscription.estabelecimento}
            </p>
          </div>

          <button
            type="button"
            aria-label="Fechar"
            disabled={changingPlan}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="subscription-plan-options">
          {plans
            .filter(
              (plan) =>
                plan.ativo !== false,
            )
            .map((plan) => {
              const isSelected =
                selectedPlanId === plan.id;

              return (
                <label
                  key={plan.id}
                  className={
                    isSelected
                      ? "subscription-plan-option subscription-plan-option--selected"
                      : "subscription-plan-option"
                  }
                >
                  <div>
                    <strong>
                      {plan.nome || plan.id}
                    </strong>

                    <span>
                      {formatCurrency(
                        plan.precoMensal ??
                          plan.valor ??
                          0,
                      )}
                      /mês
                    </span>
                  </div>

                  <input
                    type="radio"
                    name="subscriptionPlan"
                    value={plan.id}
                    checked={isSelected}
                    disabled={changingPlan}
                    onChange={(event) =>
                      onSelectPlan(
                        event.target.value,
                      )
                    }
                  />
                </label>
              );
            })}
        </div>

        <div className="subscription-change-warning">
          A alteração será aplicada imediatamente à
          assinatura selecionada.
        </div>

        <footer className="subscription-modal__actions">
          <button
            type="button"
            disabled={changingPlan}
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="subscription-modal__primary"
            disabled={
              changingPlan ||
              !selectedPlanId
            }
            onClick={onConfirm}
          >
            {changingPlan
              ? "Alterando..."
              : "Confirmar alteração"}
          </button>
        </footer>
      </div>
    </div>
  );
}