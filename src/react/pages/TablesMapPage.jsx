import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuth,
} from "../contexts/AuthContext.jsx";

import {
  observeTables,
} from "../services/tableService.js";

import {
  observeOrders,
} from "../services/orders.js";

import {
  formatCurrency,
} from "../services/formatters.js";

import {
  showToast,
} from "../services/toast.js";

import {
  getOrderElapsedMinutes,
} from "../components/OrderTimer.jsx";

const TABLE_STATUS_CONFIG = {
  inactive: {
    label: "Inativa",
    icon: "⚫",
    className: "inactive",
  },

  free: {
    label: "Livre",
    icon: "🟢",
    className: "free",
  },

  occupied: {
    label: "Pedido em andamento",
    icon: "🟡",
    className: "occupied",
  },

  delayed: {
    label: "Pedido atrasado",
    icon: "🔴",
    className: "delayed",
  },

  ready: {
    label: "Pedido pronto",
    icon: "🟣",
    className: "ready",
  },

  finishing: {
    label: "Aguardando finalização",
    icon: "⚫",
    className: "finishing",
  },
};

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}

function normalizeTableNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function getOrderId(order) {
  return order.idPedido || order.id;
}

function getOrderCreationTime(order) {
  if (
    order?.criadoEm &&
    typeof order.criadoEm.toMillis ===
      "function"
  ) {
    return order.criadoEm.toMillis();
  }

  if (
    typeof order?.criadoEm?.seconds ===
      "number"
  ) {
    return (
      order.criadoEm.seconds * 1000
    );
  }

  return (
    Number(order?.criadoEmMs) ||
    Number(order?.createdAt) ||
    0
  );
}

function getTableOrders(
  table,
  orders,
) {
  const tableNumber =
    normalizeTableNumber(
      table.numero,
    );

  if (tableNumber === null) {
    return [];
  }

  return orders
    .filter(
      (order) =>
        normalizeTableNumber(
          order.mesa,
        ) === tableNumber,
    )
    .sort(
      (
        firstOrder,
        secondOrder,
      ) =>
        getOrderCreationTime(
          firstOrder,
        ) -
        getOrderCreationTime(
          secondOrder,
        ),
    );
}

function getTableOperationalStatus(
  table,
  tableOrders,
) {
  if (table.ativa === false) {
    return TABLE_STATUS_CONFIG.inactive;
  }

  const activeOrders =
    tableOrders.filter((order) =>
      [
        "aguardando",
        "recebido",
        "preparando",
        "saindo",
      ].includes(
        normalizeStatus(
          order.status,
        ),
      ),
    );

  if (activeOrders.length === 0) {
    return TABLE_STATUS_CONFIG.free;
  }

  const hasDelayedOrder =
    activeOrders.some(
      (order) =>
        [
          "aguardando",
          "recebido",
          "preparando",
        ].includes(
          normalizeStatus(
            order.status,
          ),
        ) &&
        getOrderElapsedMinutes(
          order,
        ) >= 20,
    );

  if (hasDelayedOrder) {
    return TABLE_STATUS_CONFIG.delayed;
  }

  const hasReadyOrder =
    activeOrders.some(
      (order) =>
        normalizeStatus(
          order.status,
        ) === "saindo",
    );

  if (hasReadyOrder) {
    return TABLE_STATUS_CONFIG.ready;
  }

  const hasFinishingOrder =
    activeOrders.some(
      (order) =>
        normalizeStatus(
          order.status,
        ) === "recebido",
    );

  if (hasFinishingOrder) {
    return TABLE_STATUS_CONFIG.finishing;
  }

  return TABLE_STATUS_CONFIG.occupied;
}

function getTableTotal(tableOrders) {
  return tableOrders
    .filter(
      (order) =>
        ![
          "cancelado",
          "finalizado",
        ].includes(
          normalizeStatus(
            order.status,
          ),
        ),
    )
    .reduce(
      (total, order) =>
        total +
        Number(order.total || 0),
      0,
    );
}

