import React, { useMemo, useState } from "react";
import { formatCurrency, formatDateTime, getStatus, timeSince } from "../services/formatters.js";

const filters = [
  { id: "todos", label: "Todos" },
  { id: "aguardando", label: "⏳ Aguardando" },
  { id: "preparando", label: "🍳 Preparando" },
  { id: "saindo", label: "🛵 Saindo" },
  { id: "finalizado", label: "✓ Finalizados" },
];

const statusOptions = ["aguardando", "recebido", "preparando", "saindo", "finalizado", "cancelado"];

export function AdminPage({
  orders,
  calls,
  onNavigate,
  onResetData,
  onUpdateOrderStatus,
  onMarkCallAsSeen,
}) {
  console.log("Chamados recebidos no AdminPage:", calls);
  const [filter, setFilter] = useState("todos");
  const activeCalls = calls.filter((call) => !call.visualizado);

  const stats = useMemo(
    () => ({
      total: orders.length,
      aguardando: orders.filter((order) => order.status === "aguardando").length,
      preparando: orders.filter((order) => order.status === "preparando").length,
      finalizado: orders.filter((order) => order.status === "finalizado").length,
      chamados: activeCalls.length,
    }),
    [activeCalls.length, orders],
  );

  const filteredOrders = useMemo(() => {
    function getTime(value) {
      if (!value) return 0;

      if (typeof value?.toMillis === "function") {
        return value.toMillis();
      }

      if (value instanceof Date) {
        return value.getTime();
      }

      return Number(value) || 0;
    }

    const sortedOrders = [...orders].sort(
      (a, b) => getTime(b.criadoEm) - getTime(a.criadoEm)
    );
    
    return filter === "todos"
      ? sortedOrders
      : sortedOrders.filter((order) => order.status === filter);
  }, [filter, orders]);

  function handleReset() {
    if (!window.confirm("Limpar TODOS os dados? Pedidos, chamados e sessões.")) return;
    onResetData();
  }

  return (
    <>
      <main className="admin-dashboard">
        <section>
          <div className="stats-grid">
            <StatCard kind="total" icon="📋" value={stats.total} label="Total de pedidos" />
            <StatCard kind="aguardando" icon="⏳" value={stats.aguardando} label="Aguardando" />
            <StatCard kind="preparando" icon="🍳" value={stats.preparando} label="Em preparo" />
            <StatCard kind="finalizado" icon="✓" value={stats.finalizado} label="Finalizados" />
            <StatCard kind="chamados" icon="🔔" value={stats.chamados} label="Chamados ativos" />
          </div>
        </section>

        {activeCalls.length > 0 && (
          <section className="alertas-section">
            <h2 className="section-title">🚨 Chamados de atendimento</h2>
            <div className="alertas-grid">
              {activeCalls.map((call) => (
                <div className="alerta-card" key={`${call.mesa}-${call.timestamp}`}>
                  <div className="alerta-card__pulse" />
                  <div className="alerta-card__body">
                    <span className="alerta-mesa">🔔 Mesa {call.mesa} solicita atendimento</span>
                    <span className="alerta-hora">{timeSince(call.timestamp)}</span>
                  </div>
                  <button
                    className="btn-visualizado"
                    type="button"
                    onClick={() => onMarkCallAsSeen(call.mesa, call.timestamp)}
                    
                  >
                    Marcar como atendido
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pedidos-section">
          <div className="pedidos-header">
            <h2 className="section-title" style={{ margin: 0 }}>
              📦 Pedidos
            </h2>
            <div className="filtros-pedidos" role="group" aria-label="Filtrar pedidos">
              {filters.map((item) => (
                <button
                  className={`filtro-btn ${filter === item.id ? "active" : ""}`}
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pedidos-grid">
            {filteredOrders.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state__icon" aria-hidden="true">
                  📋
                </span>
                <p>Nenhum pedido {filter !== "todos" ? "com esse status " : ""}ainda.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <AdminOrderCard
                  key={order.idPedido}
                  order={order}
                  onUpdateStatus={onUpdateOrderStatus}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function StatCard({ kind, icon, value, label }) {
  return (
    <div className={`stat-card stat-card--${kind}`}>
      <span className="stat-card__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="stat-card__body">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  );
}

function AdminOrderCard({ order, onUpdateStatus }) {
  const status = getStatus(order.status);
  const items = Array.isArray(order.itens) ? order.itens : [];

  return (
    <article className={`pedido-card-admin ${status.color.replace("status--", "card--")}`}>
      <div className="pedido-card-admin__header">
        <div className="pedido-card-admin__meta">
          <span className="admin-mesa-badge">Mesa {order.mesa}</span>
          <span className="admin-pedido-id">#{String(order.idPedido).slice(0, 8)}</span>
        </div>
        <span className={`admin-status-badge ${status.color}`}>
          {status.icon} {status.label}
        </span>
      </div>

      <ul className="admin-itens-list">
        {items.map((item) => (
          <li className="pedido-item-row" key={`${order.idPedido}-${item.id}`}>
            <span>
              {item.emoji} {item.nome}
            </span>
            <span>x{item.quantidade}</span>
            <span>{formatCurrency(Number(item.subtotal) || 0)}</span>
          </li>
        ))}
      </ul>

      <div className="pedido-card-admin__footer">
        <div className="admin-footer-meta">
          <span className="admin-hora">🕐 {formatDateTime(order.criadoEm)}</span>
          <span className="admin-total">{formatCurrency(Number(order.total) || 0)}</span>
        </div>
        <div className="admin-status-select-wrap">
          <label htmlFor={`status-${order.idPedido}`}>Alterar status:</label>
          <select
            className="admin-status-select"
            id={`status-${order.idPedido}`}
            value={order.status}
            onChange={(event) => onUpdateStatus(order.idPedido, event.target.value)}
          >
            {statusOptions.map((key) => {
              const option = getStatus(key);
              return (
                <option key={key} value={key}>
                  {option.icon} {option.label}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </article>
  );
}
