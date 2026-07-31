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
} from "../services/orders.js";

import {
  formatCurrency,
  formatTime,
} from "../services/formatters.js";

import {
  showToast,
} from "../services/toast.js";

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

function getTimestampMilliseconds(value) {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : 0;
}

function getOrderCreationTime(order) {
  return (
    getTimestampMilliseconds(
      order.criadoEm,
    ) ||
    Number(order.criadoEmMs) ||
    0
  );
}

function isToday(timestamp) {
  if (!timestamp) {
    return false;
  }

  const date = new Date(timestamp);
  const today = new Date();

  return (
    date.getDate() ===
      today.getDate() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getFullYear() ===
      today.getFullYear()
  );
}

function normalizeStatus(status) {
  return String(
    status || "aguardando",
  ).toLowerCase();
}

function getDateKey(timestamp) {
  const date = new Date(timestamp);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(
      2,
      "0",
    ),
    String(date.getDate()).padStart(
      2,
      "0",
    ),
  ].join("-");
}

function getLastSevenDays() {
  const days = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);

    days.push({
      key: getDateKey(date.getTime()),

      label:
        new Intl.DateTimeFormat(
          "pt-BR",
          {
            weekday: "short",
          },
        )
          .format(date)
          .replace(".", ""),

      dateLabel:
        new Intl.DateTimeFormat(
          "pt-BR",
          {
            day: "2-digit",
            month: "2-digit",
          },
        ).format(date),

      revenue: 0,
      orders: 0,
    });
  }

  return days;
}

function isSameDay(timestamp, referenceDate) {
  if (!timestamp) {
    return false;
  }

  const date = new Date(timestamp);

  return (
    date.getDate() ===
      referenceDate.getDate() &&
    date.getMonth() ===
      referenceDate.getMonth() &&
    date.getFullYear() ===
      referenceDate.getFullYear()
  );
}

function isCurrentWeek(timestamp) {
  if (!timestamp) {
    return false;
  }

  const date = new Date(timestamp);
  const today = new Date();

  const startOfWeek = new Date(today);

  const weekday = today.getDay();
  const daysSinceMonday =
    weekday === 0
      ? 6
      : weekday - 1;

  startOfWeek.setDate(
    today.getDate() - daysSinceMonday,
  );

  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek =
    new Date(startOfWeek);

  endOfWeek.setDate(
    startOfWeek.getDate() + 7,
  );

  return (
    date >= startOfWeek &&
    date < endOfWeek
  );
}

function isCurrentMonth(timestamp) {
  if (!timestamp) {
    return false;
  }

  const date = new Date(timestamp);
  const today = new Date();

  return (
    date.getMonth() ===
      today.getMonth() &&
    date.getFullYear() ===
      today.getFullYear()
  );
}

function calculatePercentageChange(
  currentValue,
  previousValue,
) {
  const current =
    Number(currentValue) || 0;

  const previous =
    Number(previousValue) || 0;

  if (previous === 0) {
    return current > 0
      ? 100
      : 0;
  }

  return (
    ((current - previous) / previous) *
    100
  );
}

function getOrderUpdatedTime(order) {
  return (
    getTimestampMilliseconds(
      order.atualizadoEm,
    ) ||
    Number(order.atualizadoEmMs) ||
    0
  );
}

