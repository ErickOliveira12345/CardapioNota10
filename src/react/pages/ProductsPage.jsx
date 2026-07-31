import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "../contexts/AuthContext.jsx";

import {
  observeCategories,
} from "../services/categoryService.js";

import {
  createProduct,
  deleteProduct,
  observeProducts,
  updateProduct,
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

  const fileInputRef = useRef(null);

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

  const [
    deletingProductId,
    setDeletingProductId,
  ] = useState(null);

  const [
    editingProduct,
    setEditingProduct,
  ] = useState(null);

  const [
    removeCurrentImage,
    setRemoveCurrentImage,
  ] = useState(false);

  const [
    imagePreview,
    setImagePreview,
  ] = useState("");

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

  useEffect(() => {
    if (!establishmentId) {
      setProducts([]);
      setCategories([]);
      setLoading(false);

      return undefined;
    }

    setLoading(true);

    const stopCategories =
      observeCategories(
        establishmentId,
        setCategories,
        (error) => {
          console.error(
            "Erro ao carregar categorias:",
            error,
          );
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
          console.error(
            "Erro ao carregar produtos:",
            error,
          );

          setLoading(false);
        },
      );

    return () => {
      stopCategories?.();
      stopProducts?.();
    };
  }, [establishmentId]);

  useEffect(() => {
    return () => {
      if (
        imagePreview?.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          imagePreview,
        );
      }
    };
  }, [imagePreview]);

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

  function clearFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearForm() {
    if (
      imagePreview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        imagePreview,
      );
    }

    setForm(INITIAL_FORM);
    setEditingProduct(null);
    setImagePreview("");
    setRemoveCurrentImage(false);
    setUploadProgress(0);

    clearFileInput();
  }

  function startEditingProduct(product) {
    if (
      imagePreview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        imagePreview,
      );
    }

    setEditingProduct(product);

    setForm({
      nome:
        product.nome || "",

      descricao:
        product.descricao || "",

      preco:
        String(
          product.preco ?? "",
        ).replace(".", ","),

      categoriaId:
        product.categoriaId || "",

      emoji:
        product.emoji || "🍽️",

      foto: null,
    });

    setImagePreview(
      product.fotoUrl || "",
    );

    setRemoveCurrentImage(false);
    setUploadProgress(0);

    clearFileInput();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    clearForm();
  }

  function handleImageChange(event) {
    const file =
      event.target.files?.[0];

    if (!file) {
      setForm((current) => ({
        ...current,
        foto: null,
      }));

      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      showToast(
        "Use uma imagem JPG, PNG ou WebP.",
        "warning",
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      showToast(
        "A imagem deve ter no máximo 5 MB.",
        "warning",
      );

      event.target.value = "";
      return;
    }

    if (
      imagePreview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        imagePreview,
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);

    setRemoveCurrentImage(false);

    setForm((current) => ({
      ...current,
      foto: file,
    }));
  }

  function handleRemoveImage() {
    if (
      imagePreview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        imagePreview,
      );
    }

    setImagePreview("");

    setForm((current) => ({
      ...current,
      foto: null,
    }));

    setRemoveCurrentImage(
      Boolean(
        editingProduct?.fotoPath ||
        editingProduct?.fotoUrl,
      ),
    );

    clearFileInput();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress(0);

      if (editingProduct) {
        await updateProduct({
          establishmentId,

          productId:
            editingProduct.id,

          nome:
            form.nome,

          descricao:
            form.descricao,

          preco:
            form.preco,

          categoriaId:
            form.categoriaId,

          emoji:
            form.emoji,

          foto:
            form.foto,

          fotoPathAtual:
            editingProduct.fotoPath ||
            "",

          removerFoto:
            removeCurrentImage,

          onUploadProgress:
            setUploadProgress,
        });

        showToast(
          "Produto atualizado com sucesso!",
          "success",
        );
      } else {
        await createProduct({
          establishmentId,

          nome:
            form.nome,

          descricao:
            form.descricao,

          preco:
            form.preco,

          categoriaId:
            form.categoriaId,

          emoji:
            form.emoji,

          foto:
            form.foto,

          onUploadProgress:
            setUploadProgress,
        });

        showToast(
          "Produto cadastrado com sucesso!",
          "success",
        );
      }

      clearForm();
    } catch (error) {
      console.error(
        editingProduct
          ? "Erro ao editar produto:"
          : "Erro ao cadastrar produto:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível salvar o produto.",
        "error",
        5000,
      );
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  }

  async function toggleAvailability(
    product,
  ) {
    try {
      await updateProductAvailability({
        establishmentId,
        productId:
          product.id,
        disponivel:
          !product.disponivel,
      });

      showToast(
        product.disponivel
          ? "Produto marcado como indisponível."
          : "Produto marcado como disponível.",
        "success",
      );
    } catch (error) {
      console.error(
        "Erro ao alterar disponibilidade:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível atualizar o produto.",
        "error",
      );
    }
  }

  async function handleDeleteProduct(
    product,
  ) {
    const confirmed =
      window.confirm(
        `Deseja realmente excluir o produto "${product.nome}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProductId(
        product.id,
      );

      await deleteProduct({
        establishmentId,
        productId:
          product.id,
        fotoPath:
          product.fotoPath || "",
      });

      if (
        editingProduct?.id ===
        product.id
      ) {
        clearForm();
      }

      showToast(
        "Produto excluído com sucesso!",
        "success",
      );
    } catch (error) {
      console.error(
        "Erro ao excluir produto:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível excluir o produto.",
        "error",
        5000,
      );
    } finally {
      setDeletingProductId(null);
    }
  }

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
          <h2>
            {editingProduct
              ? "Editar produto"
              : "Novo produto"}
          </h2>

          {editingProduct && (
            <p>
              Editando:{" "}
              <strong>
                {editingProduct.nome}
              </strong>
            </p>
          )}

          <label>
            Nome

            <input
              name="nome"
              value={form.nome}
              onChange={updateField}
              disabled={submitting}
              required
            />
          </label>

          <label>
            Descrição

            <textarea
              name="descricao"
              value={form.descricao}
              onChange={updateField}
              disabled={submitting}
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
              disabled={submitting}
              required
            />
          </label>

          <label>
            Categoria

            <select
              name="categoriaId"
              value={form.categoriaId}
              onChange={updateField}
              disabled={submitting}
              required
            >
              <option value="">
                Selecione
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.icone}{" "}
                    {category.nome}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Emoji

            <input
              name="emoji"
              value={form.emoji}
              onChange={updateField}
              disabled={submitting}
              maxLength={4}
            />
          </label>

          <label>
            Foto do produto

            <input
              ref={fileInputRef}
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
                onClick={handleRemoveImage}
                disabled={submitting}
              >
                Remover foto
              </button>
            </div>
          )}

          {editingProduct &&
            !imagePreview &&
            removeCurrentImage && (
              <p>
                A imagem atual será removida ao
                salvar as alterações.
              </p>
            )}

          {submitting &&
            uploadProgress > 0 && (
              <div className="upload-progress">
                <div
                  className="upload-progress__bar"
                  style={{
                    width:
                      `${uploadProgress}%`,
                  }}
                />

                <span>
                  Enviando foto:{" "}
                  {uploadProgress}%
                </span>
              </div>
            )}

          <button
            className="btn-finalizar"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? editingProduct
                ? "Salvando..."
                : "Cadastrando..."
              : editingProduct
                ? "Salvar alterações"
                : "Cadastrar produto"}
          </button>

          {editingProduct && (
            <button
              type="button"
              className="btn-client-view"
              onClick={cancelEditing}
              disabled={submitting}
            >
              Cancelar edição
            </button>
          )}
        </form>

        <section>
          <h2>
            Produtos cadastrados
          </h2>

          {loading ? (
            <p>
              Carregando produtos...
            </p>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <p>
                Nenhum produto cadastrado.
              </p>
            </div>
          ) : (
            <div className="pedidos-grid">
              {products.map(
                (product) => {
                  const isDeleting =
                    deletingProductId ===
                    product.id;

                  return (
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
                          {product.emoji ||
                            "🍽️"}
                        </div>
                      )}

                      <div className="pedido-card-admin__header">
                        <strong>
                          {product.emoji ||
                            "🍽️"}{" "}
                          {product.nome}
                        </strong>

                        <span>
                          {formatCurrency(
                            Number(
                              product.preco,
                            ) || 0,
                          )}
                        </span>
                      </div>

                      <p>
                        {product.descricao ||
                          "Sem descrição"}
                      </p>

                      <p>
                        Status:{" "}
                        <strong>
                          {product.disponivel
                            ? "Disponível"
                            : "Indisponível"}
                        </strong>
                      </p>

                      <button
                        type="button"
                        className="btn-client-view"
                        disabled={
                          isDeleting ||
                          submitting
                        }
                        onClick={() =>
                          toggleAvailability(
                            product,
                          )
                        }
                      >
                        {product.disponivel
                          ? "Marcar indisponível"
                          : "Marcar disponível"}
                      </button>

                      <div className="product-actions">
                        <button
                          type="button"
                          className="category-action-btn"
                          disabled={
                            isDeleting ||
                            submitting
                          }
                          onClick={() =>
                            startEditingProduct(
                              product,
                            )
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="category-delete-btn"
                          disabled={
                            isDeleting ||
                            submitting
                          }
                          onClick={() =>
                            handleDeleteProduct(
                              product,
                            )
                          }
                        >
                          {isDeleting
                            ? "Excluindo..."
                            : "Excluir"}
                        </button>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}