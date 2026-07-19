import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuth,
} from "../contexts/AuthContext.jsx";

import {
  observeOrders,
  updateOrderStatus,
} from "../services/orders.js";

import {
  formatCurrency,
  formatTime,
  timeSince,
} from "../services/formatters.js";

import {
  showToast,
} from "../services/toast.js";

import {
  OrderTimer,
  getOrderElapsedMinutes,
} from "../components/OrderTimer.jsx";

import {
  OrderProgress,
} from "../components/OrderProgress.jsx";

const KITCHEN_COLUMNS = [
  {
    id: "novos",
    title: "Novos pedidos",
    icon: "🔔",
    statuses: [
      "aguardando",
      "recebido",
    ],
  },
  {
    id: "preparando",
    title: "Em preparo",
    icon: "🍳",
    statuses: [
      "preparando",
    ],
  },
  {
    id: "prontos",
    title: "Prontos",
    icon: "✅",
    statuses: [
      "saindo",
    ],
  },
];

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}

function getTimestampMilliseconds(value) {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value.seconds === "number"
  ) {
    return value.seconds * 1000;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  const parsedValue =
    new Date(value).getTime();

  return Number.isFinite(parsedValue)
    ? parsedValue
    : 0;
}

function getOrderCreationTime(order) {
  return (
    getTimestampMilliseconds(
      order?.criadoEm,
    ) ||
    Number(order?.criadoEmMs) ||
    Number(order?.createdAt) ||
    0
  );
}

function isKitchenActiveStatus(status) {
  return [
    "aguardando",
    "recebido",
    "preparando",
    "saindo",
  ].includes(normalizeStatus(status));
}

