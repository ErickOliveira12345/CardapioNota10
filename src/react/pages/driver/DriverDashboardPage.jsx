import React, {
  useEffect,
  useState,
} from "react";

import {
  auth,
} from "../../firebase/firebaseConfig.js";

import {
  getDriverByUid,
  updateDriverAvailability,
  logoutDriver,
} from "../../services/driverService.js";

import "../../styles/driver/driverDashboard.css";

import {
  acceptDeliveryOrder,
  observeAvailableDriverOrders,
} from "../../services/driverOrdersService.js";

export default function DriverDashboardPage({
  onNavigate,
}) {
  const [
    driver,
    setDriver,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    updatingAvailability,
    setUpdatingAvailability,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    availableOrders,
    setAvailableOrders,
    ] = useState([]);

  const [
    ordersLoading,
    setOrdersLoading,
    ] = useState(false);

  const [
    acceptingOrderId,
    setAcceptingOrderId,
  ] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadDriver() {
      try {
        setLoading(true);

        const user =
          auth.currentUser;

        if (!user) {
          onNavigate?.(
            "/entregador/login",
          );

          return;
        }

        const driverData =
          await getDriverByUid(
            user.uid,
          );

        if (!driverData) {
          onNavigate?.(
            "/entregador/login",
          );

          return;
        }

        if (
          driverData.status ===
          "pending"
        ) {
          onNavigate?.(
            "/entregador/aguardando-aprovacao",
          );

          return;
        }

        if (
          driverData.status !==
          "approved"
        ) {
          setError(
            "Seu cadastro não está liberado para entregas.",
          );

          return;
        }

        if (mounted) {
          setDriver(
            driverData,
          );
        }
      } catch (loadError) {
        console.error(
          "Erro ao carregar entregador:",
          loadError,
        );

        if (mounted) {
          setError(
            loadError?.message ||
              "Não foi possível carregar seu perfil.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDriver();

    return () => {
      mounted = false;
    };
  }, [
    onNavigate,
  ]);

  useEffect(() => {
    if (
        !driver?.uid ||
        driver.status !==
        "approved" ||
        !driver.disponivel
    ) {
        setAvailableOrders([]);

        return undefined;
    }

    setOrdersLoading(true);

    const unsubscribe =
        observeAvailableDriverOrders(
        (orders) => {
            setAvailableOrders(
            orders,
            );

            setOrdersLoading(false);
        },

        (ordersError) => {
            console.error(
            "Erro ao acompanhar entregas:",
            ordersError,
            );

            setOrdersLoading(false);
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
    driver?.uid,
    driver?.status,
    driver?.disponivel,
  ]);

  async function handleToggleAvailability() {
    if (
      !driver?.uid ||
      updatingAvailability
    ) {
      return;
    }

    const nextAvailability =
      !driver.disponivel;

    try {
      setUpdatingAvailability(
        true,
      );

      await updateDriverAvailability({
        uid:
          driver.uid,

        disponivel:
          nextAvailability,
      });

      setDriver(
        (current) => ({
          ...current,
          disponivel:
            nextAvailability,
        }),
      );
    } catch (updateError) {
      console.error(
        "Erro ao alterar disponibilidade:",
        updateError,
      );

      setError(
        updateError?.message ||
          "Não foi possível alterar sua disponibilidade.",
      );
    } finally {
      setUpdatingAvailability(
        false,
      );
    }
  }

  async function handleLogout() {
    try {
      if (driver?.uid) {
        await updateDriverAvailability({
          uid:
            driver.uid,

          disponivel:
            false,
        });
      }

      await logoutDriver();

      onNavigate?.(
        "/entregador/login",
      );
    } catch (logoutError) {
      console.error(
        "Erro ao sair:",
        logoutError,
      );

      setError(
        "Não foi possível sair.",
      );
    }
  }

  async function handleAcceptOrder(
    order,
  ) {
    if (
      !driver?.uid ||
      !order?.id ||
      !order?.establishmentId
    ) {
      return;
    }

    try {
      setAcceptingOrderId(
        order.id,
      );

      await acceptDeliveryOrder({
        establishmentId:
          order.establishmentId,

        orderId:
          order.id,

        driverUid:
          driver.uid,
      });

      console.log(
        "ENTREGA ACEITA:",
        {
          establishmentId:
            order.establishmentId,

          orderId:
            order.id,

          driverUid:
            driver.uid,
        },
      );
    } catch (error) {
      console.error(
        "Erro ao aceitar entrega:",
        error,
      );

      setError(
        error?.message ||
          "Não foi possível aceitar a entrega.",
      );
    } finally {
      setAcceptingOrderId(
        null,
      );
    }
  }

  if (loading) {
    return (
      <main className="driver-dashboard-page">
        <div className="driver-dashboard__loading">
          Carregando...
        </div>
      </main>
    );
  }

  return (
    <main className="driver-dashboard-page">
      <section className="driver-dashboard">
        <header className="driver-dashboard__header">
          <div>
            <span className="driver-dashboard__eyebrow">
              🛵 Área do entregador
            </span>

            <h1>
              Olá,{" "}
              {driver?.nome ||
                "Entregador"}
            </h1>

            <p>
              Gerencie sua disponibilidade
              e acompanhe as entregas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("/minhas-entregas")}
          >
            Minhas entregas
          </button>
          <button
            type="button"
            className="driver-dashboard__logout"
            onClick={
              handleLogout
            }
          >
            Sair
          </button>
        </header>

        {error && (
          <div
            className="driver-dashboard__error"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="driver-availability">
          <div>
            <span className="driver-availability__label">
              Disponibilidade
            </span>

            <strong>
              {driver?.disponivel
                ? "Você está online"
                : "Você está offline"}
            </strong>

            <p>
              {driver?.disponivel
                ? "Você poderá visualizar e aceitar pedidos disponíveis."
                : "Fique online para receber oportunidades de entrega."}
            </p>
          </div>

          <button
            type="button"
            className={
              driver?.disponivel
                ? "driver-availability__button driver-availability__button--online"
                : "driver-availability__button"
            }
            disabled={
              updatingAvailability
            }
            onClick={
              handleToggleAvailability
            }
          >
            <span
              className="driver-availability__dot"
            />

            {updatingAvailability
              ? "Atualizando..."
              : driver?.disponivel
                ? "Ficar offline"
                : "Ficar online"}
          </button>
        </section>

        <section className="driver-dashboard__content">
          <header>
            <div>
              <h2>
                Pedidos disponíveis
              </h2>

              <p>
                Entregas de estabelecimentos
                Premium aparecerão aqui.
              </p>
            </div>
          </header>

          {!driver?.disponivel ? (
            <div className="driver-dashboard__empty">
              <span>
                📴
              </span>

              <h3>
                Você está offline
              </h3>

              <p>
                Ative sua disponibilidade
                para visualizar pedidos.
              </p>
            </div>
          ) : (
            <div className="driver-dashboard__empty">
              <span>
                📦
              </span>

              {!driver?.disponivel ? (
                <div className="driver-dashboard__empty">
                    <span>📴</span>

                    <h3>
                    Você está offline
                    </h3>

                    <p>
                    Ative sua disponibilidade
                    para visualizar pedidos.
                    </p>
                </div>
                ) : ordersLoading ? (
                <div className="driver-dashboard__empty">
                    <span>⏳</span>

                    <h3>
                    Carregando entregas
                    </h3>

                    <p>
                    Buscando pedidos disponíveis.
                    </p>
                </div>
                ) : availableOrders.length ===
                0 ? (
                <div className="driver-dashboard__empty">
                    <span>📦</span>

                    <h3>
                    Nenhum pedido disponível
                    </h3>

                    <p>
                    Novas entregas aparecerão
                    automaticamente aqui.
                    </p>
                </div>
                ) : (
                <div className="driver-orders-list">
                    {availableOrders.map(
                    (order) => (
                        <article
                        key={`${order.establishmentId}-${order.id}`}
                        className="driver-order-card"
                        >
                        <div className="driver-order-card__header">
                            <div>
                            <span>
                                🏪 Estabelecimento
                            </span>

                            <strong>
                                {order.estabelecimento
                                ?.nome ||
                                "Estabelecimento"}
                            </strong>
                            </div>

                            <span className="driver-order-card__badge">
                            Nova entrega
                            </span>
                        </div>

                        <div className="driver-order-card__info">
                            <div>
                            <span>
                                📍 Destino
                            </span>

                            <strong>
                                {order.entrega
                                ?.endereco
                                ?.bairro ||
                                "Localização informada"}
                            </strong>

                            <small>
                                {order.entrega
                                ?.endereco
                                ?.cidade || ""}
                                {order.entrega
                                ?.endereco
                                ?.estado
                                ? ` - ${
                                    order.entrega
                                        .endereco
                                        .estado
                                    }`
                                : ""}
                            </small>
                            </div>

                            <div>
                            <span>
                                📏 Distância
                            </span>

                            <strong>
                                {Number(
                                order.entrega
                                    ?.rota
                                    ?.distanciaKm ||
                                    0,
                                ).toFixed(1)}
                                {" km"}
                            </strong>
                            </div>

                            <div>
                            <span>
                                ⏱ Tempo
                            </span>

                            <strong>
                                {Number(
                                order.entrega
                                    ?.rota
                                    ?.duracaoMinutos ||
                                    0,
                                )}
                                {" min"}
                            </strong>
                            </div>
                        </div>

                        <div className="driver-order-card__actions">
                            <button
                            type="button"
                            className="driver-order-card__details"
                            >
                            Ver detalhes
                            </button>

                            <button
                              type="button"
                              className="driver-order-card__accept"
                              disabled={
                                acceptingOrderId ===
                                order.id
                              }
                              onClick={() =>
                                handleAcceptOrder(
                                  order,
                                )
                              }
                            >
                              {acceptingOrderId ===
                              order.id
                                ? "Aceitando..."
                                : "Aceitar entrega"}
                            </button>
                        </div>
                        </article>
                    ),
                    )}
                </div>
                )}
              <p>
                Quando um estabelecimento
                Premium disponibilizar uma
                entrega, ela aparecerá aqui.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}