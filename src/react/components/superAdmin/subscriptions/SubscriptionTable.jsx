import React from "react";

export function SubscriptionTable({
  subscriptions,
  loading,
  statusLabels,
  formatCurrency,
  formatDate,
  onOpenDetails,
  onOpenChangePlan,
}) {
  if (loading) {
    return (
      <div className="super-admin-loading">
        Carregando assinaturas...
      </div>
    );
  }

  return (
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
          {subscriptions.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                className="super-admin-table__empty"
              >
                Nenhuma assinatura encontrada.
              </td>
            </tr>
          ) : (
            subscriptions.map(
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
                    {formatDate(
                      subscription.vencimento,
                    )}
                  </td>

                  <td>
                    <span
                      className={`super-admin-status super-admin-status--${subscription.status}`}
                    >
                      {statusLabels[
                        subscription.status
                      ] ||
                        subscription.status ||
                        "Não informado"}
                    </span>
                  </td>

                  <td>
                    <div className="super-admin-actions">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenDetails(
                            subscription,
                          )
                        }
                      >
                        Detalhes
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onOpenChangePlan(
                            subscription,
                          )
                        }
                      >
                        Alterar plano
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )
          )}
        </tbody>
      </table>
    </div>
  );
}