export function KitchenPage() {
  const {
    establishmentId,
  } = useAuth();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] = useState(null);

  const [
    clockTick,
    setClockTick,
  ] = useState(Date.now());

  useEffect(() => {
    const intervalId =
      window.setInterval(() => {
        setClockTick(Date.now());
      }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!establishmentId) {
      setOrders([]);
      setLoading(false);

      return undefined;
    }

    const unsubscribe = observeOrders(
      (firebaseOrders) => {
        setOrders(
          Array.isArray(firebaseOrders)
            ? firebaseOrders
            : [],
        );

        setLoading(false);
      },

      (error) => {
        console.error(
          "Erro ao carregar pedidos da cozinha:",
          error,
        );

        setLoading(false);

        showToast(
          "Não foi possível carregar os pedidos da cozinha.",
          "error",
          5000,
        );
      },

      establishmentId,
    );

    return () => {
      if (
        typeof unsubscribe === "function"
      ) {
        unsubscribe();
      }
    };
  }, [
    establishmentId,
  ]);

  const activeOrders = useMemo(() => {
    return [...orders]
      .filter((order) =>
        isKitchenActiveStatus(
          order.status,
        ),
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
  }, [
    orders,
  ]);

  const delayedOrders =
    useMemo(() => {
      return activeOrders.filter(
        (order) => {
          const status =
            normalizeStatus(
              order.status,
            );

          const canBeDelayed = [
            "aguardando",
            "recebido",
            "preparando",
          ].includes(status);

          return (
            canBeDelayed &&
            getOrderElapsedMinutes(
              order,
            ) >= 20
          );
        },
      );
    }, [
      activeOrders,
      clockTick,
    ]);

  const criticalOrders =
    useMemo(() => {
      return delayedOrders.filter(
        (order) =>
          getOrderElapsedMinutes(
            order,
          ) >= 30,
      );
    }, [
      delayedOrders,
      clockTick,
    ]);

  const preparingOrdersCount =
    useMemo(
      () =>
        activeOrders.filter(
          (order) =>
            normalizeStatus(
              order.status,
            ) === "preparando",
        ).length,
      [
        activeOrders,
      ],
    );

  function getOrdersByColumn(column) {
    return activeOrders.filter(
      (order) =>
        column.statuses.includes(
          normalizeStatus(
            order.status,
          ),
        ),
    );
  }

  async function changeStatus(
    order,
    nextStatus,
  ) {
    const orderId =
      order.idPedido || order.id;

    if (
      !establishmentId ||
      !orderId ||
      updatingOrderId
    ) {
      return;
    }

    try {
      setUpdatingOrderId(orderId);

      await updateOrderStatus(
        orderId,
        nextStatus,
        establishmentId,
      );

      showToast(
        `Pedido da Mesa ${order.mesa} atualizado.`,
        "success",
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar pedido da cozinha:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível atualizar o pedido.",
        "error",
        5000,
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function renderOrderAction(order) {
    const status =
      normalizeStatus(
        order.status,
      );

    const orderId =
      order.idPedido || order.id;

    const isUpdating =
      updatingOrderId === orderId;

    if (
      status === "aguardando" ||
      status === "recebido"
    ) {
      return (
        <button
          type="button"
          className="kitchen-action-button kitchen-action-button--prepare"
          disabled={isUpdating}
          onClick={() =>
            changeStatus(
              order,
              "preparando",
            )
          }
        >
          {isUpdating
            ? "Atualizando..."
            : "🍳 Iniciar preparo"}
        </button>
      );
    }

    if (status === "preparando") {
      return (
        <button
          type="button"
          className="kitchen-action-button kitchen-action-button--ready"
          disabled={isUpdating}
          onClick={() =>
            changeStatus(
              order,
              "saindo",
            )
          }
        >
          {isUpdating
            ? "Atualizando..."
            : "✅ Marcar como pronto"}
        </button>
      );
    }

    if (status === "saindo") {
      return (
        <button
          type="button"
          className="kitchen-action-button kitchen-action-button--finish"
          disabled={isUpdating}
          onClick={() =>
            changeStatus(
              order,
              "finalizado",
            )
          }
        >
          {isUpdating
            ? "Atualizando..."
            : "✓ Pedido entregue"}
        </button>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <main className="kitchen-page">
        <section className="empty-state">
          <span
            className="empty-state__icon"
            aria-hidden="true"
          >
            🍳
          </span>

          <p>
            Carregando pedidos da cozinha...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="kitchen-page">
      <section className="admin-page-header">
        <div>
          <h1>Tela da cozinha</h1>

          <p>
            Acompanhe e atualize os pedidos
            em tempo real.
          </p>
        </div>

        <div className="kitchen-header-summary">
          <strong>
            {activeOrders.length}
          </strong>

          <span>
            pedidos ativos
          </span>
        </div>
      </section>

      <section className="kitchen-summary">
        <article className="kitchen-summary__card">
          <span>Pedidos ativos</span>

          <strong>
            {activeOrders.length}
          </strong>
        </article>

        <article className="kitchen-summary__card">
          <span>Em preparo</span>

          <strong>
            {preparingOrdersCount}
          </strong>
        </article>

        <article className="kitchen-summary__card kitchen-summary__card--warning">
          <span>Atrasados</span>

          <strong>
            {delayedOrders.length}
          </strong>
        </article>

        <article className="kitchen-summary__card kitchen-summary__card--danger">
          <span>Críticos</span>

          <strong>
            {criticalOrders.length}
          </strong>
        </article>
      </section>

      {delayedOrders.length > 0 && (
        <section
          className={
            criticalOrders.length > 0
              ? "kitchen-delay-alert kitchen-delay-alert--critical"
              : "kitchen-delay-alert"
          }
        >
          <div className="kitchen-delay-alert__icon">
            {criticalOrders.length > 0
              ? "🚨"
              : "⏱️"}
          </div>

          <div className="kitchen-delay-alert__content">
            <strong>
              {criticalOrders.length > 0
                ? "Existem pedidos com atraso crítico"
                : "Atenção aos pedidos atrasados"}
            </strong>

            <p>
              {delayedOrders.length}{" "}
              {delayedOrders.length === 1
                ? "pedido está"
                : "pedidos estão"}{" "}
              há mais de 20 minutos em
              atendimento.
            </p>
          </div>

          <div className="kitchen-delay-alert__count">
            {delayedOrders.length}
          </div>
        </section>
      )}

      <section className="kitchen-board">
        {KITCHEN_COLUMNS.map(
          (column) => {
            const columnOrders =
              getOrdersByColumn(
                column,
              );

            return (
              <section
                className={
                  `kitchen-column ` +
                  `kitchen-column--${column.id}`
                }
                key={column.id}
              >
                <header className="kitchen-column__header">
                  <div>
                    <span
                      aria-hidden="true"
                    >
                      {column.icon}
                    </span>

                    <h2>
                      {column.title}
                    </h2>
                  </div>

                  <span className="kitchen-column__count">
                    {columnOrders.length}
                  </span>
                </header>

                <div className="kitchen-column__orders">
                  {columnOrders.length ===
                  0 ? (
                    <div className="kitchen-column__empty">
                      Nenhum pedido nesta etapa.
                    </div>
                  ) : (
                    columnOrders.map(
                      (order) => (
                        <KitchenOrderCard
                          key={
                            order.idPedido ||
                            order.id
                          }
                          order={order}
                          action={
                            renderOrderAction(
                              order,
                            )
                          }
                        />
                      ),
                    )
                  )}
                </div>
              </section>
            );
          },
        )}
      </section>
    </main>
  );
}

function KitchenOrderCard({
  order,
  action,
}) {
  const items = Array.isArray(
    order.itens,
  )
    ? order.itens
    : [];

  const createdAt =
    getOrderCreationTime(order);

  const elapsedMinutes =
    getOrderElapsedMinutes(order);

  const isCritical =
    elapsedMinutes >= 30;

  const isDelayed =
    elapsedMinutes >= 20;

  const cardClassName = [
    "kitchen-order-card",
    isCritical
      ? "kitchen-order-card--critical"
      : "",
    !isCritical && isDelayed
      ? "kitchen-order-card--delayed"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const orderId =
    order.idPedido || order.id || "";

  return (
    <article className={cardClassName}>
      <header className="kitchen-order-card__header">
        <div>
          <span className="kitchen-table-badge">
            Mesa {order.mesa}
          </span>

          <span className="kitchen-order-id">
            #{String(orderId).slice(
              0,
              8,
            )}
          </span>
        </div>

        <strong>
          {createdAt
            ? timeSince(createdAt)
            : ""}
        </strong>
      </header>

      <OrderTimer order={order} />

      <OrderProgress
        status={order.status}
      />

      <ul className="kitchen-order-items">
        {items.map(
          (item, index) => (
            <li
              key={
                `${orderId}-` +
                `${item.id || item.nome || "item"}-` +
                `${index}`
              }
            >
              <div>
                <strong>
                  {Number(
                    item.quantidade,
                  ) || 1}
                  x
                </strong>

                <span>
                  {item.emoji || "🍽️"}{" "}
                  {item.nome}
                </span>
              </div>

              <span>
                {formatCurrency(
                  Number(item.subtotal) ||
                    0,
                )}
              </span>
            </li>
          ),
        )}
      </ul>

      {order.observacao && (
        <div className="kitchen-order-note">
          <strong>
            Observação:
          </strong>

          <p>
            {order.observacao}
          </p>
        </div>
      )}

      <footer className="kitchen-order-card__footer">
        <div>
          <span>
            {createdAt
              ? formatTime(createdAt)
              : ""}
          </span>

          <strong>
            {formatCurrency(
              Number(order.total) || 0,
            )}
          </strong>
        </div>

        {action}
      </footer>
    </article>
  );
}
