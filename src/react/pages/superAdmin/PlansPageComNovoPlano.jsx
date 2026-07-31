import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createPlan,
  getAllPlans,
  updatePlan,
} from "../../services/superAdminService";

import "../../styles/superAdminCommon.css";
import "../../styles/PlansPage.css";

const EMPTY_FORM = {
  codigo: "",
  ordem: "1",
  nome: "",
  descricao: "",
  precoMensal: "",
  ativo: true,
  testeHabilitado: false,
  testeDias: "0",
  testePreco: "0",
  promocaoHabilitada: false,
  promocaoPreco: "0",
  promocaoMeses: "0",
  maxProdutos: "0",
  maxCategorias: "0",
  maxMesas: "0",
  maxFuncionarios: "0",
  cardapioQrCode: false,
  controlePedidos: false,
  chamadosAtendimento: false,
  relatoriosVendas: false,
  relatoriosAvancados: false,
  marcaPersonalizada: false,
  suportePrioritario: false,
};

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

function moneyInputToCents(value) {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingPlan, setSavingPlan] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const closeEditModal = useCallback(() => {
    if (savingPlan) {
      return;
    }

    setEditingPlan(null);
    setCreatingPlan(false);
    setEditForm(EMPTY_FORM);
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

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeEditModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeEditModal]);

  function showSuccess(message) {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  }

  function handleNewPlan() {
    const nextOrder =
      plans.reduce(
        (highest, plan) =>
          Math.max(highest, Number(plan.ordem) || 0),
        0,
      ) + 1;

    setError("");
    setSuccessMessage("");
    setEditingPlan(null);
    setCreatingPlan(true);
    setEditForm({
      ...EMPTY_FORM,
      ordem: String(nextOrder),
      ativo: true,
      cardapioQrCode: true,
      controlePedidos: true,
      chamadosAtendimento: true,
    });
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
    const funcionalidades = plan.funcionalidades || {};

    setError("");
    setSuccessMessage("");
    setEditingPlan(plan);

    setEditForm({
      codigo: plan.codigo ?? plan.id ?? "",
      ordem: String(plan.ordem ?? 1),
      nome: plan.nome ?? "",
      descricao: plan.descricao ?? "",
      precoMensal:
        plan.precoMensal != null
          ? String(plan.precoMensal / 100)
          : "",
      ativo: plan.ativo !== false,
      testeHabilitado: plan.teste?.habilitado === true,
      testeDias: String(plan.teste?.dias ?? 0),
      testePreco:
        plan.teste?.preco != null
          ? String(plan.teste.preco / 100)
          : "0",
      promocaoHabilitada:
        plan.promocao?.habilitada === true,
      promocaoPreco:
        plan.promocao?.preco != null
          ? String(plan.promocao.preco / 100)
          : "0",
      promocaoMeses: String(plan.promocao?.meses ?? 0),
      maxProdutos: String(funcionalidades.maxProdutos ?? 0),
      maxCategorias: String(funcionalidades.maxCategorias ?? 0),
      maxMesas: String(funcionalidades.maxMesas ?? 0),
      maxFuncionarios: String(
        funcionalidades.maxFuncionarios ?? 0,
      ),
      cardapioQrCode:
        funcionalidades.cardapioQrCode === true,
      controlePedidos:
        funcionalidades.controlePedidos === true,
      chamadosAtendimento:
        funcionalidades.chamadosAtendimento === true,
      relatoriosVendas:
        funcionalidades.relatoriosVendas === true,
      relatoriosAvancados:
        funcionalidades.relatoriosAvancados === true,
      marcaPersonalizada:
        funcionalidades.marcaPersonalizada === true,
      suportePrioritario:
        funcionalidades.suportePrioritario === true,
    });
  }

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleUpdatePlan(event) {
    event.preventDefault();

    if (!creatingPlan && !editingPlan?.id) {
      setError("Plano selecionado inválido.");
      return;
    }

    const codigo = editForm.codigo
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const ordem = Number(editForm.ordem);
    const nome = editForm.nome.trim();
    const descricao = editForm.descricao.trim();
    const precoMensal = moneyInputToCents(editForm.precoMensal);
    const testePreco = moneyInputToCents(editForm.testePreco || 0);
    const promocaoPreco = moneyInputToCents(
      editForm.promocaoPreco || 0,
    );

    if (!codigo) {
      setError(
        "Informe um código válido para o plano, como empresarial.",
      );
      return;
    }

    if (!nome || !descricao) {
      setError("Preencha o nome e a descrição do plano.");
      return;
    }

    if (!Number.isInteger(ordem) || ordem < 1) {
      setError("Informe uma ordem válida, começando em 1.");
      return;
    }

    if (precoMensal == null) {
      setError("Informe um preço mensal válido.");
      return;
    }

    if (testePreco == null) {
      setError("Informe um preço de teste válido.");
      return;
    }

    if (promocaoPreco == null) {
      setError("Informe um preço promocional válido.");
      return;
    }

    const numericFields = {
      testeDias: Number(editForm.testeDias || 0),
      promocaoMeses: Number(editForm.promocaoMeses || 0),
      maxProdutos: Number(editForm.maxProdutos),
      maxCategorias: Number(editForm.maxCategorias),
      maxMesas: Number(editForm.maxMesas),
      maxFuncionarios: Number(editForm.maxFuncionarios),
    };

    const hasInvalidNumber = Object.values(numericFields).some(
      (value) => Number.isNaN(value),
    );

    if (hasInvalidNumber) {
      setError("Revise os limites numéricos informados.");
      return;
    }

    if (
      numericFields.testeDias < 0 ||
      numericFields.promocaoMeses < 0
    ) {
      setError(
        "Dias de teste e meses de promoção não podem ser negativos.",
      );
      return;
    }

    const planData = {
      codigo,
      ordem,
      nome,
      descricao,
      ativo: Boolean(editForm.ativo),
      precoMensal,
      cobranca: {
        ciclo: "monthly",
        intervalo: 1,
      },
      teste: {
        habilitado: Boolean(editForm.testeHabilitado),
        dias: numericFields.testeDias,
        preco: testePreco,
      },
      promocao: {
        habilitada: Boolean(editForm.promocaoHabilitada),
        preco: promocaoPreco,
        meses: numericFields.promocaoMeses,
      },
      funcionalidades: {
        ...(editingPlan?.funcionalidades || {}),
        maxProdutos: numericFields.maxProdutos,
        maxCategorias: numericFields.maxCategorias,
        maxMesas: numericFields.maxMesas,
        maxFuncionarios: numericFields.maxFuncionarios,
        cardapioQrCode: Boolean(editForm.cardapioQrCode),
        controlePedidos: Boolean(editForm.controlePedidos),
        chamadosAtendimento: Boolean(
          editForm.chamadosAtendimento,
        ),
        relatoriosVendas: Boolean(editForm.relatoriosVendas),
        relatoriosAvancados: Boolean(
          editForm.relatoriosAvancados,
        ),
        marcaPersonalizada: Boolean(
          editForm.marcaPersonalizada,
        ),
        suportePrioritario: Boolean(
          editForm.suportePrioritario,
        ),
      },
    };

    if (creatingPlan) {
      planData.mercadoPagoPlanId = null;
    }

    try {
      setSavingPlan(true);
      setError("");
      setSuccessMessage("");

      if (creatingPlan) {
        await createPlan(planData);
        await loadPlans();

        showSuccess(
          `O plano "${planData.nome}" foi criado com sucesso.`,
        );
      } else {
        await updatePlan(editingPlan.id, planData);

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

        showSuccess(
          `O plano "${planData.nome}" foi atualizado com sucesso.`,
        );
      }

      setEditingPlan(null);
      setCreatingPlan(false);
      setEditForm(EMPTY_FORM);
    } catch (updateError) {
      console.error("Erro ao atualizar plano:", updateError);

      setError(
        updateError?.message ||
          "Não foi possível atualizar o plano.",
      );
    } finally {
      setSavingPlan(false);
    }
  }

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
              </div>
            </article>
          ))}
        </div>
      )}

      {(editingPlan || creatingPlan) && (
        <div
          className="plan-edit-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingPlan
            ) {
              closeEditModal();
            }
          }}
        >
          <div
            className="plan-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-edit-title"
          >
            <div className="plan-edit-modal__header">
              <div>
                <span className="plan-edit-modal__eyebrow">
                  Configuração do plano
                </span>

                <h2 id="plan-edit-title">
                  {creatingPlan
                    ? "Adicionar novo plano"
                    : `Editar ${editingPlan?.nome || "plano"}`}
                </h2>
              </div>

              <button
                type="button"
                className="plan-edit-modal__close"
                aria-label="Fechar edição"
                disabled={savingPlan}
                onClick={closeEditModal}
              >
                ×
              </button>
            </div>

            <form
              className="plan-edit-form"
              onSubmit={handleUpdatePlan}
            >
              {error && (
                <div className="super-admin-alert super-admin-alert--error">
                  {error}
                </div>
              )}

              <div className="plan-edit-form__grid">
                <label>
                  <span>Código do plano</span>
                  <input
                    type="text"
                    name="codigo"
                    value={editForm.codigo}
                    onChange={handleInputChange}
                    disabled={savingPlan || !creatingPlan}
                    placeholder="ex.: empresarial"
                    required
                  />
                  <small>
                    Use letras minúsculas, números e hífen.
                  </small>
                </label>

                <label>
                  <span>Ordem de exibição</span>
                  <input
                    type="number"
                    name="ordem"
                    min="1"
                    step="1"
                    value={editForm.ordem}
                    onChange={handleInputChange}
                    disabled={savingPlan}
                    required
                  />
                </label>
              </div>

              <label>
                <span>Nome do plano</span>
                <input
                  type="text"
                  name="nome"
                  value={editForm.nome}
                  onChange={handleInputChange}
                  disabled={savingPlan}
                  required
                />
              </label>

              <label>
                <span>Descrição</span>
                <textarea
                  name="descricao"
                  value={editForm.descricao}
                  onChange={handleInputChange}
                  disabled={savingPlan}
                  rows="4"
                  required
                />
              </label>

              <div className="plan-edit-form__grid">
                <label>
                  <span>Valor mensal (R$)</span>
                  <input
                    type="number"
                    name="precoMensal"
                    min="0"
                    step="0.01"
                    value={editForm.precoMensal}
                    onChange={handleInputChange}
                    disabled={savingPlan}
                    required
                  />
                </label>

                <label>
                  <span>Status</span>
                  <select
                    name="ativo"
                    value={String(editForm.ativo)}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        ativo: event.target.value === "true",
                      }))
                    }
                    disabled={savingPlan}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </label>
              </div>

              <fieldset className="plan-edit-form__fieldset">
                <legend>Período de teste</legend>

                <label className="plan-edit-form__checkbox">
                  <input
                    type="checkbox"
                    name="testeHabilitado"
                    checked={editForm.testeHabilitado}
                    onChange={handleInputChange}
                    disabled={savingPlan}
                  />
                  <span>Habilitar período de teste</span>
                </label>

                <div className="plan-edit-form__grid">
                  <label>
                    <span>Dias de teste</span>
                    <input
                      type="number"
                      name="testeDias"
                      min="0"
                      step="1"
                      value={editForm.testeDias}
                      onChange={handleInputChange}
                      disabled={
                        savingPlan || !editForm.testeHabilitado
                      }
                    />
                  </label>

                  <label>
                    <span>Preço durante o teste (R$)</span>
                    <input
                      type="number"
                      name="testePreco"
                      min="0"
                      step="0.01"
                      value={editForm.testePreco}
                      onChange={handleInputChange}
                      disabled={
                        savingPlan || !editForm.testeHabilitado
                      }
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset className="plan-edit-form__fieldset">
                <legend>Promoção</legend>

                <label className="plan-edit-form__checkbox">
                  <input
                    type="checkbox"
                    name="promocaoHabilitada"
                    checked={editForm.promocaoHabilitada}
                    onChange={handleInputChange}
                    disabled={savingPlan}
                  />
                  <span>Habilitar promoção</span>
                </label>

                <div className="plan-edit-form__grid">
                  <label>
                    <span>Preço promocional (R$)</span>
                    <input
                      type="number"
                      name="promocaoPreco"
                      min="0"
                      step="0.01"
                      value={editForm.promocaoPreco}
                      onChange={handleInputChange}
                      disabled={
                        savingPlan || !editForm.promocaoHabilitada
                      }
                    />
                  </label>

                  <label>
                    <span>Duração em meses</span>
                    <input
                      type="number"
                      name="promocaoMeses"
                      min="0"
                      step="1"
                      value={editForm.promocaoMeses}
                      onChange={handleInputChange}
                      disabled={
                        savingPlan || !editForm.promocaoHabilitada
                      }
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset className="plan-edit-form__fieldset">
                <legend>Limites do plano</legend>

                <div className="plan-edit-form__grid">
                  <label>
                    <span>Máximo de produtos</span>
                    <input
                      type="number"
                      name="maxProdutos"
                      min="-1"
                      step="1"
                      value={editForm.maxProdutos}
                      onChange={handleInputChange}
                      disabled={savingPlan}
                    />
                  </label>

                  <label>
                    <span>Máximo de categorias</span>
                    <input
                      type="number"
                      name="maxCategorias"
                      min="-1"
                      step="1"
                      value={editForm.maxCategorias}
                      onChange={handleInputChange}
                      disabled={savingPlan}
                    />
                  </label>

                  <label>
                    <span>Máximo de mesas</span>
                    <input
                      type="number"
                      name="maxMesas"
                      min="-1"
                      step="1"
                      value={editForm.maxMesas}
                      onChange={handleInputChange}
                      disabled={savingPlan}
                    />
                  </label>

                  <label>
                    <span>Máximo de funcionários</span>
                    <input
                      type="number"
                      name="maxFuncionarios"
                      min="-1"
                      step="1"
                      value={editForm.maxFuncionarios}
                      onChange={handleInputChange}
                      disabled={savingPlan}
                    />
                  </label>
                </div>

                <small>Use -1 para indicar limite ilimitado.</small>
              </fieldset>

              <fieldset className="plan-edit-form__fieldset">
                <legend>Funcionalidades</legend>

                <div className="plan-edit-form__checkbox-grid">
                  {[
                    ["cardapioQrCode", "Cardápio com QR Code"],
                    ["controlePedidos", "Controle de pedidos"],
                    [
                      "chamadosAtendimento",
                      "Chamados de atendimento",
                    ],
                    ["relatoriosVendas", "Relatórios de vendas"],
                    [
                      "relatoriosAvancados",
                      "Relatórios avançados",
                    ],
                    ["marcaPersonalizada", "Marca personalizada"],
                    ["suportePrioritario", "Suporte prioritário"],
                  ].map(([name, label]) => (
                    <label
                      key={name}
                      className="plan-edit-form__checkbox"
                    >
                      <input
                        type="checkbox"
                        name={name}
                        checked={Boolean(editForm[name])}
                        onChange={handleInputChange}
                        disabled={savingPlan}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="plan-edit-modal__actions">
                <button
                  type="button"
                  className="plan-edit-button plan-edit-button--cancel"
                  disabled={savingPlan}
                  onClick={closeEditModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="plan-edit-button plan-edit-button--save"
                  disabled={savingPlan}
                >
                  {savingPlan
                    ? "Salvando..."
                    : creatingPlan
                      ? "Criar plano"
                      : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}