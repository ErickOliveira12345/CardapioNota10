import React from "react";

export function SubscriptionSummary({
  summary,
  formatCurrency,
}) {
  return (
    <div className="super-admin-summary-grid">
      <article>
        <span>Assinaturas ativas</span>
        <strong>{summary.active}</strong>
      </article>

      <article>
        <span>Em período grátis</span>
        <strong>{summary.trial}</strong>
      </article>

      <article>
        <span>Vencidas</span>
        <strong>{summary.overdue}</strong>
      </article>

      <article>
        <span>Receita mensal</span>

        <strong>
          {formatCurrency(
            summary.monthlyRevenue,
          )}
        </strong>
      </article>
    </div>
  );
}