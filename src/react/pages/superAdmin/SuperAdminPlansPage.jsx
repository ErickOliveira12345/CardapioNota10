import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "../../services/superAdminService.js";

import { useAuth } from "../../contexts/AuthContext";
import { createAuditLog } from "../../services/auditService";
import PlanModal from "../../components/superAdmin/PlanModal.jsx";
import "../../styles/superAdminCommon.css";
import "../../styles/PlansPage.css";

function formatCurrencyFromCents(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number(value) || 0) / 100);
}

function getPlanFeatures(plan) {
  const features = plan.funcionalidades || {};
  const items = [];

  if (features.cardapioQrCode) {
    items.push("Cardápio digital com QR Code");
  }

  if (features.controlePedidos) {
    items.push("Controle de pedidos");
  }

  if (features.chamadosAtendimento) {
    items.push("Chamados de atendimento");
  }

  if (features.relatoriosVendas) {
    items.push("Relatórios de vendas");
  }

  if (features.relatoriosAvancados) {
    items.push("Relatórios avançados");
  }

  if (features.marcaPersonalizada) {
    items.push("Marca personalizada");
  }

  if (features.suportePrioritario) {
    items.push("Suporte prioritário");
  }

  items.push(
    features.maxProdutos === -1
      ? "Produtos ilimitados"
      : `Até ${features.maxProdutos || 0} produtos`,
  );

  items.push(
    features.maxCategorias === -1
      ? "Categorias ilimitadas"
      : `Até ${features.maxCategorias || 0} categorias`,
  );

  items.push(
    features.maxMesas === -1
      ? "Mesas ilimitadas"
      : `Até ${features.maxMesas || 0} mesas`,
  );

  items.push(
    features.maxFuncionarios === -1
      ? "Funcionários ilimitados"
      : `Até ${features.maxFuncionarios || 0} funcionários`,
  );

  return items;
}

