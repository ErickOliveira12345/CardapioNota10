import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuth,
} from "../contexts/AuthContext.jsx";

import {
  createPayment,
  observeOrders,
  updateOrderStatus,
} from "../services/orders.js";

import {
  formatCurrency,
  formatTime,
} from "../services/formatters.js";

import {
  showToast,
} from "../services/toast.js";

import {
  OrderProgress,
} from "../components/OrderProgress.jsx";

import {
  DeliveryMap,
} from "../components/delivery/DeliveryMap.jsx";

import {
  getEstablishmentById,
} from "../services/establishmentService.js";

const ACTIVE_STATUSES = [
  "aguardando",
  "recebido",
  "preparando",
  "saindo",
];

const STATUS_LABELS = {
  aguardando: "Aguardando",
  recebido: "Recebido",
  preparando: "Preparando",
  saindo: "Pronto",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const PAYMENT_METHODS = [
  {
    value: "dinheiro",
    label: "Dinheiro",
  },
  {
    value: "pix",
    label: "Pix",
  },
  {
    value: "credito",
    label: "Cartão de crédito",
  },
  {
    value: "debito",
    label: "Cartão de débito",
  },
];

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}

function getOrderId(order) {
  return (
    order.idPedido ||
    order.id ||
    ""
  );
}

function getOrderTimestamp(order) {
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
    Number(order?.criadoEm) ||
    0
  );
}

function getOrderItems(order) {
  return Array.isArray(order?.itens)
    ? order.itens
    : [];
}

