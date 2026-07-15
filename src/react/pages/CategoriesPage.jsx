import React, {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../contexts/AuthContext.jsx";

import {
  createCategory,
  deleteCategory,
  observeCategories,
  updateCategory,
  updateCategoryOrder,
  updateCategoryVisibility,
} from "../services/categoryService.js";

import {
  showToast,
} from "../services/toast.js";

const INITIAL_FORM = {
  nome: "",
  descricao: "",
  icone: "🍽️",
};

export function CategoriesPage({
  onNavigate,
}) {
  const {
    establishmentId,
  } = useAuth();

  const [categories, setCategories] =
    useState([]);

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [
    editingCategoryId,
    setEditingCategoryId,
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

    const unsubscribe =
      observeCategories(
        establishmentId,
        (firebaseCategories) => {
          setCategories(
            firebaseCategories,
          );

          setLoading(false);
        },
        (error) => {
          console.error(error);
          setLoading(false);

          showToast(
            "Não foi possível carregar as categorias.",
            "error",
            4000,
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

  function startEditing(category) {
    setEditingCategoryId(
      category.id,
    );

    setForm({
      nome: category.nome || "",
      descricao:
        category.descricao || "",
      icone:
        category.icone || "🍽️",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingCategoryId(null);
    setForm(INITIAL_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);

      if (editingCategoryId) {
        await updateCategory({
          establishmentId,
          categoryId:
            editingCategoryId,
          ...form,
        });

        showToast(
          "Categoria atualizada com sucesso!",
          "success",
        );
      } else {
        await createCategory({
          establishmentId,
          ...form,
        });

        showToast(
          "Categoria criada com sucesso!",
          "success",
        );
      }

      cancelEditing();
    } catch (error) {
      console.error(
        "Erro ao salvar categoria:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível salvar a categoria.",
        "error",
        5000,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVisibility(
    category,
  ) {
    try {
      await updateCategoryVisibility({
        establishmentId,
        categoryId: category.id,
        ativa:
          category.ativa === false,
      });
    } catch (error) {
      showToast(
        error.message ||
          "Não foi possível atualizar a categoria.",
        "error",
      );
    }
  }

  async function moveCategory(
    category,
    direction,
  ) {
    const currentIndex =
      categories.findIndex(
        (item) =>
          item.id === category.id,
      );

    const targetIndex =
      currentIndex + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= categories.length
    ) {
      return;
    }

    const targetCategory =
      categories[targetIndex];

    try {
      await Promise.all([
        updateCategoryOrder({
          establishmentId,
          categoryId:
            category.id,
          ordem:
            targetCategory.ordem,
        }),

        updateCategoryOrder({
          establishmentId,
          categoryId:
            targetCategory.id,
          ordem:
            category.ordem,
        }),
      ]);
    } catch (error) {
      showToast(
        error.message ||
          "Não foi possível alterar a ordem.",
        "error",
      );
    }
  }

  async function handleDelete(
    category,
  ) {
    const confirmed =
      window.confirm(
        `Excluir a categoria "${category.nome}"?`,
      );

    if (!confirmed) return;

    try {
      await deleteCategory({
        establishmentId,
        categoryId: category.id,
      });

      if (
        editingCategoryId ===
        category.id
      ) {
        cancelEditing();
      }

      showToast(
        "Categoria excluída.",
        "success",
      );
    } catch (error) {
      showToast(
        error.message ||
          "Não foi possível excluir a categoria.",
        "error",
      );
    }
  }

  return (
    <main className="admin-main">
      <section className="admin-page-header">
        <div>
          <h1>Categorias</h1>

          <p>
            Organize as categorias do
            cardápio.
          </p>
        </div>

      </section>

      <section className="products-layout">
        <form
          className="auth-card auth-form"
          onSubmit={handleSubmit}
        >
          <h2>
            {editingCategoryId
              ? "Editar categoria"
              : "Nova categoria"}
          </h2>

          <label>
            Nome

            <input
              name="nome"
              value={form.nome}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Descrição

            <textarea
              name="descricao"
              value={form.descricao}
              onChange={updateField}
              rows={4}
            />
          </label>

          <label>
            Ícone ou emoji

            <input
              name="icone"
              value={form.icone}
              onChange={updateField}
              maxLength={8}
            />
          </label>

          <button
            className="btn-finalizar"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Salvando..."
              : editingCategoryId
                ? "Salvar alterações"
                : "Criar categoria"}
          </button>

          {editingCategoryId && (
            <button
              className="btn-client-view"
              type="button"
              onClick={
                cancelEditing
              }
            >
              Cancelar edição
            </button>
          )}
        </form>

        <section>
          <h2>
            Categorias cadastradas
          </h2>

          {loading ? (
            <p>
              Carregando categorias...
            </p>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <p>
                Nenhuma categoria cadastrada.
              </p>
            </div>
          ) : (
            <div className="pedidos-grid">
              {categories.map(
                (category, index) => (
                  <article
                    className={
                      "pedido-card-admin"
                    }
                    key={category.id}
                  >
                    <div
                      className={
                        "pedido-card-admin__header"
                      }
                    >
                      <strong>
                        {category.icone ||
                          "🍽️"}{" "}
                        {category.nome}
                      </strong>

                      <span>
                        {category.ativa ===
                        false
                          ? "Oculta"
                          : "Visível"}
                      </span>
                    </div>

                    <p>
                      {category.descricao ||
                        "Sem descrição"}
                    </p>

                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "20px",
                        }}
                        >
                        <button
                            type="button"
                            onClick={() => startEditing(category)}
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            onClick={() => toggleVisibility(category)}
                        >
                            {category.ativa ? "Ocultar" : "Mostrar"}
                        </button>

                        <button
                            type="button"
                            onClick={() => moveCategory(category, -1)}
                        >
                            ↑
                        </button>

                        <button
                            type="button"
                            onClick={() => moveCategory(category, 1)}
                        >
                            ↓
                        </button>

                        <button
                            type="button"
                            onClick={() => handleDelete(category)}
                        >
                            Excluir
                        </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}