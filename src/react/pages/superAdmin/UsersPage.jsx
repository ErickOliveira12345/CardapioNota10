import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
} from "../../services/superAdminService.js";

import "../../styles/superAdminCommon.css";
import "../../styles/UsersPage.css";
import { showToast } from "../../services/toast.js";

const ROLE_OPTIONS = [
  {
    value: "subscriber",
    label: "Assinante",
  },
  {
    value: "manager",
    label: "Gerente",
  },
  {
    value: "employee",
    label: "Funcionário",
  },
  {
    value: "waiter",
    label: "Garçom",
  },
  {
    value: "kitchen",
    label: "Cozinha",
  },
  {
    value: "super_admin",
    label: "Super Admin",
  },
];

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Ativo",
  },
  {
    value: "blocked",
    label: "Bloqueado",
  },
  {
    value: "inactive",
    label: "Inativo",
  },
  {
    value: "pending",
    label: "Pendente",
  },
  {
    value: "onboarding",
    label: "Primeiro acesso",
  },
];

function getRoleLabel(role) {
  const option = ROLE_OPTIONS.find(
    (item) => item.value === role,
  );

  return option?.label || role || "Não informado";
}

function getStatusLabel(status) {
  const option = STATUS_OPTIONS.find(
    (item) => item.value === status,
  );

  return option?.label || status || "Não informado";
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("all");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState(null);

  const [confirmation, setConfirmation] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const usersData = await getAllUsers();

      setUsers(usersData);
    } catch (usersError) {
      console.error(
        "Erro ao carregar usuários:",
        usersError,
      );

      setError(
        "Não foi possível carregar os usuários.",
      );
      
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch =
      normalizeText(search);

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        normalizeText(user.nome).includes(
          normalizedSearch,
        ) ||
        normalizeText(user.email).includes(
          normalizedSearch,
        ) ||
        normalizeText(user.cpf).includes(
          normalizedSearch,
        ) ||
        normalizeText(user.telefone).includes(
          normalizedSearch,
        );

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        user.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  function handleStatusToggle(user) {
    const newStatus =
      user.status === "blocked"
        ? "active"
        : "blocked";

    setConfirmation({
      user,
      newStatus,
    });
  }

  async function confirmStatusChange() {
    if (!confirmation) {
      return;
    }

    const { user, newStatus } = confirmation;

    try {
      setUpdatingId(user.id);
      setError("");
      setSuccessMessage("");

      console.log("Atualizando usuário:", user.id);
    console.log("Novo status:", newStatus);
      await updateUserStatus(
        user.id,
        newStatus,
      );

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                status: newStatus,
              }
            : currentUser,
        ),
      );

      const message =
        newStatus === "blocked"
          ? `O usuário "${user.nome || user.email}" foi bloqueado com sucesso.`
          : `O usuário "${user.nome || user.email}" foi reativado com sucesso.`;

      setSuccessMessage(message);

      setConfirmation(null);

      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);

    } catch (statusError) {
      console.error(
        "Erro ao atualizar status:",
        statusError,
      );

      showToast(
        "Não foi possível atualizar o status do usuário.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRoleChange(
    user,
    newRole,
  ) {
    if (!newRole || newRole === user.role) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja alterar o perfil de "${
        user.nome || user.email
      }" para "${getRoleLabel(newRole)}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(user.id);
      setError("");

      await updateUserRole(
        user.id,
        newRole,
      );

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                role: newRole,
              }
            : currentUser,
        ),
      );

      setSuccessMessage(
        newStatus === "blocked"
          ? `O usuário "${user.nome || user.email}" foi bloqueado com sucesso.`
          : `O usuário "${user.nome || user.email}" foi reativado com sucesso.`,
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);

      setConfirmation(null);

      showToast(
        `O perfil de "${
          user.nome || user.email
        }" foi alterado para ${getRoleLabel(
          newRole,
        )}.`,
        "success",
      );

    } catch (roleError) {
      console.error(
        "Erro ao alterar perfil:",
        roleError,
      );

      showToast(
        "Não foi possível alterar o perfil do usuário.",
        "error",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="super-admin-page users-page">
      <div className="super-admin-page-heading">
        {successMessage && (
          <div className="users-success-message">
            <span className="users-success-message__icon">
              ✓
            </span>

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

        {error && (
          <div className="super-admin-alert super-admin-alert--error">
            {error}
          </div>
        )}

        <div>
          <h2>Usuários</h2>

          <p>
            Gerencie perfis, acessos e status dos
            usuários da plataforma.
          </p>
        </div>

        <button
          type="button"
          className="super-admin-button super-admin-button--secondary"
          onClick={loadUsers}
          disabled={loading}
        >
          {loading
            ? "Atualizando..."
            : "Atualizar"}
        </button>
      </div>

      {error && (
        <div className="super-admin-alert super-admin-alert--error">
          {error}
        </div>
      )}

      <div className="users-summary">
        <div className="users-summary__item">
          <strong>{users.length}</strong>
          <span>Usuários</span>
        </div>

        <div className="users-summary__item">
          <strong>
            {
              users.filter(
                (user) =>
                  user.status === "active",
              ).length
            }
          </strong>
          <span>Ativos</span>
        </div>

        <div className="users-summary__item">
          <strong>
            {
              users.filter(
                (user) =>
                  user.status === "blocked",
              ).length
            }
          </strong>
          <span>Bloqueados</span>
        </div>

        <div className="users-summary__item">
          <strong>
            {
              users.filter(
                (user) =>
                  user.role === "subscriber",
              ).length
            }
          </strong>
          <span>Assinantes</span>
        </div>
      </div>

      <div className="super-admin-panel">
        <div className="users-filters">
          <div className="users-filter users-filter--search">
            <label htmlFor="user-search">
              Pesquisar
            </label>

            <input
              id="user-search"
              type="search"
              value={search}
              placeholder="Nome, e-mail, CPF ou telefone"
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="users-filter">
            <label htmlFor="role-filter">
              Perfil
            </label>

            <select
              id="role-filter"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value,
                )
              }
            >
              <option value="all">
                Todos os perfis
              </option>

              {ROLE_OPTIONS.map((role) => (
                <option
                  key={role.value}
                  value={role.value}
                >
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="users-filter">
            <label htmlFor="status-filter">
              Status
            </label>

            <select
              id="status-filter"
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

              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {loading ? (
          <p>Carregando usuários...</p>
        ) : filteredUsers.length === 0 ? (
          <div className="super-admin-empty">
            <span>👤</span>
            <h4>Nenhum usuário encontrado</h4>
            <p>
              Não foram encontrados usuários com
              os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="super-admin-table-wrapper">
            <table className="super-admin-table users-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Contato</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Estabelecimento</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const isUpdating =
                    updatingId === user.id;

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="users-table__identity">
                          <strong>
                            {user.nome ||
                              "Sem nome"}
                          </strong>

                          <small>
                            CPF:{" "}
                            {user.cpf ||
                              "Não informado"}
                          </small>
                        </div>
                      </td>

                      <td>
                        <div className="users-table__contact">
                          <span>
                            {user.email ||
                              "E-mail não informado"}
                          </span>

                          <small>
                            {user.telefone ||
                              "Telefone não informado"}
                          </small>
                        </div>
                      </td>

                      <td>
                        <select
                          className="users-role-select"
                          value={
                            user.role || "subscriber"
                          }
                          disabled={isUpdating}
                          onChange={(event) =>
                            handleRoleChange(
                              user,
                              event.target.value,
                            )
                          }
                        >
                          {ROLE_OPTIONS.map(
                            (role) => (
                              <option
                                key={role.value}
                                value={role.value}
                              >
                                {role.label}
                              </option>
                            ),
                          )}
                        </select>

                        <small className="users-role-label">
                          {getRoleLabel(user.role)}
                        </small>
                      </td>

                      <td>
                        <span
                          className={`status-badge status-badge--${
                            user.status || "pending"
                          }`}
                        >
                          {getStatusLabel(
                            user.status,
                          )}
                        </span>
                      </td>

                      <td>
                        {user.estabelecimentoId ||
                          "Não vinculado"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            user.status === "blocked"
                              ? "super-admin-button super-admin-button--success"
                              : "super-admin-button super-admin-button--danger"
                          }
                          disabled={isUpdating}
                          onClick={() =>
                            handleStatusToggle(user)
                          }
                        >
                          {isUpdating
                            ? "Salvando..."
                            : user.status ===
                                "blocked"
                              ? "Reativar"
                              : "Bloquear"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmation && (
        <div
          className="confirmation-modal-overlay"
          role="presentation"
          onClick={() => {
            if (!updatingId) {
              setConfirmation(null);
            }
          }}
        >
          <div
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className={`confirmation-modal__icon ${
                confirmation.newStatus === "blocked"
                  ? "confirmation-modal__icon--danger"
                  : "confirmation-modal__icon--success"
              }`}
            >
              {confirmation.newStatus === "blocked"
                ? "!"
                : "✓"}
            </div>

            <div className="confirmation-modal__content">
              <h3 id="confirmation-modal-title">
                {confirmation.newStatus === "blocked"
                  ? "Confirmar bloqueio"
                  : "Confirmar reativação"}
              </h3>

              <p>
                {confirmation.newStatus === "blocked"
                  ? "Deseja realmente bloquear o usuário"
                  : "Deseja realmente reativar o usuário"}
                ?
              </p>

              <strong className="confirmation-modal__user">
                {confirmation.user.nome ||
                  confirmation.user.email ||
                  "Usuário não identificado"}
              </strong>

              <p className="confirmation-modal__description">
                {confirmation.newStatus === "blocked"
                  ? "O usuário perderá o acesso ao sistema até que seja reativado."
                  : "O usuário voltará a ter acesso ao sistema."}
              </p>
            </div>

            <div className="confirmation-modal__actions">
              <button
                type="button"
                className="confirmation-modal__button confirmation-modal__button--cancel"
                disabled={Boolean(updatingId)}
                onClick={() =>
                  setConfirmation(null)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className={
                  confirmation.newStatus === "blocked"
                    ? "confirmation-modal__button confirmation-modal__button--danger"
                    : "confirmation-modal__button confirmation-modal__button--success"
                }
                disabled={Boolean(updatingId)}
                onClick={confirmStatusChange}
              >
                {updatingId
                  ? "Salvando..."
                  : confirmation.newStatus ===
                      "blocked"
                    ? "Bloquear usuário"
                    : "Reativar usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}