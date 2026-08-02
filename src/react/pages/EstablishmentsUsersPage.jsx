import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  showToast,
} from "../services/toast.js";

import {
  createEstablishmentUser,
  observeEstablishmentUsers,
  updateEstablishmentUser,
  updateEstablishmentUserPermissions,
  updateEstablishmentUserStatus,
} from "../services/establishmentUsersService.js";

import "../styles/EstablishmentsUsersPage.css";

const ROLE_LABELS = {
  owner: "Proprietário",
  admin: "Administrador",
  manager: "Gerente",
  waiter: "Garçom",
  kitchen: "Cozinha",
  cashier: "Caixa",
  employee: "Funcionário",
};

const STATUS_LABELS = {
  active: "Ativo",
  blocked: "Bloqueado",
  inactive: "Inativo",
  pending: "Pendente",
};

const DEFAULT_PERMISSIONS = {
  admin: {
    pedidos: true,
    cozinha: true,
    produtos: true,
    categorias: true,
    mesas: true,
    mapaMesas: true,
    funcionarios: true,
    assinatura: false,
    configuracoes: true,
  },

  manager: {
    pedidos: true,
    cozinha: true,
    produtos: true,
    categorias: true,
    mesas: true,
    mapaMesas: true,
    funcionarios: true,
    assinatura: false,
    configuracoes: false,
  },

  waiter: {
    pedidos: true,
    cozinha: false,
    produtos: false,
    categorias: false,
    mesas: true,
    mapaMesas: true,
    funcionarios: false,
    assinatura: false,
    configuracoes: false,
  },

  kitchen: {
    pedidos: true,
    cozinha: true,
    produtos: false,
    categorias: false,
    mesas: false,
    mapaMesas: false,
    funcionarios: false,
    assinatura: false,
    configuracoes: false,
  },

  cashier: {
    pedidos: true,
    cozinha: false,
    produtos: false,
    categorias: false,
    mesas: true,
    mapaMesas: true,
    funcionarios: false,
    assinatura: false,
    configuracoes: false,
  },
};

function formatDate(value) {
  if (!value) {
    return "Nunca acessou";
  }

  let date;

  if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(date);
}

