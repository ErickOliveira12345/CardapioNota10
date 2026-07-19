import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createOrderNotification,
  getSavedNotifications,
  saveNotifications,
} from "../services/notificationService.js";

import {
  playNewOrderSound,
} from "../services/soundService.js";

import {
  showToast,
} from "../services/toast.js";

function getOrderId(order) {
  return order.idPedido || order.id;
}

function getOrderCreatedTime(order) {
  if (
    order.criadoEm &&
    typeof order.criadoEm.toMillis ===
      "function"
  ) {
    return order.criadoEm.toMillis();
  }

  return (
    Number(order.criadoEmMs) ||
    Number(order.createdAt) ||
    0
  );
}

function formatNotificationTime(
  timestamp,
) {
  if (!timestamp) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(timestamp));
}

export function NotificationCenter({
  orders = [],
  onNavigate,
}) {
  const [
    notifications,
    setNotifications,
  ] = useState(
    getSavedNotifications,
  );

  const [isOpen, setIsOpen] =
    useState(false);

  const initializedRef =
    useRef(false);

  const knownOrderIdsRef =
    useRef(new Set());

  useEffect(() => {
    saveNotifications(
      notifications,
    );
  }, [
    notifications,
  ]);

  useEffect(() => {
    const currentOrders =
      Array.isArray(orders)
        ? orders
        : [];

    const currentOrderIds =
      new Set(
        currentOrders
          .map(getOrderId)
          .filter(Boolean),
      );

    if (!initializedRef.current) {
      knownOrderIdsRef.current =
        currentOrderIds;

      initializedRef.current = true;

      return;
    }

    const newOrders =
      currentOrders.filter(
        (order) => {
          const orderId =
            getOrderId(order);

          const status = String(
            order.status || "",
          ).toLowerCase();

          return (
            orderId &&
            !knownOrderIdsRef.current.has(
              orderId,
            ) &&
            status === "aguardando"
          );
        },
      );

    if (newOrders.length > 0) {
      const createdNotifications =
        newOrders.map(
          createOrderNotification,
        );

      setNotifications(
        (currentNotifications) => [
          ...createdNotifications,
          ...currentNotifications,
        ].slice(0, 30),
      );

      playNewOrderSound();

      const newestOrder =
        newOrders
          .slice()
          .sort(
            (
              firstOrder,
              secondOrder,
            ) =>
              getOrderCreatedTime(
                secondOrder,
              ) -
              getOrderCreatedTime(
                firstOrder,
              ),
          )[0];

      showToast(
        `🔔 Novo pedido da Mesa ${newestOrder.mesa}`,
        "success",
        6000,
      );
    }

    knownOrderIdsRef.current =
      currentOrderIds;
  }, [
    orders,
  ]);

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !notification.read,
        ).length,
      [
        notifications,
      ],
    );

  function markAllAsRead() {
    setNotifications(
      (currentNotifications) =>
        currentNotifications.map(
          (notification) => ({
            ...notification,
            read: true,
          }),
        ),
    );
  }

  function markAsRead(
    notificationId,
  ) {
    setNotifications(
      (currentNotifications) =>
        currentNotifications.map(
          (notification) =>
            notification.id ===
            notificationId
              ? {
                  ...notification,
                  read: true,
                }
              : notification,
        ),
    );
  }

  function clearAll() {
    setNotifications([]);
  }

  function openOrder(
    notification,
  ) {
    markAsRead(notification.id);
    setIsOpen(false);

    onNavigate?.(
      "/admin/pedidos",
    );
  }

  return (
    <div className="notification-center">
      <button
        type="button"
        className="notification-bell"
        aria-label="Abrir notificações"
        onClick={() =>
          setIsOpen(
            (currentValue) =>
              !currentValue,
          )
        }
      >
        <span aria-hidden="true">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="notification-bell__count">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section className="notification-dropdown">
          <header className="notification-dropdown__header">
            <div>
              <h2>
                Notificações
              </h2>

              <span>
                {unreadCount} não lida
                {unreadCount === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={
                unreadCount === 0
              }
            >
              Marcar como lidas
            </button>
          </header>

          <div className="notification-dropdown__list">
            {notifications.length ===
            0 ? (
              <div className="notification-empty">
                <span
                  aria-hidden="true"
                >
                  🔕
                </span>

                <p>
                  Nenhuma notificação.
                </p>
              </div>
            ) : (
              notifications.map(
                (notification) => (
                  <article
                    className={
                      notification.read
                        ? "notification-item"
                        : "notification-item notification-item--unread"
                    }
                    key={
                      notification.id
                    }
                  >
                    <div className="notification-item__icon">
                      🍽️
                    </div>

                    <div className="notification-item__content">
                      <header>
                        <strong>
                          {
                            notification.title
                          }
                        </strong>

                        <time>
                          {formatNotificationTime(
                            notification.createdAt,
                          )}
                        </time>
                      </header>

                      <p>
                        {
                          notification.message
                        }
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          openOrder(
                            notification,
                          )
                        }
                      >
                        Ver pedido
                      </button>
                    </div>
                  </article>
                ),
              )
            )}
          </div>

          {notifications.length > 0 && (
            <footer className="notification-dropdown__footer">
              <button
                type="button"
                onClick={clearAll}
              >
                Limpar notificações
              </button>
            </footer>
          )}
        </section>
      )}
    </div>
  );
}