export function AdminOrdersPage() {
  const {
    establishmentId,
    user,
  } = useAuth();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ativos");

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] = useState(null);

  const [
    selectedTable,
    setSelectedTable,
  ] = useState(null);

  const [
    closingTable,
    setClosingTable,
  ] = useState(false);

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("pix");

  const [
    serviceFeePercentage,
    setServiceFeePercentage,
  ] = useState(10);

  const [
    discount,
    setDiscount,
  ] = useState(0);

  useEffect(() => {
    if (!establishmentId) {
      setOrders([]);
      setLoading(false);

      return undefined;
    }

    setLoading(true);

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
          "Erro ao carregar pedidos:",
          error,
        );

        setLoading(false);

        showToast(
          "Não foi possível carregar os pedidos.",
          "error",
          5000,
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

  const [
    establishment,
    setEstablishment,
  ] = useState(null);

  useEffect(() => {
    if (!establishmentId) {
      setEstablishment(null);
      return;
    }

    let active = true;

    async function loadEstablishment() {
      try {
        const data =
          await getEstablishmentById(
            establishmentId,
          );

        if (active) {
          setEstablishment(data);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar estabelecimento:",
          error,
        );
      }
    }

    loadEstablishment();

    return () => {
      active = false;
    };
  }, [establishmentId]);

  const sortedOrders =
    useMemo(() => {
      return [...orders].sort(
        (
          firstOrder,
          secondOrder,
        ) =>
          getOrderTimestamp(
            secondOrder,
          ) -
          getOrderTimestamp(
            firstOrder,
          ),
      );
    }, [
      orders,
    ]);

  const filteredOrders =
    useMemo(() => {
      if (
        statusFilter === "todos"
      ) {
        return sortedOrders;
      }

      if (
        statusFilter === "ativos"
      ) {
        return sortedOrders.filter(
          (order) =>
            ACTIVE_STATUSES.includes(
              normalizeStatus(
                order.status,
              ),
            ),
        );
      }

      return sortedOrders.filter(
        (order) =>
          normalizeStatus(
            order.status,
          ) === statusFilter,
      );
    }, [
      sortedOrders,
      statusFilter,
    ]);

  const activeOrders =
    useMemo(() => {
      return orders.filter(
        (order) =>
          ACTIVE_STATUSES.includes(
            normalizeStatus(
              order.status,
            ),
          ),
      );
    }, [
      orders,
    ]);

  const tablesWithActiveOrders =
    useMemo(() => {
      const groupedTables =
        new Map();

      activeOrders.forEach(
        (order) => {
          const tableNumber =
            Number(order.mesa);

          if (
            !Number.isInteger(
              tableNumber,
            )
          ) {
            return;
          }

          const currentTable =
            groupedTables.get(
              tableNumber,
            ) || {
              mesa: tableNumber,
              pedidos: [],
              total: 0,
            };

          currentTable.pedidos.push(
            order,
          );

          currentTable.total +=
            Number(order.total) || 0;

          groupedTables.set(
            tableNumber,
            currentTable,
          );
        },
      );

      return Array.from(
        groupedTables.values(),
      ).sort(
        (
          firstTable,
          secondTable,
        ) =>
          firstTable.mesa -
          secondTable.mesa,
      );
    }, [
      activeOrders,
    ]);

  const selectedTableData =
    useMemo(() => {
      if (!selectedTable) {
        return null;
      }

      return (
        tablesWithActiveOrders.find(
          (table) =>
            table.mesa ===
            selectedTable,
        ) || null
      );
    }, [
      selectedTable,
      tablesWithActiveOrders,
    ]);

  const subtotal =
    selectedTableData?.total || 0;

  const serviceFee =
    subtotal *
    (
      Math.max(
        0,
        Number(
          serviceFeePercentage,
        ) || 0,
      ) / 100
    );

  const discountValue =
    Math.max(
      0,
      Number(discount) || 0,
    );

  const finalTotal =
    Math.max(
      0,
      subtotal +
        serviceFee -
        discountValue,
    );

  async function changeOrderStatus(
    order,
    nextStatus,
  ) {
    const orderId =
      getOrderId(order);

    if (
      !orderId ||
      updatingOrderId
    ) {
      return;
    }

    try {
      setUpdatingOrderId(
        orderId,
      );

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
        "Erro ao atualizar pedido:",
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

  function openTableClosing(
    tableNumber,
  ) {
    setSelectedTable(
      tableNumber,
    );

    setPaymentMethod("pix");
    setServiceFeePercentage(10);
    setDiscount(0);
  }

  function closeTableModal() {
    if (closingTable) {
      return;
    }

    setSelectedTable(null);
  }

  async function finishTable() {
  if (
    !selectedTableData ||
    closingTable
  ) {
    return;
  }

  const confirmed = window.confirm(
    `Confirmar o fechamento da Mesa ${selectedTableData.mesa} no valor de ${formatCurrency(
      finalTotal,
    )}?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    setClosingTable(true);

    const ordersToFinish =
      selectedTableData.pedidos.filter(
        (order) =>
          ACTIVE_STATUSES.includes(
            normalizeStatus(
              order.status,
            ),
          ),
      );

    await createPayment({
      mesa: selectedTableData.mesa,

      pedidos:
        selectedTableData.pedidos,

      subtotal,

      taxaServicoPercentual:
        Number(
          serviceFeePercentage,
        ) || 0,

      taxaServicoValor:
        serviceFee,

      desconto:
        discountValue,

      totalFinal:
        finalTotal,

      formaPagamento:
        paymentMethod,

      fechadoPor:
        user?.uid || null,

      establishmentId,
    });

    await Promise.all(
      ordersToFinish.map(
        (order) =>
          updateOrderStatus(
            getOrderId(order),
            "finalizado",
            establishmentId,
          ),
      ),
    );

    showToast(
      `Comanda da Mesa ${selectedTableData.mesa} fechada com sucesso.`,
      "success",
      5000,
    );

    setSelectedTable(null);
  } catch (error) {
    console.error(
      "Erro ao fechar comanda:",
      error,
    );

    showToast(
      error.message ||
        "Não foi possível fechar a comanda.",
      "error",
      5000,
    );
  } finally {
    setClosingTable(false);
  }
}

  function renderStatusActions(
    order,
  ) {
    const status =
      normalizeStatus(
        order.status,
      );

    const orderId =
      getOrderId(order);

    const isUpdating =
      updatingOrderId ===
      orderId;

    if (
      status === "aguardando"
    ) {
      return (
        <button
          type="button"
          className="category-action-btn"
          disabled={isUpdating}
          onClick={() =>
            changeOrderStatus(
              order,
              "recebido",
            )
          }
        >
          {isUpdating
            ? "Atualizando..."
            : "Confirmar pedido"}
        </button>
      );
    }

    if (
      status === "recebido"
    ) {
      return (
        <button
          type="button"
          className="category-action-btn"
          disabled={isUpdating}
          onClick={() =>
            changeOrderStatus(
              order,
              "preparando",
            )
          }
        >
          {isUpdating
            ? "Atualizando..."
            : "Iniciar preparo"}
        </button>
      );
    }

    if (
      status === "preparando"
    ) {
      return (
        <button
          type="button"
          className="category-action-btn"
          disabled={isUpdating}
          onClick={() =>
            changeOrderStatus(
              order,
              "saindo",
            )
          }
        >
          {isUpdating
            ? "Atualizando..."
            : "Marcar como pronto"}
        </button>
      );
    }

    if (
      status === "saindo"
    ) {
      return (
        <button
          type="button"
          className="category-action-btn"
          disabled={isUpdating}
          onClick={() =>
            changeOrderStatus(
              order,
              "finalizado",
            )
          }
        >
          {isUpdating
            ? "Atualizando..."
            : "Finalizar pedido"}
        </button>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <main className="admin-main">
        <section className="empty-state">
          <span
            className="empty-state__icon"
            aria-hidden="true"
          >
            🧾
          </span>

          <p>
            Carregando pedidos...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-main admin-orders-page">
      <section className="admin-page-header">
        <div>
          <h1>Pedidos</h1>

          <p>
            Acompanhe os pedidos e feche
            as comandas das mesas.
          </p>
        </div>

        <div className="admin-orders-header-summary">
          <strong>
            {activeOrders.length}
          </strong>

          <span>
            pedidos ativos
          </span>
        </div>
      </section>

      <section className="orders-table-summary">
        <header>
          <div>
            <h2>
              Comandas abertas
            </h2>

            <p>
              Mesas com pedidos ativos.
            </p>
          </div>
        </header>

        {tablesWithActiveOrders.length ===
        0 ? (
          <div className="empty-state">
            <p>
              Nenhuma comanda aberta.
            </p>
          </div>
        ) : (
          <div className="orders-table-grid">
            {tablesWithActiveOrders.map(
              (table) => (
                <article
                  className="orders-table-card"
                  key={table.mesa}
                >
                  <div>
                    <span>
                      Mesa
                    </span>

                    <strong>
                      {table.mesa}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pedidos
                    </span>

                    <strong>
                      {
                        table.pedidos
                          .length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Consumo
                    </span>

                    <strong>
                      {formatCurrency(
                        table.total,
                      )}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="btn-finalizar"
                    onClick={() =>
                      openTableClosing(
                        table.mesa,
                      )
                    }
                  >
                    Fechar comanda
                  </button>
                </article>
              ),
            
            )}
          </div>
        )}
      </section>

      <section className="admin-orders-filters">
        <button
          type="button"
          className={
            statusFilter === "ativos"
              ? "admin-orders-filter admin-orders-filter--active"
              : "admin-orders-filter"
          }
          onClick={() =>
            setStatusFilter("ativos")
          }
        >
          Ativos
        </button>

        <button
          type="button"
          className={
            statusFilter === "aguardando"
              ? "admin-orders-filter admin-orders-filter--active"
              : "admin-orders-filter"
          }
          onClick={() =>
            setStatusFilter(
              "aguardando",
            )
          }
        >
          Aguardando
        </button>

        <button
          type="button"
          className={
            statusFilter === "preparando"
              ? "admin-orders-filter admin-orders-filter--active"
              : "admin-orders-filter"
          }
          onClick={() =>
            setStatusFilter(
              "preparando",
            )
          }
        >
          Preparando
        </button>

        <button
          type="button"
          className={
            statusFilter === "saindo"
              ? "admin-orders-filter admin-orders-filter--active"
              : "admin-orders-filter"
          }
          onClick={() =>
            setStatusFilter("saindo")
          }
        >
          Prontos
        </button>

        <button
          type="button"
          className={
            statusFilter === "finalizado"
              ? "admin-orders-filter admin-orders-filter--active"
              : "admin-orders-filter"
          }
          onClick={() =>
            setStatusFilter(
              "finalizado",
            )
          }
        >
          Finalizados
        </button>

        <button
          type="button"
          className={
            statusFilter === "todos"
              ? "admin-orders-filter admin-orders-filter--active"
              : "admin-orders-filter"
          }
          onClick={() =>
            setStatusFilter("todos")
          }
        >
          Todos
        </button>
      </section>

      {filteredOrders.length === 0 ? (
        <section className="empty-state">
          <span
            className="empty-state__icon"
            aria-hidden="true"
          >
            📭
          </span>

          <p>
            Nenhum pedido encontrado.
          </p>
        </section>
      ) : (
        <section className="admin-orders-grid">
          {filteredOrders.map(
            (order) => {
              const orderId =
                getOrderId(order);

              const createdAt =
                getOrderTimestamp(
                  order,
                );

              const items =
                getOrderItems(order);

              const status =
                normalizeStatus(
                  order.status,
                );

              return (
                <article
                  className="admin-order-card"
                  key={orderId}
                >
                  <header className="admin-order-card__header">
                    <div>
                      <span className="admin-order-card__table">
                        Mesa {order.mesa}
                      </span>

                      <small>
                        #
                        {String(
                          orderId,
                        ).slice(0, 8)}
                      </small>
                    </div>

                    <span
                      className={
                        `admin-order-status ` +
                        `admin-order-status--${status}`
                      }
                    >
                      {STATUS_LABELS[
                        status
                      ] ||
                        status}
                    </span>
                  </header>

                  <OrderProgress
                    status={status}
                  />

                  <ul className="admin-order-items">
                    {items.map(
                      (
                        item,
                        index,
                      ) => (
                        <li
                          key={
                            `${orderId}-` +
                            `${item.id || item.nome}-` +
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
                              {item.emoji ||
                                "🍽️"}{" "}
                              {item.nome}
                            </span>
                          </div>

                          <span>
                            {formatCurrency(
                              Number(
                                item.subtotal,
                              ) || 0,
                            )}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>

                  {order.observacao && (
                    <div className="admin-order-note">
                      <strong>
                        Observação
                      </strong>

                      <p>
                        {
                          order.observacao
                        }
                      </p>
                    </div>
                  )}

                  {establishment?.localizacao &&
  order?.entrega?.localizacao &&
  order?.entrega?.rota
    ?.encodedPolyline && (
    <section className="admin-order-delivery">
      <div className="admin-order-delivery__header">
        <h3>
          🚚 Entrega
        </h3>

        <div className="admin-order-delivery__metrics">
          <span>
            Distância:{" "}
            <strong>
              {order.entrega.rota
                .distanciaKm}{" "}
              km
            </strong>
          </span>

          <span>
            Tempo estimado:{" "}
            <strong>
              {order.entrega.rota
                .duracaoMinutos}{" "}
              min
            </strong>
          </span>
        </div>
      </div>

      {order.entrega.endereco && (
        <div className="admin-order-delivery__address">
          <strong>
            Endereço do cliente
          </strong>

          <span>
            {
              order.entrega.endereco
                .rua
            }
            {order.entrega.endereco
              .numero
              ? `, ${
                  order.entrega.endereco
                    .numero
                }`
              : ""}
          </span>

          <span>
            {
              order.entrega.endereco
                .bairro
            }
          </span>

          <span>
            {
              order.entrega.endereco
                .cidade
            }
            {order.entrega.endereco
              .estado
              ? ` - ${
                  order.entrega.endereco
                    .estado
                }`
              : ""}
          </span>
        </div>
      )}

      <DeliveryMap
        origin={{
          latitude:
            establishment.localizacao
              .latitude,

          longitude:
            establishment.localizacao
              .longitude,
        }}
        destination={{
          latitude:
            order.entrega.localizacao
              .latitude,

          longitude:
            order.entrega.localizacao
              .longitude,
        }}
        encodedPolyline={
          order.entrega.rota
            .encodedPolyline
        }
        distanceKm={
          order.entrega.rota
            .distanciaKm
        }
        durationMinutes={
          order.entrega.rota
            .duracaoMinutos
        }
      />
    </section>
  )}

                  <footer className="admin-order-card__footer">
                    <div>
                      <span>
                        {createdAt
                          ? formatTime(
                              createdAt,
                            )
                          : ""}
                      </span>

                      <strong>
                        {formatCurrency(
                          Number(
                            order.total,
                          ) || 0,
                        )}
                      </strong>
                    </div>

                    <div className="admin-order-card__actions">
                      {renderStatusActions(
                        order,
                      )}

                      {ACTIVE_STATUSES.includes(
                        status,
                      ) && (
                        <button
                          type="button"
                          className="category-delete-btn"
                          disabled={
                            updatingOrderId ===
                            orderId
                          }
                          onClick={() => {
                            const confirmed =
                              window.confirm(
                                `Cancelar o pedido da Mesa ${order.mesa}?`,
                              );

                            if (
                              confirmed
                            ) {
                              changeOrderStatus(
                                order,
                                "cancelado",
                              );
                            }
                          }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </footer>
                </article>
              );
            },
          )}
        </section>
      )}

      {selectedTableData && (
        <div
          className="order-closing-overlay"
          role="presentation"
          onMouseDown={
            closeTableModal
          }
        >
          <section
            className="order-closing-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="closing-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="order-closing-modal__header">
              <div>
                <h2 id="closing-title">
                  Fechar comanda
                </h2>

                <p>
                  Mesa{" "}
                  {
                    selectedTableData.mesa
                  }
                </p>
              </div>

              <button
                type="button"
                className="order-closing-modal__close"
                disabled={closingTable}
                onClick={
                  closeTableModal
                }
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <div className="order-closing-items">
              {selectedTableData.pedidos.map(
                (order) => (
                  <article
                    key={getOrderId(
                      order,
                    )}
                  >
                    <div>
                      <strong>
                        Pedido #
                        {String(
                          getOrderId(
                            order,
                          ),
                        ).slice(0, 8)}
                      </strong>

                      <span>
                        {
                          getOrderItems(
                            order,
                          ).length
                        }{" "}
                        itens
                      </span>
                    </div>

                    <strong>
                      {formatCurrency(
                        Number(
                          order.total,
                        ) || 0,
                      )}
                    </strong>
                  </article>
                ),
              )}
            </div>

            <label>
              Forma de pagamento

              <select
                value={
                  paymentMethod
                }
                onChange={(event) =>
                  setPaymentMethod(
                    event.target
                      .value,
                  )
                }
              >
                {PAYMENT_METHODS.map(
                  (method) => (
                    <option
                      key={
                        method.value
                      }
                      value={
                        method.value
                      }
                    >
                      {method.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <div className="order-closing-fields">
              <label>
                Taxa de serviço (%)

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={
                    serviceFeePercentage
                  }
                  onChange={(event) =>
                    setServiceFeePercentage(
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              <label>
                Desconto (R$)

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(event) =>
                    setDiscount(
                      event.target
                        .value,
                    )
                  }
                />
              </label>
            </div>

            <div className="order-closing-totals">
              <div>
                <span>
                  Subtotal
                </span>

                <strong>
                  {formatCurrency(
                    subtotal,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Taxa de serviço
                </span>

                <strong>
                  {formatCurrency(
                    serviceFee,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Desconto
                </span>

                <strong>
                  -{" "}
                  {formatCurrency(
                    discountValue,
                  )}
                </strong>
              </div>

              <div className="order-closing-totals__final">
                <span>
                  Total final
                </span>

                <strong>
                  {formatCurrency(
                    finalTotal,
                  )}
                </strong>
              </div>
            </div>

            <footer className="order-closing-modal__footer">
              <button
                type="button"
                className="category-action-btn"
                disabled={closingTable}
                onClick={
                  closeTableModal
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-finalizar"
                disabled={closingTable}
                onClick={finishTable}
              >
                {closingTable
                  ? "Fechando..."
                  : "Confirmar pagamento"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}