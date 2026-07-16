import React, {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../contexts/AuthContext.jsx";

import {
  createTable,
  deleteTable,
  observeTables,
  regenerateTableToken,
  updateTable,
  updateTableStatus,
} from "../services/tableService.js";

import {
  showToast,
} from "../services/toast.js";

import {
  TableQrCode,
} from "../components/TableQrCode.jsx";

const INITIAL_FORM = {
  numero: "",
  nome: "",
  descricao: "",
};

export function TablesPage() {
  const {
    establishmentId,
  } = useAuth();

  const [tables, setTables] =
    useState([]);

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [
    editingTableId,
    setEditingTableId,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    if (!establishmentId) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = observeTables(
      establishmentId,
      (firebaseTables) => {
        setTables(firebaseTables);
        setLoading(false);
      },
      () => {
        setLoading(false);

        showToast(
          "Não foi possível carregar as mesas.",
          "error",
        );
      },
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [establishmentId]);

  function updateField(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEditing(table) {
    setEditingTableId(table.id);

    setForm({
      numero: String(table.numero || ""),
      nome: table.nome || "",
      descricao: table.descricao || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingTableId(null);
    setForm(INITIAL_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    const duplicatedNumber = tables.some(
      (table) =>
        Number(table.numero) ===
          Number(form.numero) &&
        table.id !== editingTableId,
    );

    if (duplicatedNumber) {
      showToast(
        "Já existe uma mesa com esse número.",
        "warning",
      );

      return;
    }

    try {
      setSubmitting(true);

      if (editingTableId) {
        await updateTable({
          establishmentId,
          tableId: editingTableId,
          ...form,
        });

        showToast(
          "Mesa atualizada com sucesso!",
          "success",
        );
      } else {
        await createTable({
          establishmentId,
          ...form,
        });

        showToast(
          "Mesa criada com sucesso!",
          "success",
        );
      }

      cancelEditing();
    } catch (error) {
      console.error(
        "Erro ao salvar mesa:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível salvar a mesa.",
        "error",
        5000,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(table) {
    try {
      await updateTableStatus({
        establishmentId,
        tableId: table.id,
        ativa: table.ativa === false,
      });
    } catch (error) {
      showToast(
        error.message ||
          "Não foi possível atualizar a mesa.",
        "error",
      );
    }
  }

  async function handleRegenerateToken(
    table,
  ) {
    const confirmed = window.confirm(
      `Gerar um novo acesso para a Mesa ${table.numero}? O QR Code antigo deixará de funcionar.`,
    );

    if (!confirmed) return;

    try {
      await regenerateTableToken({
        establishmentId,
        tableId: table.id,
      });

      showToast(
        "Token da mesa atualizado.",
        "success",
      );
    } catch (error) {
      showToast(
        error.message ||
          "Não foi possível atualizar o token.",
        "error",
      );
    }
  }

  async function handleDelete(table) {
    const confirmed = window.confirm(
      `Excluir a Mesa ${table.numero}?`,
    );

    if (!confirmed) return;

    try {
      await deleteTable({
        establishmentId,
        tableId: table.id,
      });

      if (editingTableId === table.id) {
        cancelEditing();
      }

      showToast(
        "Mesa excluída.",
        "success",
      );
    } catch (error) {
      showToast(
        error.message ||
          "Não foi possível excluir a mesa.",
        "error",
      );
    }
  }

  function buildMenuUrl(table) {
    const baseUrl = window.location.origin;

    return (
      `${baseUrl}/menu` +
      `?est=${establishmentId}` +
      `&mesa=${table.numero}` +
      `&token=${table.token}`
    );
  }

  async function copyMenuLink(table) {
    try {
      await navigator.clipboard.writeText(
        buildMenuUrl(table),
      );

      showToast(
        "Link da mesa copiado.",
        "success",
      );
    } catch {
      showToast(
        "Não foi possível copiar o link.",
        "error",
      );
    }
  }

  return (
    <main className="admin-main">
      <section className="admin-page-header">
        <div>
          <h1>Mesas</h1>

          <p>
            Cadastre as mesas e prepare os
            acessos do cardápio.
          </p>
        </div>
      </section>

      <section className="products-layout">
        <form
          className="auth-card auth-form"
          onSubmit={handleSubmit}
        >
          <h2>
            {editingTableId
              ? "Editar mesa"
              : "Nova mesa"}
          </h2>

          <label>
            Número da mesa

            <input
              type="number"
              name="numero"
              min="1"
              step="1"
              value={form.numero}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Nome

            <input
              name="nome"
              value={form.nome}
              onChange={updateField}
              placeholder="Ex.: Mesa da janela"
            />
          </label>

          <label>
            Descrição

            <textarea
              name="descricao"
              value={form.descricao}
              onChange={updateField}
              rows={4}
              placeholder="Ex.: Próxima à entrada"
            />
          </label>

          <button
            className="btn-finalizar"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Salvando..."
              : editingTableId
                ? "Salvar alterações"
                : "Criar mesa"}
          </button>

          {editingTableId && (
            <button
              className="category-action-btn"
              type="button"
              onClick={cancelEditing}
            >
              Cancelar edição
            </button>
          )}
        </form>

        <section>
          <h2>Mesas cadastradas</h2>

          {loading ? (
            <p>Carregando mesas...</p>
          ) : tables.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma mesa cadastrada.</p>
            </div>
          ) : (
            <div className="pedidos-grid">
              {tables.map((table) => (
                <article
                  className="pedido-card-admin"
                  key={table.id}
                >
                  <div className="pedido-card-admin__header">
                    <strong>
                      🪑 Mesa {table.numero}
                    </strong>

                    <span>
                      {table.ativa === false
                        ? "Inativa"
                        : "Ativa"}
                    </span>
                  </div>

                  <h3>
                    {table.nome ||
                      `Mesa ${table.numero}`}
                  </h3>

                  <p>
                    {table.descricao ||
                      "Sem descrição"}
                  </p>

                  <TableQrCode
                    value={buildMenuUrl(table)}
                    tableNumber={table.numero}
                  />

                  <div className="table-link-box">
                    <span>Link do cardápio</span>

                    <code>
                      {buildMenuUrl(table)}
                    </code>
                  </div>

                  <div className="admin-category-actions">
                    <button
                      type="button"
                      className="category-action-btn"
                      onClick={() =>
                        startEditing(table)
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="category-action-btn"
                      onClick={() =>
                        toggleStatus(table)
                      }
                    >
                      {table.ativa === false
                        ? "Ativar"
                        : "Desativar"}
                    </button>

                    <button
                      type="button"
                      className="category-action-btn"
                      onClick={() =>
                        copyMenuLink(table)
                      }
                    >
                      Copiar link
                    </button>

                    <button
                      type="button"
                      className="category-action-btn"
                      onClick={() =>
                        handleRegenerateToken(
                          table,
                        )
                      }
                    >
                      Novo token
                    </button>

                    <button
                      type="button"
                      className="category-delete-btn"
                      onClick={() =>
                        handleDelete(table)
                      }
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}