function getInitials(name) {
  const normalizedName = String(
    name || "",
  ).trim();

  if (!normalizedName) {
    return "US";
  }

  return normalizedName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function EstablishmentsUsersPage({
  establishmentId,
}) {
  const [employees, setEmployees] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [
    creatingEmployee,
    setCreatingEmployee,
  ] = useState(false);

  const [savingEmployee, setSavingEmployee] =
  useState(false);

  const [editingEmployee, setEditingEmployee] =
  useState(null);

  const [
    permissionsEmployee,
    setPermissionsEmployee,
  ] = useState(null);

  const [
    statusEmployee,
    setStatusEmployee,
  ] = useState(null);

  const [savingAction, setSavingAction] =
    useState(false);

  const [editForm, setEditForm] =
    useState({
      nome: "",
      telefone: "",
      role: "waiter",
    });

  const [
    permissionsForm,
    setPermissionsForm,
  ] = useState({});

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    role: "waiter",

    permissoes: {
        pedidos: true,
        cozinha: false,
        produtos: false,
        categorias: false,
        mesas: true,
        mapaMesas: true,
        funcionarios: false,
        assinatura: false,
        configuracoes: false,
    },
  });

  function resetForm() {
    setForm({
        nome: "",
        email: "",
        senha: "",
        telefone: "",
        role: "waiter",

        permissoes: {
        ...DEFAULT_PERMISSIONS.waiter,
        },
    });
    }

  function handleInputChange(event) {
    const {
        name,
        value,
    } = event.target;

    if (name === "role") {
        setForm((currentForm) => ({
        ...currentForm,
        role: value,
        permissoes: {
            ...DEFAULT_PERMISSIONS[value],
        },
        }));

        return;
    }

    setForm((currentForm) => ({
        ...currentForm,
        [name]: value,
    }));
    }

  function handlePermissionChange(event) {
    const {
        name,
        checked,
    } = event.target;

    setForm((currentForm) => ({
        ...currentForm,

        permissoes: {
        ...currentForm.permissoes,
        [name]: checked,
        },
    }));
  }

  async function handleCreateEmployee(event) {
    event.preventDefault();

    const normalizedName =
        form.nome.trim();

    const normalizedEmail =
        form.email.trim().toLowerCase();

    if (!normalizedName) {
        setError(
        "Informe o nome do funcionário.",
        );

        return;
    }

    if (!normalizedEmail) {
        setError(
        "Informe o e-mail do funcionário.",
        );

        return;
    }

    if (!form.senha || form.senha.length < 6) {
        setError(
        "A senha deve possuir pelo menos 6 caracteres.",
        );

        return;
    }

    try {
        setSavingEmployee(true);
        setError("");

        await createEstablishmentUser({
        nome: normalizedName,
        email: normalizedEmail,
        senha: form.senha,
        telefone: form.telefone,
        role: form.role,
        permissoes: form.permissoes,
        });

        setCreatingEmployee(false);
        resetForm();

        showToast(
        `Funcionário "${normalizedName}" cadastrado com sucesso.`,
        "success",
        4000,
        );
    } catch (createError) {
        console.error(
        "Erro ao cadastrar funcionário:",
        createError,
        );

        setError(
        createError?.message ||
            "Não foi possível cadastrar o funcionário.",
        );
    } finally {
        setSavingEmployee(false);
    }
  }

  function handleCloseCreateModal() {
    if (savingEmployee) {
        return;
    }

    setCreatingEmployee(false);
    setError("");
    resetForm();
  }

  useEffect(() => {
    if (!establishmentId) {
      setEmployees([]);
      setLoading(false);

      setError(
        "Estabelecimento não identificado.",
      );

      return undefined;
    }

    setLoading(true);
    setError("");

    const unsubscribe =
      observeEstablishmentUsers(
        establishmentId,

        (loadedEmployees) => {
          setEmployees(loadedEmployees);
          setLoading(false);
          setError("");
        },

        (loadError) => {
          console.error(
            "Erro ao carregar funcionários:",
            loadError,
          );

          setEmployees([]);
          setLoading(false);

          setError(
            loadError?.message ||
              "Não foi possível carregar os funcionários.",
          );
        },
      );

    return () => {
      if (
        typeof unsubscribe === "function"
      ) {
        unsubscribe();
      }
    };
  }, [establishmentId]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !normalizedSearch ||
        String(employee.nome || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(employee.email || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(employee.telefone || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesRole =
        roleFilter === "all" ||
        employee.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        employee.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    employees,
    search,
    roleFilter,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    return {
      total: employees.length,

      active: employees.filter(
        (employee) =>
          employee.status === "active",
      ).length,

      managers: employees.filter(
        (employee) =>
          employee.role === "manager" ||
          employee.role === "admin",
      ).length,

      operational: employees.filter(
        (employee) =>
          [
            "waiter",
            "kitchen",
            "cashier",
          ].includes(employee.role),
      ).length,
    };
  }, [employees]);

  function handleOpenCreateModal() {
    setError("");
    setCreatingEmployee(true);
  }

  function handleCloseCreateModal() {
    setCreatingEmployee(false);
  }

  function handleEditEmployee(employee) {
  setError("");

  setEditForm({
    nome: employee.nome || "",
    telefone: employee.telefone || "",
    role: employee.role || "waiter",
  });

  setEditingEmployee(employee);
}

  async function handleSaveEmployee(event) {
    event.preventDefault();

    if (!editingEmployee?.id) {
      return;
    }

    if (!editForm.nome.trim()) {
      setError("Informe o nome do funcionário.");
      return;
    }

    try {
      setSavingAction(true);
      setError("");

      await updateEstablishmentUser({
        employeeId: editingEmployee.id,
        nome: editForm.nome,
        telefone: editForm.telefone,
        role: editForm.role,
      });

      setEditingEmployee(null);

      showToast(
        "Funcionário atualizado com sucesso.",
        "success",
      );
    } catch (updateError) {
      console.error(
        "Erro ao editar funcionário:",
        updateError,
      );

      setError(
        updateError?.message ||
          "Não foi possível editar o funcionário.",
      );
    } finally {
      setSavingAction(false);
    }
  }

  function handlePermissions(employee) {
    setError("");

    setPermissionsForm({
      ...DEFAULT_PERMISSIONS[
        employee.role
      ],
      ...(employee.permissoes || {}),
    });

    setPermissionsEmployee(employee);
  }

  function handleEditPermission(event) {
    const {
      name,
      checked,
    } = event.target;

    setPermissionsForm(
      (currentPermissions) => ({
        ...currentPermissions,
        [name]: checked,
      }),
    );
  }

  async function handleSavePermissions(event) {
    event.preventDefault();

    if (!permissionsEmployee?.id) {
      return;
    }

    try {
      setSavingAction(true);
      setError("");

      await updateEstablishmentUserPermissions({
        employeeId:
          permissionsEmployee.id,
        permissoes: permissionsForm,
      });

      setPermissionsEmployee(null);

      showToast(
        "Permissões atualizadas com sucesso.",
        "success",
      );
    } catch (permissionError) {
      console.error(
        "Erro ao atualizar permissões:",
        permissionError,
      );

      setError(
        permissionError?.message ||
          "Não foi possível atualizar as permissões.",
      );
    } finally {
      setSavingAction(false);
    }
  }

    function handleToggleStatus(employee) {
    setError("");
    setStatusEmployee(employee);
  }

  async function handleConfirmStatusChange() {
    if (!statusEmployee?.id) {
      return;
    }

    const newStatus =
      statusEmployee.status === "active"
        ? "blocked"
        : "active";

    try {
      setSavingAction(true);
      setError("");

      await updateEstablishmentUserStatus({
        employeeId: statusEmployee.id,
        status: newStatus,
      });

      setStatusEmployee(null);

      showToast(
        newStatus === "blocked"
          ? "Funcionário bloqueado com sucesso."
          : "Funcionário ativado com sucesso.",
        "success",
      );
    } catch (statusError) {
      console.error(
        "Erro ao alterar status:",
        statusError,
      );

      setError(
        statusError?.message ||
          "Não foi possível alterar o status.",
      );
    } finally {
      setSavingAction(false);
    }
  }

  return (
    <section className="establishment-users-page">
      <header className="establishment-users-page__header">
        <div>
          <span className="establishment-users-page__eyebrow">
            Gestão da equipe
          </span>

          <h1>Funcionários</h1>

          <p>
            Cadastre usuários, defina perfis e
            controle as permissões do
            estabelecimento.
          </p>
        </div>

        <button
          type="button"
          className="establishment-users-page__new-button"
          onClick={handleOpenCreateModal}
        >
          + Novo funcionário
        </button>
      </header>

      {error && (
        <div className="establishment-users-alert establishment-users-alert--error">
          {error}
        </div>
      )}

      <div className="establishment-users-summary">
        <article className="establishment-users-summary__card">
          <div>
            <span>Total de funcionários</span>
            <strong>{summary.total}</strong>
          </div>

          <div className="establishment-users-summary__icon">
            👥
          </div>
        </article>

        <article className="establishment-users-summary__card">
          <div>
            <span>Funcionários ativos</span>
            <strong>{summary.active}</strong>
          </div>

          <div className="establishment-users-summary__icon">
            ✓
          </div>
        </article>

        <article className="establishment-users-summary__card">
          <div>
            <span>Gestão</span>
            <strong>{summary.managers}</strong>
          </div>

          <div className="establishment-users-summary__icon">
            🛡️
          </div>
        </article>

        <article className="establishment-users-summary__card">
          <div>
            <span>Equipe operacional</span>
            <strong>{summary.operational}</strong>
          </div>

          <div className="establishment-users-summary__icon">
            🍽️
          </div>
        </article>
      </div>

      <div className="establishment-users-panel">
        <div className="establishment-users-filters">
          <input
            type="search"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value,
              )
            }
          >
            <option value="all">
              Todos os cargos
            </option>

            <option value="owner">
              Proprietário
            </option>

            <option value="admin">
              Administrador
            </option>

            <option value="manager">
              Gerente
            </option>

            <option value="waiter">
              Garçom
            </option>

            <option value="kitchen">
              Cozinha
            </option>

            <option value="cashier">
              Caixa
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
          >
            <option value="all">
              Todos os status
            </option>

            <option value="active">
              Ativos
            </option>

            <option value="blocked">
              Bloqueados
            </option>

            <option value="inactive">
              Inativos
            </option>

            <option value="pending">
              Pendentes
            </option>
          </select>
        </div>

        {loading ? (
          <div className="establishment-users-loading">
            Carregando funcionários...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="establishment-users-empty">
            <div className="establishment-users-empty__icon">
              👥
            </div>

            <h2>
              Nenhum funcionário encontrado
            </h2>

            <p>
              Cadastre o primeiro usuário da
              equipe ou altere os filtros da
              pesquisa.
            </p>

            <button
              type="button"
              onClick={handleOpenCreateModal}
            >
              + Novo funcionário
            </button>
          </div>
        ) : (
          <div className="establishment-users-table-wrapper">
            <table className="establishment-users-table">
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Cargo</th>
                  <th>Contato</th>
                  <th>Último acesso</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map(
                  (employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="establishment-users-person">
                          <div className="establishment-users-person__avatar">
                            {getInitials(
                              employee.nome,
                            )}
                          </div>

                          <div>
                            <strong>
                              {employee.nome ||
                                "Sem nome"}
                            </strong>

                            <span>
                              {employee.email ||
                                "E-mail não informado"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="establishment-users-role">
                          {ROLE_LABELS[
                            employee.role
                          ] ||
                            employee.role ||
                            "Não informado"}
                        </span>
                      </td>

                      <td>
                        {employee.telefone ||
                          "Não informado"}
                      </td>

                      <td>
                        {formatDate(
                          employee.ultimoAcesso,
                        )}
                      </td>

                      <td>
                        <span
                          className={`establishment-users-status establishment-users-status--${
                            employee.status ||
                            "pending"
                          }`}
                        >
                          {STATUS_LABELS[
                            employee.status
                          ] ||
                            employee.status ||
                            "Pendente"}
                        </span>
                      </td>

                      <td>
                        <div className="establishment-users-actions">
                          <button
                            type="button"
                            onClick={() =>
                              handleEditEmployee(
                                employee,
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handlePermissions(
                                employee,
                              )
                            }
                          >
                            Permissões
                          </button>

                          {employee.role !==
                            "owner" && (
                            <button
                              type="button"
                              className="establishment-users-actions__status"
                              onClick={() =>
                                handleToggleStatus(
                                  employee,
                                )
                              }
                            >
                              {employee.status ===
                              "active"
                                ? "Bloquear"
                                : "Ativar"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creatingEmployee && (
        <div className="establishment-users-modal-overlay">
          <div className="establishment-users-modal">
            <header className="establishment-users-modal__header">
              <div>
                <span>
                  Gestão da equipe
                </span>

                <h2>
                  Novo funcionário
                </h2>
              </div>

              <button
                type="button"
                aria-label="Fechar modal"
                onClick={
                  handleCloseCreateModal
                }
              >
                ×
              </button>
            </header>

            {creatingEmployee && (
                <div
                    className="establishment-users-modal-overlay"
                    onMouseDown={(event) => {
                    if (
                        event.target === event.currentTarget &&
                        !savingEmployee
                    ) {
                        handleCloseCreateModal();
                    }
                    }}
                >
                    <div
                    className="establishment-users-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="new-employee-title"
                    >
                    <header className="establishment-users-modal__header">
                        <div>
                        <span>Gestão da equipe</span>

                        <h2 id="new-employee-title">
                            Novo funcionário
                        </h2>
                        </div>

                        <button
                        type="button"
                        aria-label="Fechar modal"
                        disabled={savingEmployee}
                        onClick={handleCloseCreateModal}
                        >
                        ×
                        </button>
                    </header>

                    <form
                        className="establishment-users-form"
                        onSubmit={handleCreateEmployee}
                    >
                        <div className="establishment-users-form__grid">
                        <label>
                            <span>Nome</span>

                            <input
                            type="text"
                            name="nome"
                            value={form.nome}
                            onChange={handleInputChange}
                            disabled={savingEmployee}
                            placeholder="Nome completo"
                            autoComplete="name"
                            />
                        </label>

                        <label>
                            <span>Telefone</span>

                            <input
                            type="tel"
                            name="telefone"
                            value={form.telefone}
                            onChange={handleInputChange}
                            disabled={savingEmployee}
                            placeholder="(00) 00000-0000"
                            autoComplete="tel"
                            />
                        </label>
                        </div>

                        <label>
                        <span>E-mail</span>

                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleInputChange}
                            disabled={savingEmployee}
                            placeholder="funcionario@email.com"
                            autoComplete="email"
                        />
                        </label>

                        <div className="establishment-users-form__grid">
                        <label>
                            <span>Senha inicial</span>

                            <input
                            type="password"
                            name="senha"
                            value={form.senha}
                            onChange={handleInputChange}
                            disabled={savingEmployee}
                            placeholder="Mínimo de 6 caracteres"
                            autoComplete="new-password"
                            />
                        </label>

                        <label>
                            <span>Cargo</span>

                            <select
                            name="role"
                            value={form.role}
                            onChange={handleInputChange}
                            disabled={savingEmployee}
                            >
                            <option value="admin">
                                Administrador
                            </option>

                            <option value="manager">
                                Gerente
                            </option>

                            <option value="waiter">
                                Garçom
                            </option>

                            <option value="kitchen">
                                Cozinha
                            </option>

                            <option value="cashier">
                                Caixa
                            </option>
                            </select>
                        </label>
                        </div>

                        <fieldset className="establishment-users-form__permissions">
                        <legend>Permissões</legend>

                        <div className="establishment-users-form__permissions-grid">
                            {[
                            ["pedidos", "Pedidos"],
                            ["cozinha", "Cozinha"],
                            ["produtos", "Produtos"],
                            ["categorias", "Categorias"],
                            ["mesas", "Mesas"],
                            ["mapaMesas", "Mapa de mesas"],
                            ["funcionarios", "Funcionários"],
                            ["assinatura", "Assinatura"],
                            ["configuracoes", "Configurações"],
                            ].map(([name, label]) => (
                            <label key={name}>
                                <span>{label}</span>

                                <input
                                type="checkbox"
                                name={name}
                                checked={Boolean(
                                    form.permissoes[name],
                                )}
                                onChange={
                                    handlePermissionChange
                                }
                                disabled={savingEmployee}
                                />
                            </label>
                            ))}
                        </div>
                        </fieldset>

                        <div className="establishment-users-modal__actions">
                        <button
                            type="button"
                            disabled={savingEmployee}
                            onClick={handleCloseCreateModal}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={savingEmployee}
                        >
                            {savingEmployee
                            ? "Salvando..."
                            : "Salvar funcionário"}
                        </button>
                        </div>
                    </form>
                    </div>
                </div>
                )}

            <div className="establishment-users-modal__actions">
              <button
                type="button"
                onClick={
                  handleCloseCreateModal
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled
              >
                Salvar funcionário
              </button>
            </div>
          </div>
        </div>
      )}
      {/* // Modal para edição de funcionário */}
      {editingEmployee && (
        <div
          className="establishment-users-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingAction
            ) {
              setEditingEmployee(null);
            }
          }}
        >
          <div
            className="establishment-users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-employee-title"
          >
            <header className="establishment-users-modal__header">
              <div>
                <span>Gestão da equipe</span>

                <h2 id="edit-employee-title">
                  Editar funcionário
                </h2>
              </div>

              <button
                type="button"
                aria-label="Fechar modal"
                disabled={savingAction}
                onClick={() =>
                  setEditingEmployee(null)
                }
              >
                ×
              </button>
            </header>

            <form
              className="establishment-users-form"
              onSubmit={handleSaveEmployee}
            >
              <label>
                <span>Nome</span>

                <input
                  type="text"
                  value={editForm.nome}
                  disabled={savingAction}
                  onChange={(event) =>
                    setEditForm(
                      (currentForm) => ({
                        ...currentForm,
                        nome: event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Telefone</span>

                <input
                  type="tel"
                  value={editForm.telefone}
                  disabled={savingAction}
                  onChange={(event) =>
                    setEditForm(
                      (currentForm) => ({
                        ...currentForm,
                        telefone:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Cargo</span>

                <select
                  value={editForm.role}
                  disabled={savingAction}
                  onChange={(event) =>
                    setEditForm(
                      (currentForm) => ({
                        ...currentForm,
                        role: event.target.value,
                      }),
                    )
                  }
                >
                  <option value="admin">
                    Administrador
                  </option>

                  <option value="manager">
                    Gerente
                  </option>

                  <option value="waiter">
                    Garçom
                  </option>

                  <option value="kitchen">
                    Cozinha
                  </option>

                  <option value="cashier">
                    Caixa
                  </option>
                </select>
              </label>

              <div className="establishment-users-modal__actions">
                <button
                  type="button"
                  disabled={savingAction}
                  onClick={() =>
                    setEditingEmployee(null)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingAction}
                >
                  {savingAction
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de permissões */}
      {permissionsEmployee && (
        <div
          className="establishment-users-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingAction
            ) {
              setPermissionsEmployee(null);
            }
          }}
        >
          <div
            className="establishment-users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="permissions-title"
          >
            <header className="establishment-users-modal__header">
              <div>
                <span>Controle de acesso</span>

                <h2 id="permissions-title">
                  Permissões
                </h2>

                <p className="establishment-users-modal__subtitle">
                  {permissionsEmployee.nome}
                </p>
              </div>

              <button
                type="button"
                aria-label="Fechar modal"
                disabled={savingAction}
                onClick={() =>
                  setPermissionsEmployee(null)
                }
              >
                ×
              </button>
            </header>

            <form
              className="establishment-users-form"
              onSubmit={handleSavePermissions}
            >
              <fieldset className="establishment-users-form__permissions">
                <legend>
                  Áreas permitidas
                </legend>

                <div className="establishment-users-form__permissions-grid">
                  {[
                    ["pedidos", "Pedidos"],
                    ["cozinha", "Cozinha"],
                    ["produtos", "Produtos"],
                    ["categorias", "Categorias"],
                    ["mesas", "Mesas"],
                    [
                      "mapaMesas",
                      "Mapa de mesas",
                    ],
                    [
                      "funcionarios",
                      "Funcionários",
                    ],
                    ["assinatura", "Assinatura"],
                    [
                      "configuracoes",
                      "Configurações",
                    ],
                  ].map(([name, label]) => (
                    <label key={name}>
                      <span>{label}</span>

                      <input
                        type="checkbox"
                        name={name}
                        checked={Boolean(
                          permissionsForm[name],
                        )}
                        disabled={savingAction}
                        onChange={
                          handleEditPermission
                        }
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="establishment-users-modal__actions">
                <button
                  type="button"
                  disabled={savingAction}
                  onClick={() =>
                    setPermissionsEmployee(null)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingAction}
                >
                  {savingAction
                    ? "Salvando..."
                    : "Salvar permissões"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de bloqueio ou ativação */}
      {statusEmployee && (
        <div
          className="establishment-users-confirm-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingAction
            ) {
              setStatusEmployee(null);
            }
          }}
        >
          <div
            className="establishment-users-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-employee-title"
          >
            <div
              className={`establishment-users-confirm__icon ${
                statusEmployee.status === "active"
                  ? "establishment-users-confirm__icon--danger"
                  : "establishment-users-confirm__icon--success"
              }`}
            >
              {statusEmployee.status === "active"
                ? "!"
                : "✓"}
            </div>

            <h2 id="status-employee-title">
              {statusEmployee.status === "active"
                ? "Bloquear funcionário"
                : "Ativar funcionário"}
            </h2>

            <p>
              {statusEmployee.status === "active"
                ? "Tem certeza que deseja bloquear"
                : "Tem certeza que deseja ativar"}{" "}
              <strong>
                "{statusEmployee.nome}"
              </strong>
              ?
            </p>

            <span>
              {statusEmployee.status === "active"
                ? "O usuário perderá o acesso ao sistema imediatamente."
                : "O usuário poderá acessar novamente o sistema."}
            </span>

            <div className="establishment-users-confirm__actions">
              <button
                type="button"
                disabled={savingAction}
                onClick={() =>
                  setStatusEmployee(null)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className={
                  statusEmployee.status ===
                  "active"
                    ? "danger"
                    : "success"
                }
                disabled={savingAction}
                onClick={
                  handleConfirmStatusChange
                }
              >
                {savingAction
                  ? "Salvando..."
                  : statusEmployee.status ===
                      "active"
                    ? "Bloquear"
                    : "Ativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}