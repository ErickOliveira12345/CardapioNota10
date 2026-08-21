import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  approveDriver,
  blockDriver,
  observeDeliveryDrivers,
  setDriverPending,
} from "../../services/driverAdminService.js";

import {
  showToast,
} from "../../services/toast.js";

import {
  useAuth,
} from "../../contexts/AuthContext.jsx";

// Importe quando quiser utilizar
// o CSS específico da página.
import "../../styles/superAdmin/superAdminDrivers.css";

export default function SuperAdminDriversPage() {
  /*
   * Usuário autenticado.
   *
   * Neste painel esperamos que seja
   * o Super Admin.
   */
  const {
    user,
    isSuperAdmin,
  } = useAuth();

  const [
    drivers,
    setDrivers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    filter,
    setFilter,
  ] = useState("all");

  const [
    processingId,
    setProcessingId,
  ] = useState(null);

  const [
    confirmModal,
    setConfirmModal,
  ] = useState({
    open: false,
    action: null,
    driver: null,
  });

  /*
   * Escuta os entregadores
   * cadastrados em tempo real.
   */
  useEffect(() => {
    const unsubscribe =
      observeDeliveryDrivers(
        (data) => {
          setDrivers(data);
          setLoading(false);
        },

        (error) => {
          console.error(
            "Erro ao carregar entregadores:",
            error,
          );

          setLoading(false);

          showToast(
            "Não foi possível carregar os entregadores.",
            "error",
            5000,
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
  }, []);

  /*
   * Entregadores filtrados.
   */
  const filteredDrivers =
    useMemo(() => {
      if (filter === "all") {
        return drivers;
      }

      return drivers.filter(
        (driver) =>
          driver.status ===
          filter,
      );
    }, [
      drivers,
      filter,
    ]);

  /*
   * Contadores.
   */
  const counters =
    useMemo(() => {
      return {
        all:
          drivers.length,

        pending:
          drivers.filter(
            (driver) =>
              driver.status ===
              "pending",
          ).length,

        approved:
          drivers.filter(
            (driver) =>
              driver.status ===
              "approved",
          ).length,

        blocked:
          drivers.filter(
            (driver) =>
              driver.status ===
              "blocked",
          ).length,
      };
    }, [
      drivers,
    ]);

  /*
   * APROVAR ENTREGADOR
   */
  async function handleApprove(
    driver,
  ) {
    /*
    * Verifica se existe
    * usuário autenticado.
    */
    if (!user?.uid) {
      showToast(
        "Super Admin não identificado.",
        "error",
        4000,
      );

      return;
    }

    /*
    * Confirma se realmente
    * é Super Admin.
    */
    if (!isSuperAdmin) {
      showToast(
        "Você não possui permissão para aprovar entregadores.",
        "error",
        4000,
      );

      return;
    }

    try {
      setProcessingId(
        driver.id,
      );

      await approveDriver({
        driverId:
          driver.id,

        superAdminUid:
          user.uid,
      });

      showToast(
        "Entregador aprovado com sucesso.",
        "success",
        3500,
      );

      /*
      * Fecha o modal somente
      * depois da aprovação.
      */
      closeConfirmModal();
    } catch (error) {
      console.error(
        "Erro ao aprovar entregador:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível aprovar.",
        "error",
        5000,
      );
    } finally {
      setProcessingId(
        null,
      );
    }
  }

  /*
   * BLOQUEAR ENTREGADOR
   */
  async function handleBlock(
    driver,
  ) {
    if (!user?.uid) {
      showToast(
        "Super Admin não identificado.",
        "error",
        4000,
      );

      return;
    }

    if (!isSuperAdmin) {
      showToast(
        "Você não possui permissão para bloquear entregadores.",
        "error",
        4000,
      );

      return;
    }

    try {
      setProcessingId(
        driver.id,
      );

      await blockDriver({
        driverId:
          driver.id,

        superAdminUid:
          user.uid,
      });

      showToast(
        "Entregador bloqueado.",
        "success",
        3500,
      );
      closeConfirmModal();
    } catch (error) {
      console.error(
        "Erro ao bloquear entregador:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível bloquear.",
        "error",
        5000,
      );
    } finally {
      setProcessingId(
        null,
      );
    }
  }

  /*
   * DEVOLVER PARA ANÁLISE
   */
  async function handlePending(
    driver,
  ) {
    if (!user?.uid) {
      showToast(
        "Super Admin não identificado.",
        "error",
        4000,
      );

      return;
    }

    if (!isSuperAdmin) {
      showToast(
        "Você não possui permissão para alterar este cadastro.",
        "error",
        4000,
      );

      return;
    }

    try {
      setProcessingId(
        driver.id,
      );

      await setDriverPending({
        driverId:
          driver.id,

        superAdminUid:
          user.uid,
      });

      showToast(
        "Cadastro movido para análise.",
        "success",
        3500,
      );
      closeConfirmModal();
    } catch (error) {
      console.error(
        "Erro ao atualizar entregador:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível atualizar.",
        "error",
        5000,
      );
    } finally {
      setProcessingId(
        null,
      );
    }
  }

  function openConfirmModal(
    action,
    driver,
  ) {
    setConfirmModal({
      open: true,
      action,
      driver,
    });
  }

  function closeConfirmModal() {
    setConfirmModal({
      open: false,
      action: null,
      driver: null,
    });
  }

  const modalConfig = {
    approve: {
      icon: "✓",
      title: "Aprovar entregador?",
      message:
        "Após a aprovação, o entregador poderá acessar o painel e receber entregas.",
      confirmText:
        "Sim, aprovar",
      confirmClass:
        "driver-confirm-modal__approve",
    },

    block: {
      icon: "⛔",
      title: "Bloquear entregador?",
      message:
        "O entregador ficará impedido de acessar as entregas até ser liberado novamente.",
      confirmText:
        "Sim, bloquear",
      confirmClass:
        "driver-confirm-modal__block",
    },

    pending: {
      icon: "↩",
      title: "Enviar para análise?",
      message:
        "O cadastro voltará para o status de aguardando aprovação.",
      confirmText:
        "Enviar para análise",
      confirmClass:
        "driver-confirm-modal__pending",
    },
  };

  async function handleConfirmAction() {
    const {
      action,
      driver,
    } = confirmModal;

    if (
      !action ||
      !driver
    ) {
      return;
    }

    try {
      if (
        action ===
        "approve"
      ) {
        await handleApprove(
          driver,
        );

        return;
      }

      if (
        action ===
        "block"
      ) {
        await handleBlock(
          driver,
        );

        return;
      }

      if (
        action ===
        "pending"
      ) {
        await handlePending(
          driver,
        );
      }
    } catch (error) {
      console.error(
        "Erro na ação do entregador:",
        error,
      );
    }
  }

  function handleCloseConfirm() {
    if (processingId) {
      return;
    }

    setConfirmModal({
      open: false,
      driver: null,
    });
  }

  async function handleConfirmApprove() {
    const driver =
      confirmModal.driver;

    if (!driver) {
      return;
    }

    await handleApprove(
      driver,
    );

    setConfirmModal({
      open: false,
      driver: null,
    });
  }

  return (
    <main className="super-admin-drivers">
      <header className="super-admin-drivers__header">
        <div>
          <h1>
            🛵 Entregadores
          </h1>

          <p>
            Gerencie os entregadores
            cadastrados na plataforma.
          </p>
        </div>
      </header>

      {/* ==========================
          RESUMO
         ========================== */}

      <section className="super-admin-drivers__stats">
        <article>
          <span>
            Total
          </span>

          <strong>
            {counters.all}
          </strong>
        </article>

        <article>
          <span>
            Aguardando
          </span>

          <strong>
            {counters.pending}
          </strong>
        </article>

        <article>
          <span>
            Aprovados
          </span>

          <strong>
            {counters.approved}
          </strong>
        </article>

        <article>
          <span>
            Bloqueados
          </span>

          <strong>
            {counters.blocked}
          </strong>
        </article>
      </section>

      {/* ==========================
          FILTROS
         ========================== */}

      <div className="super-admin-drivers__filters">
        <button
          type="button"
          className={
            filter === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("all")
          }
        >
          Todos ({counters.all})
        </button>

        <button
          type="button"
          className={
            filter === "pending"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter(
              "pending",
            )
          }
        >
          Aguardando ({counters.pending})
        </button>

        <button
          type="button"
          className={
            filter === "approved"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter(
              "approved",
            )
          }
        >
          Aprovados ({counters.approved})
        </button>

        <button
          type="button"
          className={
            filter === "blocked"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter(
              "blocked",
            )
          }
        >
          Bloqueados ({counters.blocked})
        </button>
      </div>

      {/* ==========================
          LISTA
         ========================== */}

      {loading ? (
        <div className="super-admin-drivers__empty">
          Carregando entregadores...
        </div>
      ) : filteredDrivers.length ===
        0 ? (
        <div className="super-admin-drivers__empty">
          Nenhum entregador encontrado.
        </div>
      ) : (
        <div className="super-admin-drivers__list">
          {filteredDrivers.map(
            (driver) => {
              const processing =
                processingId ===
                driver.id;

              return (
                <article
                  key={
                    driver.id
                  }
                  className="driver-admin-card"
                >
                  {/* DADOS PRINCIPAIS */}

                  <div className="driver-admin-card__main">
                    <div className="driver-admin-card__avatar">
                      {String(
                        driver.nome ||
                          "E",
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h3>
                        {driver.nome ||
                          "Entregador"}
                      </h3>

                      <p>
                        {driver.email ||
                          "E-mail não informado"}
                      </p>

                      <p>
                        {driver.telefone ||
                          "Telefone não informado"}
                      </p>
                    </div>
                  </div>

                  {/* DOCUMENTOS */}

                  <div className="driver-admin-card__document">
                    <strong>
                      CPF
                    </strong>

                    <span>
                      {driver.cpf ||
                        "-"}
                    </span>
                  </div>

                  {/* VEÍCULO */}

                  <div className="driver-admin-card__vehicle">
                    <strong>
                      Veículo
                    </strong>

                    <span>
                      {driver.veiculo
                        ?.tipo ||
                        "-"}
                    </span>

                    {driver.veiculo
                      ?.placa && (
                      <span>
                        Placa:{" "}
                        {
                          driver
                            .veiculo
                            .placa
                        }
                      </span>
                    )}
                  </div>

                  {/* STATUS */}

                  <div className="driver-admin-card__status">
                    <span
                      className={`driver-status driver-status--${
                        driver.status ||
                        "pending"
                      }`}
                    >
                      {driver.status ===
                      "approved"
                        ? "Aprovado"
                        : driver.status ===
                            "blocked"
                          ? "Bloqueado"
                          : "Aguardando"}
                    </span>

                    {driver.status ===
                      "approved" && (
                      <small>
                        {driver.disponivel
                          ? "🟢 Online"
                          : "⚪ Offline"}
                      </small>
                    )}
                  </div>

                  {/* ==================
                      AÇÕES
                     ================== */}

                  <div className="driver-admin-card__actions">
                    {driver.status !==
                      "approved" && (
                      <button
                        type="button"
                        disabled={processing}
                        onClick={() =>
                          openConfirmModal(
                            "approve",
                            driver,
                          )
                        }
                      >
                        {processing
                          ? "Processando..."
                          : "✓ Aprovar"}
                      </button>
                    )}

                    {driver.status !==
                      "pending" && (
                      <button
                        type="button"
                        disabled={processing}
                        onClick={() =>
                          openConfirmModal(
                            "pending",
                            driver,
                          )
                        }
                      >
                        {processing
                          ? "Processando..."
                          : "↩ Revisar"}
                      </button>
                    )}

                    {driver.status !==
                      "blocked" && (
                      <button
                        type="button"
                        className="danger"
                        disabled={processing}
                        onClick={() =>
                          openConfirmModal(
                            "block",
                            driver,
                          )
                        }
                      >
                        {processing
                          ? "Processando..."
                          : "⛔ Bloquear"}
                      </button>
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}

      {confirmModal.open && (
        <div
          className="driver-confirm-overlay"
          onClick={
            closeConfirmModal
          }
        >
          <div
            className="driver-confirm-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className={`driver-confirm-modal__icon driver-confirm-modal__icon--${
                confirmModal.action
              }`}
            >
              {
                modalConfig[
                  confirmModal.action
                ]?.icon
              }
            </div>

            <div className="driver-confirm-modal__content">
              <h2>
                {
                  modalConfig[
                    confirmModal.action
                  ]?.title
                }
              </h2>

              <p>
                <strong>
                  {confirmModal.driver
                    ?.nome ||
                    "Entregador"}
                </strong>
              </p>

              <p>
                {
                  modalConfig[
                    confirmModal.action
                  ]?.message
                }
              </p>
            </div>

            <div className="driver-confirm-modal__actions">
              <button
                type="button"
                className="driver-confirm-modal__cancel"
                disabled={
                  Boolean(processingId)
                }
                onClick={
                  closeConfirmModal
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className={
                  modalConfig[
                    confirmModal.action
                  ]?.confirmClass
                }
                disabled={
                  Boolean(processingId)
                }
                onClick={
                  handleConfirmAction
                }
              >
                {processingId
                  ? "Processando..."
                  : modalConfig[
                      confirmModal.action
                    ]?.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}