import React, {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../contexts/AuthContext.jsx";

import {
  observeCategories,
} from "../services/categoryService.js";

import {
  createProduct,
  observeProducts,
  updateProductAvailability,
} from "../services/productService.js";

import {
  formatCurrency,
} from "../services/formatters.js";

import {
  showToast,
} from "../services/toast.js";

const INITIAL_FORM = {
  nome: "",
  descricao: "",
  preco: "",
  categoriaId: "",
  emoji: "🍽️",
  foto: null,
};

export function ProductsPage({
  onNavigate,
}) {
  const {
    establishmentId,
  } = useAuth();

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [categories, setCategories] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [imagePreview, setImagePreview] =
  useState("");

  const [uploadProgress, setUploadProgress] =
  useState(0);

  useEffect(() => {
    if (!establishmentId) {
      setLoading(false);
      return undefined;
    }

    const stopCategories =
      observeCategories(
        establishmentId,
        setCategories,
        (error) => {
          console.error(error);
        },
      );

    const stopProducts =
      observeProducts(
        establishmentId,
        (firebaseProducts) => {
          setProducts(firebaseProducts);
          setLoading(false);
        },
        (error) => {
          console.error(error);
          setLoading(false);
        },
      );

    return () => {
      stopCategories?.();
      stopProducts?.();
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

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);

      await createProduct({
        establishmentId,
        ...form,

        onUploadProgress: (progress) => {
            setUploadProgress(progress);
        },
      });

      setForm(INITIAL_FORM);

      showToast(
        "Produto cadastrado com sucesso!",
        "success",
      );

      if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      }

      setForm(INITIAL_FORM);
      setImagePreview("");
      setUploadProgress(0);
    } catch (error) {
      console.error(
        "Erro ao cadastrar produto:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível cadastrar o produto.",
        "error",
        5000,
      );
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  }

  async function toggleAvailability(product) {
    try {
      await updateProductAvailability({
        establishmentId,
        productId: product.id,
        disponivel: !product.disponivel,
      });
    } catch (error) {
      showToast(
        error.message ||
          "Não foi possível atualizar o produto.",
        "error",
      );
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
        setForm((current) => ({
        ...current,
        foto: null,
        }));

        setImagePreview("");
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
        showToast(
        "Use uma imagem JPG, PNG ou WebP.",
        "warning",
        );

        event.target.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast(
        "A imagem deve ter no máximo 5 MB.",
        "warning",
        );

        event.target.value = "";
        return;
    }

    if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
    }

    const previewUrl =
        URL.createObjectURL(file);

    setImagePreview(previewUrl);

    setForm((current) => ({
        ...current,
        foto: file,
    }));
    }

  useEffect(() => {
    return () => {
        if (imagePreview) {
        URL.revokeObjectURL(
            imagePreview,
        );
        }
    };
    }, [imagePreview]);

  return (
    <main className="admin-main">
      <section className="admin-page-header">
        <div>
          <h1>Produtos</h1>
          <p>
            Cadastre e gerencie os produtos do
            cardápio.
          </p>
        </div>

      </section>


      <section className="products-layout">
        <form
          className="auth-card auth-form"
          onSubmit={handleSubmit}
        >
          <h2>Novo produto</h2>

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
            Preço

            <input
              name="preco"
              value={form.preco}
              onChange={updateField}
              placeholder="Ex.: 29,90"
              inputMode="decimal"
              required
            />
          </label>

          <label>
            Categoria

            <select
              name="categoriaId"
              value={form.categoriaId}
              onChange={updateField}
              required
            >
              <option value="">
                Selecione
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.icone}{" "}
                  {category.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            Emoji

            <input
              name="emoji"
              value={form.emoji}
              onChange={updateField}
              maxLength={4}
            />
          </label>

          <label>
            Foto do produto

            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={submitting}
            />
            </label>

            {imagePreview && (
            <div className="product-image-preview">
                <img
                src={imagePreview}
                alt="Prévia do produto"
                />

                <button
                type="button"
                onClick={() => {
                    URL.revokeObjectURL(
                    imagePreview,
                    );

                    setImagePreview("");

                    setForm((current) => ({
                    ...current,
                    foto: null,
                    }));
                }}
                >
                Remover foto
                </button>
            </div>
            )}

            {submitting && uploadProgress > 0 && (
            <div className="upload-progress">
                <div
                className="upload-progress__bar"
                style={{
                    width: `${uploadProgress}%`,
                }}
                />

                <span>
                Enviando foto: {uploadProgress}%
                </span>
            </div>
            )}

          <button
            className="btn-finalizar"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Cadastrando..."
              : "Cadastrar produto"}
          </button>
        </form>

        <section>
          <h2>Produtos cadastrados</h2>

          {loading ? (
            <p>Carregando produtos...</p>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <p>
                Nenhum produto cadastrado.
              </p>
            </div>
          ) : (
            <div className="pedidos-grid">
              {products.map((product) => (
                <article
                  className="pedido-card-admin"
                  key={product.id}
                >

                  {product.fotoUrl ? (
                    <img
                      className="admin-product-image"
                      src={product.fotoUrl}
                      alt={product.nome}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="admin-product-placeholder"
                      aria-hidden="true"
                  >
                      {product.emoji || "🍽️"}
                  </div>
                  )}
                  <div className="pedido-card-admin__header">
                    <strong>
                      {product.emoji || "🍽️"}{" "}
                      {product.nome}
                    </strong>

                    <span>
                      {formatCurrency(
                        Number(product.preco) || 0,
                      )}
                    </span>
                  </div>

                  <p>
                    {product.descricao ||
                      "Sem descrição"}
                  </p>

                  <button
                    type="button"
                    className="btn-client-view"
                    onClick={() =>
                      toggleAvailability(product)
                    }
                  >
                    {product.disponivel
                      ? "Marcar indisponível"
                      : "Marcar disponível"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}