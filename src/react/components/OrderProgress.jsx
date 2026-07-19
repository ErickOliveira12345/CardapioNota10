import React from "react";

const STATUS_PROGRESS = {
  aguardando: {
    progress: 10,
    label: "Aguardando confirmação",
  },

  recebido: {
    progress: 30,
    label: "Pedido recebido",
  },

  preparando: {
    progress: 65,
    label: "Em preparação",
  },

  saindo: {
    progress: 90,
    label: "Saindo para entrega",
  },

  finalizado: {
    progress: 100,
    label: "Finalizado",
  },

  cancelado: {
    progress: 100,
    label: "Cancelado",
  },
};

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}

export function OrderProgress({
  status,
}) {
  const normalizedStatus =
    normalizeStatus(status);

  const currentStatus =
    STATUS_PROGRESS[
      normalizedStatus
    ] || {
      progress: 0,
      label: "Status desconhecido",
    };

  return (
    <div className="order-progress">
      <div className="order-progress__header">
        <strong>
          {currentStatus.label}
        </strong>

        <span>
          {currentStatus.progress}%
        </span>
      </div>

      <div
        className="order-progress__track"
        aria-label={
          `Progresso do pedido: ` +
          `${currentStatus.progress}%`
        }
      >
        <span
          className={
            `order-progress__bar ` +
            `order-progress__bar--${normalizedStatus}`
          }
          style={{
            width:
              `${currentStatus.progress}%`,
          }}
        />
      </div>
    </div>
  );
}