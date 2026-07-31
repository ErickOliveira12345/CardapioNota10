import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const EMPTY_FORM = {
  codigo: "",
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

const FEATURE_OPTIONS = [
  ["cardapioQrCode", "Cardápio com QR Code"],
  ["controlePedidos", "Controle de pedidos"],
  ["chamadosAtendimento", "Chamados de atendimento"],
  ["relatoriosVendas", "Relatórios de vendas"],
  ["relatoriosAvancados", "Relatórios avançados"],
  ["marcaPersonalizada", "Marca personalizada"],
  ["suportePrioritario", "Suporte prioritário"],
];

function centsToInputValue(value) {
  if (value == null) return "";
  return String(Number(value) / 100);
}

function moneyInputToCents(value) {
  const normalizedValue = String(value ?? "")
    .trim()
    .replace(",", ".");
  const parsed = Number(normalizedValue);

  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function normalizePlanCode(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function planToForm(plan) {
  if (!plan) return { ...EMPTY_FORM };

  const funcionalidades = plan.funcionalidades || {};

  return {
    codigo: plan.codigo ?? plan.id ?? "",
    nome: plan.nome ?? "",
    descricao: plan.descricao ?? "",
    precoMensal: centsToInputValue(plan.precoMensal),
    ativo: plan.ativo !== false,
    testeHabilitado: plan.teste?.habilitado === true,
    testeDias: String(plan.teste?.dias ?? 0),
    testePreco: centsToInputValue(plan.teste?.preco ?? 0),
    promocaoHabilitada: plan.promocao?.habilitada === true,
    promocaoPreco: centsToInputValue(plan.promocao?.preco ?? 0),
    promocaoMeses: String(plan.promocao?.meses ?? 0),
    maxProdutos: String(funcionalidades.maxProdutos ?? 0),
    maxCategorias: String(funcionalidades.maxCategorias ?? 0),
    maxMesas: String(funcionalidades.maxMesas ?? 0),
    maxFuncionarios: String(funcionalidades.maxFuncionarios ?? 0),
    cardapioQrCode: funcionalidades.cardapioQrCode === true,
    controlePedidos: funcionalidades.controlePedidos === true,
    chamadosAtendimento:
      funcionalidades.chamadosAtendimento === true,
    relatoriosVendas: funcionalidades.relatoriosVendas === true,
    relatoriosAvancados:
      funcionalidades.relatoriosAvancados === true,
    marcaPersonalizada:
      funcionalidades.marcaPersonalizada === true,
    suportePrioritario:
      funcionalidades.suportePrioritario === true,
  };
}

function validateAndBuildPayload(form, mode) {
  const codigo = normalizePlanCode(form.codigo);
  const nome = form.nome.trim();
  const descricao = form.descricao.trim();

  if (mode === "create" && !codigo) {
    throw new Error("Informe um código válido para o plano.");
  }

  if (!nome || !descricao) {
    throw new Error("Preencha o nome e a descrição do plano.");
  }

  const precoMensal = moneyInputToCents(form.precoMensal);
  const testePreco = moneyInputToCents(form.testePreco || 0);
  const promocaoPreco = moneyInputToCents(form.promocaoPreco || 0);

  if (precoMensal == null) {
    throw new Error("Informe um preço mensal válido.");
  }

  if (testePreco == null) {
    throw new Error("Informe um preço de teste válido.");
  }

  if (promocaoPreco == null) {
    throw new Error("Informe um preço promocional válido.");
  }

  const numericFields = {
    testeDias: Number(form.testeDias || 0),
    promocaoMeses: Number(form.promocaoMeses || 0),
    maxProdutos: Number(form.maxProdutos),
    maxCategorias: Number(form.maxCategorias),
    maxMesas: Number(form.maxMesas),
    maxFuncionarios: Number(form.maxFuncionarios),
  };

  if (
    Object.values(numericFields).some(
      (value) => !Number.isFinite(value),
    )
  ) {
    throw new Error("Revise os limites numéricos informados.");
  }

  if (
    numericFields.testeDias < 0 ||
    numericFields.promocaoMeses < 0
  ) {
    throw new Error(
      "Dias de teste e meses de promoção não podem ser negativos.",
    );
  }

  const payload = {
    nome,
    descricao,
    ativo: Boolean(form.ativo),
    precoMensal,
    teste: {
      habilitado: Boolean(form.testeHabilitado),
      dias: numericFields.testeDias,
      preco: testePreco,
    },
    promocao: {
      habilitada: Boolean(form.promocaoHabilitada),
      preco: promocaoPreco,
      meses: numericFields.promocaoMeses,
    },
    funcionalidades: {
      maxProdutos: numericFields.maxProdutos,
      maxCategorias: numericFields.maxCategorias,
      maxMesas: numericFields.maxMesas,
      maxFuncionarios: numericFields.maxFuncionarios,
      cardapioQrCode: Boolean(form.cardapioQrCode),
      controlePedidos: Boolean(form.controlePedidos),
      chamadosAtendimento: Boolean(form.chamadosAtendimento),
      relatoriosVendas: Boolean(form.relatoriosVendas),
      relatoriosAvancados: Boolean(form.relatoriosAvancados),
      marcaPersonalizada: Boolean(form.marcaPersonalizada),
      suportePrioritario: Boolean(form.suportePrioritario),
    },
  };

  if (mode === "create") payload.codigo = codigo;
  return payload;
}

export default function PlanModal({
  isOpen,
  mode = "create",
  plan = null,
  saving = false,
  externalError = "",
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [localError, setLocalError] = useState("");
  const isEditing = mode === "edit";

  const title = useMemo(
    () =>
      isEditing
        ? `Editar ${plan?.nome || "plano"}`
        : "Novo plano",
    [isEditing, plan?.nome],
  );

  const closeModal = useCallback(() => {
    if (!saving) {
      setLocalError("");
      onClose?.();
    }
  }, [onClose, saving]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(planToForm(isEditing ? plan : null));
    setLocalError("");
  }, [isEditing, isOpen, plan]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") closeModal();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeModal, isOpen]);

  if (!isOpen) return null;

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleCodeBlur() {
    setForm((current) => ({
      ...current,
      codigo: normalizePlanCode(current.codigo),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    try {
      const payload = validateAndBuildPayload(form, mode);
      await onSubmit?.(payload);
    } catch (error) {
      setLocalError(
        error?.message || "Não foi possível salvar o plano.",
      );
    }
  }

  const visibleError = localError || externalError;

  return (
    <div
      className="plan-edit-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div
        className="plan-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-modal-title"
      >
        <div className="plan-edit-modal__header">
          <div>
            <span className="plan-edit-modal__eyebrow">
              {isEditing
                ? "Configuração do plano"
                : "Cadastro de plano"}
            </span>
            <h2 id="plan-modal-title">{title}</h2>
          </div>

          <button
            type="button"
            className="plan-edit-modal__close"
            aria-label="Fechar modal"
            disabled={saving}
            onClick={closeModal}
          >
            ×
          </button>
        </div>

        <form className="plan-edit-form" onSubmit={handleSubmit}>
          {visibleError && (
            <div className="super-admin-alert super-admin-alert--error">
              {visibleError}
            </div>
          )}

          {!isEditing && (
            <label>
              <span>Código do plano</span>
              <input
                type="text"
                name="codigo"
                value={form.codigo}
                onChange={handleInputChange}
                onBlur={handleCodeBlur}
                disabled={saving}
                placeholder="Ex.: profissional"
                autoComplete="off"
                required
              />
              <small>Use letras minúsculas, números e hífens.</small>
            </label>
          )}

          <label>
            <span>Nome do plano</span>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleInputChange}
              disabled={saving}
              required
            />
          </label>

          <label>
            <span>Descrição</span>
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleInputChange}
              disabled={saving}
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
                value={form.precoMensal}
                onChange={handleInputChange}
                disabled={saving}
                required
              />
            </label>

            <label>
              <span>Status</span>
              <select
                name="ativo"
                value={String(form.ativo)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ativo: event.target.value === "true",
                  }))
                }
                disabled={saving}
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
                checked={form.testeHabilitado}
                onChange={handleInputChange}
                disabled={saving}
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
                  value={form.testeDias}
                  onChange={handleInputChange}
                  disabled={saving || !form.testeHabilitado}
                />
              </label>

              <label>
                <span>Preço durante o teste (R$)</span>
                <input
                  type="number"
                  name="testePreco"
                  min="0"
                  step="0.01"
                  value={form.testePreco}
                  onChange={handleInputChange}
                  disabled={saving || !form.testeHabilitado}
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
                checked={form.promocaoHabilitada}
                onChange={handleInputChange}
                disabled={saving}
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
                  value={form.promocaoPreco}
                  onChange={handleInputChange}
                  disabled={saving || !form.promocaoHabilitada}
                />
              </label>

              <label>
                <span>Duração em meses</span>
                <input
                  type="number"
                  name="promocaoMeses"
                  min="0"
                  step="1"
                  value={form.promocaoMeses}
                  onChange={handleInputChange}
                  disabled={saving || !form.promocaoHabilitada}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="plan-edit-form__fieldset">
            <legend>Limites do plano</legend>
            <div className="plan-edit-form__grid">
              {[
                ["maxProdutos", "Máximo de produtos"],
                ["maxCategorias", "Máximo de categorias"],
                ["maxMesas", "Máximo de mesas"],
                ["maxFuncionarios", "Máximo de funcionários"],
              ].map(([name, label]) => (
                <label key={name}>
                  <span>{label}</span>
                  <input
                    type="number"
                    name={name}
                    min="-1"
                    step="1"
                    value={form[name]}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </label>
              ))}
            </div>
            <small>Use -1 para indicar limite ilimitado.</small>
          </fieldset>

          <fieldset className="plan-edit-form__fieldset">
            <legend>Funcionalidades</legend>
            <div className="plan-edit-form__checkbox-grid">
              {FEATURE_OPTIONS.map(([name, label]) => (
                <label
                  key={name}
                  className="plan-edit-form__checkbox"
                >
                  <input
                    type="checkbox"
                    name={name}
                    checked={Boolean(form[name])}
                    onChange={handleInputChange}
                    disabled={saving}
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
              disabled={saving}
              onClick={closeModal}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="plan-edit-button plan-edit-button--save"
              disabled={saving}
            >
              {saving
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Cadastrar plano"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}