export default function SuperAdminPlansPage() {
  const { user: currentUser, profile: userProfile} = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [planToDelete, setPlanToDelete] = useState(null);
  const [deletingPlan, setDeletingPlan] = useState(false);

  const closePlanModal = useCallback(() => {
  if (savingPlan) {
    return;
  }

  setEditingPlan(null);
  setCreatingNew(false);
  setError("");
}, [savingPlan]);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const loadedPlans = await getAllPlans();
      setPlans(loadedPlans);
    } catch (loadError) {
      console.error("Erro ao carregar planos:", loadError);

      setError(
        loadError?.message ||
          "Não foi possível carregar os planos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);
  
  function showSuccess(message) {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  }

  async function handleToggleStatus(plan) {
    const newStatus = !plan.ativo;

    try {
      setUpdatingStatusId(plan.id);
      setError("");
      setSuccessMessage("");

      await updatePlan(plan.id, {
        ativo: newStatus,
      });

      setPlans((currentPlans) =>
        currentPlans.map((currentPlan) =>
          currentPlan.id === plan.id
            ? {
                ...currentPlan,
                ativo: newStatus,
              }
            : currentPlan,
        ),
      );

      showSuccess(
        newStatus
          ? `O plano "${plan.nome}" foi ativado com sucesso.`
          : `O plano "${plan.nome}" foi desativado com sucesso.`,
      );
    } catch (statusError) {
      console.error("Erro ao alterar status do plano:", statusError);

      setError(
        statusError?.message ||
          "Não foi possível alterar o status do plano.",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  function handleEditPlan(plan) {
    setError("");
    setSuccessMessage("");
    setCreatingNew(false);
    setEditingPlan(plan);
  }

  function handleNewPlan() {
    setEditingPlan(null);
    setCreatingNew(true);
    setError("");
    setSuccessMessage("");
  }

  async function handleCreatePlan(planData) {
    try {
      setSavingPlan(true);
      setError("");
      setSuccessMessage("");

      const planId = await createPlan(planData);

      try {
        await createAuditLog({
          usuarioId: currentUser?.uid || null,
          usuario:
            currentUser?.displayName ||
            currentUser?.email ||
            "Administrador da Plataforma",
          usuarioEmail: currentUser?.email || null,
          acao: `Criou o plano ${
            planData.nome || planId
          }`,
          recurso: `plans/${planId}`,
          tipo: "create",
          detalhes: {
            planoId: planId,
            codigo: planData.codigo || planId,
            nome: planData.nome || "",
          },
        });
      } catch (auditError) {
        console.error(
          "O plano foi criado, mas não foi possível registrar a auditoria:",
          auditError,
        );
      }

      await loadPlans();

      setCreatingNew(false);

      showSuccess(
        `O plano "${planData.nome}" foi criado com sucesso.`,
      );
    } catch (createError) {
      console.error(
        "Erro ao criar plano:",
        createError,
      );

      setError(
        createError?.message ||
          "Não foi possível criar o plano.",
      );

      throw createError;
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleUpdatePlan(planData) {
    if (!editingPlan?.id) {
      throw new Error("Plano selecionado inválido.");
    }

    try {
      setSavingPlan(true);
      setError("");
      setSuccessMessage("");

      await updatePlan(editingPlan.id, planData);

      await createAuditLog({
        usuarioId: currentUser?.uid || null,
        usuario:
          currentUser?.displayName ||
          currentUser?.email ||
          "Administrador da Plataforma",
        usuarioEmail: currentUser?.email || null,
        acao: `Atualizou o plano ${
          planData.nome ||
          editingPlan.nome ||
          editingPlan.id
        }`,
        recurso: `plans/${editingPlan.id}`,
        tipo: "update",
        detalhes: {
          planoId: editingPlan.id,
          nome:
            planData.nome ||
            editingPlan.nome ||
            "",
        },
      });

      setPlans((currentPlans) =>
        currentPlans.map((plan) =>
          plan.id === editingPlan.id
            ? {
                ...plan,
                ...planData,
              }
            : plan,
        ),
      );

      setEditingPlan(null);

      showSuccess(
        `O plano "${planData.nome}" foi atualizado com sucesso.`,
      );
    } catch (updateError) {
      console.error(
        "Erro ao atualizar plano:",
        updateError,
      );

      setError(
        updateError?.message ||
          "Não foi possível atualizar o plano.",
      );

      throw updateError;
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleDeletePlan(plan) {
    if (!plan?.id) {
      setError("Plano selecionado inválido.");
      return false;
    }

    const planName = plan.nome || plan.id;

    const totalAssinantes = Number(
      plan.totalAssinantes ?? 0,
    );

    if (totalAssinantes > 0) {
      setError(
        `O plano "${planName}" possui assinantes e não pode ser excluído.`,
      );

      return false;
    }

    try {
      setSavingPlan(true);
      setError("");
      setSuccessMessage("");

      await deletePlan(plan.id);

      await createAuditLog({
        usuarioId: currentUser?.uid || null,
        usuario:
          currentUser?.displayName ||
          currentUser?.email ||
          "Administrador da Plataforma",
        usuarioEmail: currentUser?.email || null,
        acao: `Excluiu o plano ${planName}`,
        recurso: `plans/${plan.id}`,
        tipo: "delete",
        detalhes: {
          planoId: plan.id,
          nome: planName,
        },
      });

      setPlans((currentPlans) =>
        currentPlans.filter(
          (currentPlan) =>
            currentPlan.id !== plan.id,
        ),
      );

      if (editingPlan?.id === plan.id) {
        setEditingPlan(null);
      }

      showSuccess(
        `O plano "${planName}" foi excluído com sucesso.`,
      );

      return true;
    } catch (deleteError) {
      console.error(
        "Erro ao excluir plano:",
        deleteError,
      );

      setError(
        deleteError?.message ||
          "Não foi possível excluir o plano.",
      );

      return false;
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleConfirmDeletePlan() {
    if (!planToDelete?.id || deletingPlan) {
      return;
    }

    if (planToDelete.protegido) {
      setError("Este plano é protegido e não pode ser excluído.");
      setPlanToDelete(null);
      return;
    }

    try {
      setDeletingPlan(true);

      const deleted = await handleDeletePlan(planToDelete);

      if (deleted) {
        setPlanToDelete(null);
      }
    } catch (error) {
      console.error(
        "Falha ao confirmar exclusão:",
        error,
      );
    } finally {
      setDeletingPlan(false);
    }
  }

  const isProtectedPlan = (plan) => {
    return plan?.protegido === true;
  };
  
  return (
    <section className="super-admin-page">
      <header className="super-admin-page__header">
        <div>
          <span className="super-admin-page__eyebrow">
            Produtos e preços
          </span>

          <h1>Planos</h1>

          <p>
            Configure os planos comercializados pela plataforma.
          </p>
        </div>

        <button
          type="button"
          className="super-admin-button"
          onClick={handleNewPlan}
        >
          + Novo plano
        </button>
      </header>

      {successMessage && (
        <div className="plans-success-message">
          <span className="plans-success-message__icon">✓</span>

          <div>
            <strong>Operação concluída</strong>
            <p>{successMessage}</p>
          </div>

          <button
            type="button"
            aria-label="Fechar mensagem"
            onClick={() => setSuccessMessage("")}
          >
            ×
          </button>
        </div>
      )}

      {error && !editingPlan && (
        <div className="super-admin-alert super-admin-alert--error">
          {error}
        </div>
      )}

      {loading && (
        <div className="super-admin-loading">
          Carregando planos...
        </div>
      )}

      {!loading && plans.length === 0 && !error && (
        <div className="super-admin-empty-state">
          Nenhum plano foi encontrado.
        </div>
      )}

      {!loading && plans.length > 0 && (
        <div className="super-admin-plan-grid">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="super-admin-plan-card"
            >
              <div className="super-admin-plan-card__header">
                <div>
                  <h2>{plan.nome}</h2>
                  <p>{plan.descricao}</p>
                </div>

                <span
                  className={`super-admin-status ${
                    plan.ativo
                      ? "super-admin-status--active"
                      : "super-admin-status--inactive"
                  }`}
                >
                  {plan.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="super-admin-plan-card__price">
                <strong>
                  {formatCurrencyFromCents(plan.precoMensal)}
                </strong>
                <span>/mês</span>
              </div>

              {plan.teste?.habilitado && plan.teste?.dias > 0 && (
                <p className="super-admin-plan-card__offer">
                  {plan.teste.dias} dias gratuitos
                </p>
              )}

              {plan.promocao?.habilitada &&
                plan.promocao?.preco > 0 && (
                  <p className="super-admin-plan-card__offer">
                    Primeiro mês por{" "}
                    {formatCurrencyFromCents(
                      plan.promocao.preco,
                    )}
                  </p>
                )}

              <ul>
                {getPlanFeatures(plan).map((feature) => (
                  <li key={feature}>✓ {feature}</li>
                ))}
              </ul>

              <div className="super-admin-plan-card__actions">
                <button
                  type="button"
                  onClick={() => handleEditPlan(plan)}
                >
                  Editar
                </button>

                <button
                  type="button"
                  disabled={updatingStatusId === plan.id}
                  onClick={() => handleToggleStatus(plan)}
                >
                  {updatingStatusId === plan.id
                    ? "Salvando..."
                    : plan.ativo
                      ? "Desativar"
                      : "Ativar"}
                </button>
                {!isProtectedPlan(plan) && (
                  <button
                    type="button"
                    disabled={savingPlan || deletingPlan}
                    onClick={() => setPlanToDelete(plan)}
                  >
                    Excluir
                  </button>
                )}
              </div>

              
            </article>
          ))}
        </div>
      )}

      {planToDelete && (
                <div className="plan-confirm-overlay">
                  <div className="plan-confirm-modal">
                    <div className="plan-confirm-icon">
                      🗑️
                    </div>

                    <h2>Excluir plano</h2>

                    <p>
                      Tem certeza que deseja excluir o plano
                      <strong>
                        {" "}
                        "{planToDelete.nome}"
                      </strong>
                      ?
                    </p>

                    <span>
                      Esta ação não poderá ser desfeita.
                    </span>

                    <div className="plan-confirm-actions">
                      <button
                        type="button"
                        onClick={() => {
                          console.log("Botão cancelar clicado");
                          setPlanToDelete(null);
                        }}
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        className="danger"
                        disabled={deletingPlan}
                        onClick={handleConfirmDeletePlan}
                      >
                        {deletingPlan
                          ? "Excluindo..."
                          : "Excluir"}
                      </button>

                    </div>
                  </div>
                </div>
              )}

      <PlanModal
        isOpen={creatingNew}
        mode="create"
        saving={savingPlan}
        externalError={error}
        onClose={closePlanModal}
        onSubmit={handleCreatePlan}
      />

      <PlanModal
        isOpen={Boolean(editingPlan)}
        mode="edit"
        plan={editingPlan}
        saving={savingPlan}
        externalError={error}
        onClose={closePlanModal}
        onSubmit={handleUpdatePlan}
      />

    </section>
  );
}