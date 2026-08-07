import React from "react";

export function SubscriptionFilters({
  statusFilter,
  onStatusChange,
}) {
  return (
    <div className="super-admin-filters">
      <select
        value={statusFilter}
        onChange={(event) =>
          onStatusChange(
            event.target.value,
          )
        }
      >
        <option value="all">
          Todas as assinaturas
        </option>

        <option value="active">
          Ativas
        </option>

        <option value="trial">
          Período grátis
        </option>

        <option value="overdue">
          Vencidas
        </option>

        <option value="pending">
          Pendentes
        </option>

        <option value="canceled">
          Canceladas
        </option>
      </select>
    </div>
  );
}