export function DashboardPage({
  calls = [],
  onMarkCallAsSeen,
}) {
  const {
    establishmentId,
  } = useAuth();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const activeCalls = calls.filter(
    (call) => !call.visualizado,
  );

  useEffect(() => {
    if (!establishmentId) {
      setOrders([]);
      setLoading(false);

      return undefined;
    }

    setLoading(true);

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

          setLoading(false);
        },

        (error) => {
          console.error(
            "Erro ao carregar dashboard:",
            error,
          );

          setLoading(false);

          showToast(
            "Não foi possível carregar os dados do dashboard.",
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

  const dashboardData =
    useMemo(() => {
      const todayOrders =
        orders.filter(
          (order) =>
            isToday(
              getOrderCreationTime(
                order,
              ),
            ),
        );

      const validSales =
        todayOrders.filter(
          (order) =>
            normalizeStatus(
              order.status,
            ) !== "cancelado",
        );

      const finishedOrders =
        todayOrders.filter(
          (order) =>
            normalizeStatus(
              order.status,
            ) === "finalizado",
        );

      const activeOrders =
        todayOrders.filter(
          (order) =>
            ACTIVE_STATUSES.includes(
              normalizeStatus(
                order.status,
              ),
            ),
        );

      const occupiedTables =
        new Set(
          activeOrders
            .map(
              (order) =>
                Number(
                  order.mesa,
                ),
            )
            .filter(
              Number.isFinite,
            ),
        );

      const revenue =
        finishedOrders.reduce(
          (
            total,
            order,
          ) =>
            total +
            Number(
              order.total || 0,
            ),
          0,
        );

      const averageTicket =
        finishedOrders.length > 0
          ? revenue /
            finishedOrders.length
          : 0;

      const statusCounts = {
        aguardando: 0,
        recebido: 0,
        preparando: 0,
        saindo: 0,
        finalizado: 0,
        cancelado: 0,
      };

      todayOrders.forEach(
        (order) => {
          const status =
            normalizeStatus(
              order.status,
            );

          if (
            Object.prototype
              .hasOwnProperty.call(
                statusCounts,
                status,
              )
          ) {
            statusCounts[
              status
            ] += 1;
          }
        },
      );

      const productTotals =
        new Map();

      validSales.forEach(
        (order) => {
          const items =
            Array.isArray(
              order.itens,
            )
              ? order.itens
              : [];

          items.forEach(
            (item) => {
              const productId =
                item.id ||
                item.produtoId ||
                item.nome;

              const current =
                productTotals.get(
                  productId,
                ) || {
                  name:
                    item.nome ||
                    "Produto",
                  quantity: 0,
                  revenue: 0,
                };

              const quantity =
                Number(
                  item.quantidade ||
                    1,
                );

              const subtotal =
                Number(
                  item.subtotal,
                ) ||
                Number(
                  item.preco || 0,
                ) *
                  quantity;

              current.quantity +=
                quantity;

              current.revenue +=
                subtotal;

              productTotals.set(
                productId,
                current,
              );
            },
          );
        },
      );

      const topProducts = [
        ...productTotals.values(),
      ]
        .sort(
          (
            firstProduct,
            secondProduct,
          ) =>
            secondProduct.quantity -
            firstProduct.quantity,
        )
        .slice(0, 5);

      const latestOrders = [
        ...todayOrders,
      ]
        .sort(
          (
            firstOrder,
            secondOrder,
          ) =>
            getOrderCreationTime(
              secondOrder,
            ) -
            getOrderCreationTime(
              firstOrder,
            ),
        )
        .slice(0, 8);

      const yesterday = new Date();

        yesterday.setDate(
        yesterday.getDate() - 1,
        );

        const yesterdayOrders =
        orders.filter((order) =>
            isSameDay(
            getOrderCreationTime(order),
            yesterday,
            ),
        );

        const yesterdayFinishedOrders =
        yesterdayOrders.filter(
            (order) =>
            normalizeStatus(
                order.status,
            ) === "finalizado",
        );

        const yesterdayRevenue =
        yesterdayFinishedOrders.reduce(
            (total, order) =>
            total +
            Number(order.total || 0),
            0,
        );

        const weeklyFinishedOrders =
        orders.filter((order) => {
            const timestamp =
            getOrderCreationTime(order);

            return (
            isCurrentWeek(timestamp) &&
            normalizeStatus(
                order.status,
            ) === "finalizado"
            );
        });

        const monthlyFinishedOrders =
        orders.filter((order) => {
            const timestamp =
            getOrderCreationTime(order);

            return (
            isCurrentMonth(timestamp) &&
            normalizeStatus(
                order.status,
            ) === "finalizado"
            );
        });

        const weeklyRevenue =
        weeklyFinishedOrders.reduce(
            (total, order) =>
            total +
            Number(order.total || 0),
            0,
        );

        const monthlyRevenue =
        monthlyFinishedOrders.reduce(
            (total, order) =>
            total +
            Number(order.total || 0),
            0,
        );

        const revenueChange =
        calculatePercentageChange(
            revenue,
            yesterdayRevenue,
        );

      const lastSevenDays =
        getLastSevenDays();

    const dayMap = new Map(
    lastSevenDays.map((day) => [
        day.key,
        day,
    ]),
    );

    orders.forEach((order) => {
    const timestamp =
        getOrderCreationTime(order);

    if (!timestamp) {
        return;
    }

    const day =
        dayMap.get(
        getDateKey(timestamp),
        );

    if (!day) {
        return;
    }

    const status =
        normalizeStatus(order.status);

    if (status !== "cancelado") {
        day.orders += 1;
    }

    if (status === "finalizado") {
        day.revenue += Number(
        order.total || 0,
        );
    }
    });

    const hourlyOrders = Array.from(
    { length: 24 },
    (_, hour) => ({
        hour,
        label: `${String(hour).padStart(
        2,
        "0",
        )}h`,
        quantity: 0,
    }),
    );

    todayOrders.forEach((order) => {
    const timestamp =
        getOrderCreationTime(order);

    if (!timestamp) {
        return;
    }

    const hour =
        new Date(timestamp).getHours();

    hourlyOrders[hour].quantity += 1;
    });

    const visibleHourlyOrders =
    hourlyOrders.filter(
        (item) =>
        item.quantity > 0 ||
        (
            item.hour >= 8 &&
            item.hour <= 23
        ),
    );

    const maxDailyRevenue =
    Math.max(
        ...lastSevenDays.map(
        (day) => day.revenue,
        ),
        1,
    );

    const maxHourlyOrders =
    Math.max(
        ...visibleHourlyOrders.map(
        (item) => item.quantity,
        ),
        1,
    );

    const hourMovementMap =
        new Map();

        todayOrders.forEach((order) => {
        const timestamp =
            getOrderCreationTime(order);

        if (!timestamp) {
            return;
        }

        const hour =
            new Date(timestamp).getHours();

        hourMovementMap.set(
            hour,
            (
            hourMovementMap.get(hour) ||
            0
            ) + 1,
        );
        });

        const peakHourEntry = [
        ...hourMovementMap.entries(),
        ].sort(
        (
            firstEntry,
            secondEntry,
        ) =>
            secondEntry[1] -
            firstEntry[1],
        )[0];

        const peakHour =
        peakHourEntry
            ? {
                hour: peakHourEntry[0],
                quantity: peakHourEntry[1],
            }
            : null;

        const tableConsumptionMap =
            new Map();

            finishedOrders.forEach((order) => {
            const tableNumber =
                Number(order.mesa);

            if (!Number.isFinite(tableNumber)) {
                return;
            }

            const current =
                tableConsumptionMap.get(
                tableNumber,
                ) || {
                table: tableNumber,
                revenue: 0,
                orders: 0,
                };

            current.revenue +=
                Number(order.total || 0);

            current.orders += 1;

            tableConsumptionMap.set(
                tableNumber,
                current,
            );
            });

            const topTable = [
            ...tableConsumptionMap.values(),
            ].sort(
            (
                firstTable,
                secondTable,
            ) =>
                secondTable.revenue -
                firstTable.revenue,
            )[0] || null;

        const preparationTimes =
            finishedOrders
                .map((order) => {
                const createdAt =
                    getOrderCreationTime(order);

                const updatedAt =
                    getOrderUpdatedTime(order);

                if (
                    !createdAt ||
                    !updatedAt ||
                    updatedAt <= createdAt
                ) {
                    return null;
                }

                return (
                    updatedAt - createdAt
                ) / 60000;
                })
                .filter(
                (minutes) =>
                    Number.isFinite(minutes),
                );

            const averagePreparationTime =
            preparationTimes.length > 0
                ? preparationTimes.reduce(
                    (total, minutes) =>
                    total + minutes,
                    0,
                ) /
                preparationTimes.length
                : 0;

    const insights = [];

        if (revenueChange > 0) {
        insights.push({
            icon: "📈",
            type: "positive",
            title: "Faturamento em crescimento",
            description:
            `O faturamento de hoje está ` +
            `${Math.abs(
                revenueChange,
            ).toFixed(1)}% acima de ontem.`,
        });
        } else if (revenueChange < 0) {
        insights.push({
            icon: "📉",
            type: "warning",
            title: "Faturamento abaixo de ontem",
            description:
            `O faturamento de hoje está ` +
            `${Math.abs(
                revenueChange,
            ).toFixed(1)}% abaixo de ontem.`,
        });
        }

        if (topProducts.length > 0) {
        insights.push({
            icon: "🏆",
            type: "info",
            title: "Produto mais vendido",
            description:
            `${topProducts[0].name} lidera ` +
            `com ${topProducts[0].quantity} unidades.`,
        });
        }

        if (peakHour) {
        insights.push({
            icon: "⏰",
            type: "info",
            title: "Horário de maior movimento",
            description:
            `O maior volume ocorreu às ` +
            `${String(
                peakHour.hour,
            ).padStart(2, "0")}h, ` +
            `com ${peakHour.quantity} pedidos.`,
        });
        }

        if (topTable) {
        insights.push({
            icon: "🪑",
            type: "info",
            title: "Mesa com maior consumo",
            description:
            `A Mesa ${topTable.table} consumiu ` +
            `${formatCurrency(
                topTable.revenue,
            )} hoje.`,
        });
        }

        if (
        averagePreparationTime > 0
        ) {
        insights.push({
            icon: "⏱️",
            type:
            averagePreparationTime <= 20
                ? "positive"
                : "warning",
            title: "Tempo médio de atendimento",
            description:
            `Os pedidos finalizados levaram ` +
            `em média ${Math.round(
                averagePreparationTime,
            )} minutos.`,
        });
        }

      return {
        todayOrders,
        activeOrders,
        occupiedTables:
          occupiedTables.size,
        revenue,
        averageTicket,
        statusCounts,
        topProducts,
        latestOrders,
        lastSevenDays,
        visibleHourlyOrders,
        maxDailyRevenue,
        maxHourlyOrders,
        weeklyRevenue,
        monthlyRevenue,
        yesterdayRevenue,
        revenueChange,
        peakHour,
        topTable,
        averagePreparationTime,
        insights,
      };
    }, [
      orders,
    ]);

  if (loading) {
    return (
      <main className="dashboard-page">
        <section className="empty-state">
          <span
            className="empty-state__icon"
            aria-hidden="true"
          >
            📊
          </span>

          <p>
            Carregando dashboard...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <span className="dashboard-header__eyebrow">
            Visão geral
          </span>

          <h1>
            Dashboard gerencial
          </h1>

          <p>
            Acompanhe o desempenho do
            estabelecimento em tempo real.
          </p>
        </div>

        <div className="dashboard-date">
          <span>
            Hoje
          </span>

          <strong>
            {new Intl.DateTimeFormat(
              "pt-BR",
              {
                day: "2-digit",
                month: "long",
                year: "numeric",
              },
            ).format(new Date())}
          </strong>
        </div>
      </section>

      <section className="dashboard-panel dashboard-calls-panel">
        <header className="dashboard-panel__header">
          <div>
            <h2>🔔 Chamados de atendimento</h2>

            <p>
              Mesas aguardando atendimento.
            </p>
          </div>

          <span className="dashboard-panel__count">
            {activeCalls.length}
          </span>
        </header>

        {activeCalls.length === 0 ? (
          <DashboardEmpty
            message="Nenhum chamado aguardando atendimento."
          />
        ) : (
          <div className="dashboard-calls-list">
            {activeCalls.map((call) => (
              <article
                className="dashboard-call-card"
                key={
                  call.id ||
                  `${call.mesa}-${call.timestampMs}`
                }
              >
                <div className="dashboard-call-card__icon">
                  🔔
                </div>

                <div className="dashboard-call-card__content">
                  <strong>
                    Mesa {call.mesa}&nbsp;
                  </strong>

                  <span>
                    Solicitou atendimento
                  </span>

                  <small>
                    {call.timestampMs
                      ? formatTime(call.timestampMs)
                      : "Agora"}
                  </small>
                </div>

                <button
                  type="button"
                  className="dashboard-call-card__button"
                  onClick={() =>
                    onMarkCallAsSeen(
                      call.mesa,
                      call.timestampMs ??
                        call.timestamp,
                    )
                  }
                >
                  Marcar como atendido
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-metrics">
        <DashboardMetric
          icon="💰"
          label="Faturamento do dia"
          value={formatCurrency(
            dashboardData.revenue,
          )}
          helper="Pedidos finalizados"
        />

        <DashboardMetric
          icon="📦"
          label="Pedidos do dia"
          value={
            dashboardData
              .todayOrders.length
          }
          helper="Todos os pedidos"
        />

        <DashboardMetric
          icon="⏳"
          label="Pedidos ativos"
          value={
            dashboardData
              .activeOrders.length
          }
          helper="Em atendimento"
        />

        <DashboardMetric
          icon="🧾"
          label="Ticket médio"
          value={formatCurrency(
            dashboardData
              .averageTicket,
          )}
          helper="Por pedido finalizado"
        />

        <DashboardMetric
          icon="🪑"
          label="Mesas ocupadas"
          value={
            dashboardData
              .occupiedTables
          }
          helper="Com pedidos ativos"
        />
      </section>

      <section className="dashboard-executive-metrics">
        <article className="dashboard-executive-card">
            <span>
            Faturamento da semana
            </span>

            <strong>
            {formatCurrency(
                dashboardData.weeklyRevenue,
            )}
            </strong>

            <small>
            Pedidos finalizados desde segunda-feira
            </small>
        </article>

        <article className="dashboard-executive-card">
            <span>
            Faturamento do mês
            </span>

            <strong>
            {formatCurrency(
                dashboardData.monthlyRevenue,
            )}
            </strong>

            <small>
            Total acumulado no mês atual
            </small>
        </article>

        <article className="dashboard-executive-card">
            <span>
            Comparação com ontem
            </span>

            <strong
            className={
                dashboardData.revenueChange >= 0
                ? "dashboard-value-positive"
                : "dashboard-value-negative"
            }
            >
            {dashboardData.revenueChange >= 0
                ? "↑"
                : "↓"}{" "}
            {Math.abs(
                dashboardData.revenueChange,
            ).toFixed(1)}
            %
            </strong>

            <small>
            Ontem:{" "}
            {formatCurrency(
                dashboardData
                .yesterdayRevenue,
            )}
            </small>
        </article>

        <article className="dashboard-executive-card">
            <span>
            Maior movimento
            </span>

            <strong>
            {dashboardData.peakHour
                ? `${String(
                    dashboardData
                    .peakHour.hour,
                ).padStart(
                    2,
                    "0",
                )}h`
                : "--"}
            </strong>

            <small>
            {dashboardData.peakHour
                ? `${dashboardData.peakHour.quantity} pedidos`
                : "Sem pedidos registrados"}
            </small>
        </article>
      </section>

      <section className="dashboard-charts-grid">
        <article className="dashboard-panel">
            <header className="dashboard-panel__header">
            <div>
                <h2>
                Faturamento dos últimos 7 dias
                </h2>

                <p>
                Total de pedidos finalizados
                por dia.
                </p>
            </div>
            </header>

            <div className="dashboard-bar-chart">
            {dashboardData.lastSevenDays.map(
                (day) => {
                const height =
                    day.revenue > 0
                    ? Math.max(
                        8,
                        (
                            day.revenue /
                            dashboardData
                            .maxDailyRevenue
                        ) *
                            100,
                        )
                    : 0;

                return (
                    <div
                    className="dashboard-bar-chart__item"
                    key={day.key}
                    >
                    <div className="dashboard-bar-chart__value">
                        {formatCurrency(
                        day.revenue,
                        )}
                    </div>

                    <div className="dashboard-bar-chart__track">
                        <span
                        className="dashboard-bar-chart__bar"
                        style={{
                            height: `${height}%`,
                        }}
                        />
                    </div>

                    <strong>
                        {day.label}
                    </strong>

                    <small>
                        {day.dateLabel}
                    </small>
                    </div>
                );
                },
            )}
            </div>
        </article>

        <article className="dashboard-panel">
            <header className="dashboard-panel__header">
            <div>
                <h2>
                Pedidos por horário
                </h2>

                <p>
                Distribuição dos pedidos
                realizados hoje.
                </p>
            </div>
            </header>

            <div className="dashboard-hour-chart">
            {dashboardData
                .visibleHourlyOrders.map(
                (item) => {
                    const width =
                    item.quantity > 0
                        ? Math.max(
                            5,
                            (
                            item.quantity /
                            dashboardData
                                .maxHourlyOrders
                            ) *
                            100,
                        )
                        : 0;

                    return (
                    <div
                        className="dashboard-hour-chart__row"
                        key={item.hour}
                    >
                        <span>
                        {item.label}
                        </span>

                        <div className="dashboard-hour-chart__track">
                        <span
                            className="dashboard-hour-chart__bar"
                            style={{
                            width: `${width}%`,
                            }}
                        />
                        </div>

                        <strong>
                        {item.quantity}
                        </strong>
                    </div>
                    );
                },
                )}
            </div>
        </article>
      </section>

      <section className="dashboard-panel dashboard-insights-panel">
        <header className="dashboard-panel__header">
            <div>
            <h2>
                Insights do negócio
            </h2>

            <p>
                Informações calculadas com base
                nos pedidos registrados.
            </p>
            </div>

            <span className="dashboard-panel__count">
            {dashboardData.insights.length}
            </span>
        </header>

        {dashboardData.insights.length ===
        0 ? (
            <DashboardEmpty
            message={
                "Ainda não há dados suficientes " +
                "para gerar insights."
            }
            />
        ) : (
            <div className="dashboard-insights-grid">
            {dashboardData.insights.map(
                (insight, index) => (
                <article
                    className={
                    `dashboard-insight-card ` +
                    `dashboard-insight-card--${insight.type}`
                    }
                    key={
                    `${insight.title}-${index}`
                    }
                >
                    <span className="dashboard-insight-card__icon">
                    {insight.icon}
                    </span>

                    <div>
                    <strong>
                        {insight.title}
                    </strong>

                    <p>
                        {insight.description}
                    </p>
                    </div>
                </article>
                ),
            )}
            </div>
        )}
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel">
          <header className="dashboard-panel__header">
            <div>
              <h2>
                Pedidos por status
              </h2>

              <p>
                Distribuição dos pedidos
                de hoje.
              </p>
            </div>
          </header>

          <div className="dashboard-status-list">
            {Object.entries(
              dashboardData.statusCounts,
            ).map(
              ([
                status,
                quantity,
              ]) => (
                <StatusRow
                  key={status}
                  status={status}
                  quantity={quantity}
                  total={
                    dashboardData
                      .todayOrders
                      .length
                  }
                />
              ),
            )}
          </div>
        </article>

        <article className="dashboard-panel">
          <header className="dashboard-panel__header">
            <div>
              <h2>
                Produtos mais vendidos
              </h2>

              <p>
                Ranking por quantidade
                vendida hoje.
              </p>
            </div>
          </header>

          {dashboardData
            .topProducts.length ===
          0 ? (
            <DashboardEmpty
              message="Nenhum produto vendido hoje."
            />
          ) : (
            <ol className="dashboard-product-ranking">
              {dashboardData
                .topProducts.map(
                  (
                    product,
                    index,
                  ) => (
                    <li
                      key={
                        product.name
                      }
                    >
                      <span className="dashboard-product-position">
                        {index + 1}
                      </span>

                      <div>
                        <strong>
                          {
                            product.name
                          }
                        </strong>

                        <span>
                          {
                            product.quantity
                          }{" "}
                          unidades
                        </span>
                      </div>

                      <strong>
                        {formatCurrency(
                          product.revenue,
                        )}
                      </strong>
                    </li>
                  ),
                )}
            </ol>
          )}
        </article>
      </section>

      <section className="dashboard-panel">
        <header className="dashboard-panel__header">
          <div>
            <h2>
              Últimos pedidos
            </h2>

            <p>
              Pedidos registrados hoje.
            </p>
          </div>

          <span className="dashboard-panel__count">
            {
              dashboardData
                .latestOrders.length
            }
          </span>
        </header>

        {dashboardData
          .latestOrders.length ===
        0 ? (
          <DashboardEmpty
            message="Nenhum pedido realizado hoje."
          />
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-orders-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Mesa</th>
                  <th>Horário</th>
                  <th>Status</th>
                  <th>Itens</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {dashboardData
                  .latestOrders.map(
                    (order) => {
                      const items =
                        Array.isArray(
                          order.itens,
                        )
                          ? order.itens
                          : [];

                      const itemCount =
                        items.reduce(
                          (
                            total,
                            item,
                          ) =>
                            total +
                            Number(
                              item.quantidade ||
                                1,
                            ),
                          0,
                        );

                      const status =
                        normalizeStatus(
                          order.status,
                        );

                      return (
                        <tr
                          key={
                            order.idPedido ||
                            order.id
                          }
                        >
                          <td>
                            <strong>
                              #
                              {String(
                                order.idPedido ||
                                  order.id ||
                                  "",
                              ).slice(
                                0,
                                8,
                              )}
                            </strong>
                          </td>

                          <td>
                            Mesa{" "}
                            {
                              order.mesa
                            }
                          </td>

                          <td>
                            {formatTime(
                              getOrderCreationTime(
                                order,
                              ),
                            )}
                          </td>

                          <td>
                            <span
                              className={
                                `dashboard-status-badge ` +
                                `dashboard-status-badge--${status}`
                              }
                            >
                              {STATUS_LABELS[
                                status
                              ] ||
                                status}
                            </span>
                          </td>

                          <td>
                            {itemCount}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(
                                Number(
                                  order.total ||
                                    0,
                                ),
                              )}
                            </strong>
                          </td>
                        </tr>
                      );
                    },
                  )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function DashboardMetric({
  icon,
  label,
  value,
  helper,
}) {
  return (
    <article className="dashboard-metric-card">
      <div className="dashboard-metric-card__icon">
        {icon}
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {helper}
        </small>
      </div>
    </article>
  );
}

function StatusRow({
  status,
  quantity,
  total,
}) {
  const percentage =
    total > 0
      ? Math.round(
          (quantity / total) * 100,
        )
      : 0;

  return (
    <div className="dashboard-status-row">
      <div className="dashboard-status-row__heading">
        <span>
          {STATUS_LABELS[status] ||
            status}
        </span>

        <strong>
          {quantity}
        </strong>
      </div>

      <div className="dashboard-status-progress">
        <span
          className={
            `dashboard-status-progress__bar ` +
            `dashboard-status-progress__bar--${status}`
          }
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function DashboardEmpty({
  message,
}) {
  return (
    <div className="dashboard-empty">
      <span aria-hidden="true">
        📭
      </span>

      <p>
        {message}
      </p>
    </div>
  );
}