export function TablesMapPage({
  onNavigate,
}) {
  const {
    establishmentId,
  } = useAuth();

  const [tables, setTables] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [
    loadingTables,
    setLoadingTables,
  ] = useState(true);

  const [
    loadingOrders,
    setLoadingOrders,
  ] = useState(true);

  const [, setClockTick] =
    useState(Date.now());

  useEffect(() => {
    const intervalId =
      window.setInterval(() => {
        setClockTick(Date.now());
      }, 30000);

    return () => {
      window.clearInterval(
        intervalId,
      );
    };
  }, []);

  useEffect(() => {
    if (!establishmentId) {
      setTables([]);
      setLoadingTables(false);

      return undefined;
    }

    const unsubscribe =
      observeTables(
        establishmentId,

        (firebaseTables) => {
          setTables(
            Array.isArray(
              firebaseTables,
            )
              ? firebaseTables
              : [],
          );

          setLoadingTables(false);
        },

        (error) => {
          console.error(
            "Erro ao carregar mapa de mesas:",
            error,
          );

          setLoadingTables(false);

          showToast(
            "Não foi possível carregar as mesas.",
            "error",
          );
        },
      );

    return () => {
      if (
        typeof unsubscribe ===
        "function"
      ) {
        unsubscribe();
      }
    };
  }, [
    establishmentId,
  ]);

  useEffect(() => {
    if (!establishmentId) {
      setOrders([]);
      setLoadingOrders(false);

      return undefined;
    }

    const unsubscribe =
      observeOrders(
        (firebaseOrders) => {
          setOrders(
            Array.isArray(
              firebaseOrders,
            )
              ? firebaseOrders
              : [],
          );

          setLoadingOrders(false);
        },

        (error) => {
          console.error(
            "Erro ao carregar pedidos do mapa:",
            error,
          );

          setLoadingOrders(false);

          showToast(
            "Não foi possível carregar os pedidos.",
            "error",
          );
        },

        establishmentId,
      );

    return () => {
      if (
        typeof unsubscribe ===
        "function"
      ) {
        unsubscribe();
      }
    };
  }, [
    establishmentId,
  ]);

  const mappedTables =
    useMemo(() => {
      return tables.map((table) => {
        const tableOrders =
          getTableOrders(
            table,
            orders,
          );

        const status =
          getTableOperationalStatus(
            table,
            tableOrders,
          );

        const activeOrders =
          tableOrders.filter(
            (order) =>
              ![
                "cancelado",
                "finalizado",
              ].includes(
                normalizeStatus(
                  order.status,
                ),
              ),
          );

        const oldestActiveOrder =
          activeOrders[0] || null;

        return {
          ...table,
          status,
          activeOrders,
          activeOrdersCount:
            activeOrders.length,
          total:
            getTableTotal(
              tableOrders,
            ),
          oldestActiveOrder,
        };
      });
    }, [
      tables,
      orders,
    ]);

  const summary =
    useMemo(() => {
      return mappedTables.reduce(
        (result, table) => {
          const status =
            table.status.className;

          result.total += 1;

          if (
            Object.prototype.hasOwnProperty.call(
              result,
              status,
            )
          ) {
            result[status] += 1;
          }

          return result;
        },
        {
          total: 0,
          free: 0,
          occupied: 0,
          delayed: 0,
          ready: 0,
          finishing: 0,
          inactive: 0,
        },
      );
    }, [
      mappedTables,
    ]);

  const isLoading =
    loadingTables ||
    loadingOrders;

  function openOrders(table) {
    const firstOrder =
      table.activeOrders[0];

    if (!firstOrder) {
      return;
    }

    onNavigate?.(
      "/admin/pedidos",
    );
  }

  if (isLoading) {
    return (
      <main className="admin-main">
        <section className="empty-state">
          <span
            className="empty-state__icon"
            aria-hidden="true"
          >
            🗺️
          </span>

          <p>
            Carregando mapa de mesas...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-main tables-map-page">
      <section className="admin-page-header">
        <div>
          <h1>Mapa de mesas</h1>

          <p>
            Acompanhe a situação de cada
            mesa em tempo real.
          </p>
        </div>

        <button
          type="button"
          className="category-action-btn"
          onClick={() =>
            onNavigate?.(
              "/admin/mesas",
            )
          }
        >
          Gerenciar mesas
        </button>
      </section>

      <section className="tables-map-summary">
        <article>
          <span>Total</span>
          <strong>{summary.total}</strong>
        </article>

        <article className="tables-map-summary--free">
          <span>Livres</span>
          <strong>{summary.free}</strong>
        </article>

        <article className="tables-map-summary--occupied">
          <span>Em atendimento</span>
          <strong>{summary.occupied}</strong>
        </article>

        <article className="tables-map-summary--delayed">
          <span>Atrasadas</span>
          <strong>{summary.delayed}</strong>
        </article>

        <article className="tables-map-summary--ready">
          <span>Prontas</span>
          <strong>{summary.ready}</strong>
        </article>

        <article className="tables-map-summary--inactive">
          <span>Inativas</span>
          <strong>{summary.inactive}</strong>
        </article>
      </section>

      <section className="tables-map-legend">
        {Object.entries(
          TABLE_STATUS_CONFIG,
        ).map(
          ([key, status]) => (
            <span key={key}>
              <i
                className={
                  `tables-map-legend__dot ` +
                  `tables-map-legend__dot--${status.className}`
                }
              />

              {status.label}
            </span>
          ),
        )}
      </section>

      {mappedTables.length === 0 ? (
        <section className="empty-state">
          <span
            className="empty-state__icon"
            aria-hidden="true"
          >
            🪑
          </span>

          <p>
            Nenhuma mesa cadastrada.
          </p>

          <button
            type="button"
            className="btn-finalizar"
            onClick={() =>
              onNavigate?.(
                "/admin/mesas",
              )
            }
          >
            Cadastrar mesa
          </button>
        </section>
      ) : (
        <section className="tables-map-grid">
          {mappedTables.map(
            (table) => {
              const status =
                table.status;

              const elapsedMinutes =
                table.oldestActiveOrder
                  ? getOrderElapsedMinutes(
                      table.oldestActiveOrder,
                    )
                  : 0;

              return (
                <article
                  className={
                    `tables-map-card ` +
                    `tables-map-card--${status.className}`
                  }
                  key={table.id}
                >
                  <header className="tables-map-card__header">
                    <div>
                      <span
                        className="tables-map-card__icon"
                        aria-hidden="true"
                      >
                        {status.icon}
                      </span>

                      <div>
                        <strong>
                          Mesa {table.numero}
                        </strong>

                        <small>
                          {table.nome ||
                            `Mesa ${table.numero}`}
                        </small>
                      </div>
                    </div>

                    <span className="tables-map-card__status">
                      {status.label}
                    </span>
                  </header>

                  <div className="tables-map-card__content">
                    <div>
                      <span>
                        Pedidos ativos
                      </span>

                      <strong>
                        {
                          table.activeOrdersCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Consumo atual
                      </span>

                      <strong>
                        {formatCurrency(
                          table.total,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Tempo de espera
                      </span>

                      <strong>
                        {table.oldestActiveOrder
                          ? `${Math.floor(
                              elapsedMinutes,
                            )} min`
                          : "--"}
                      </strong>
                    </div>
                  </div>

                  {table.descricao && (
                    <p className="tables-map-card__description">
                      {table.descricao}
                    </p>
                  )}

                  <footer className="tables-map-card__footer">
                    {table.activeOrdersCount >
                    0 ? (
                      <button
                        type="button"
                        className="category-action-btn"
                        onClick={() =>
                          openOrders(table)
                        }
                      >
                        Ver pedidos
                      </button>
                    ) : (
                      <span>
                        Aguardando cliente
                      </span>
                    )}
                  </footer>
                </article>
              );
            },
          )}
        </section>
      )}
    </main>
  );
}
