import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  formatCurrency,
  formatTime,
  getStatus,
} from "../services/formatters.js";

export function MenuPage({
  table,
  onNavigate,
  onAddItem,
  onOpenCart,
  onRequestService,
  cartCount,
  activeOrder,

  // Dados que futuramente virão do Firestore.
  categories,
  products,

  firebaseLoading = false,
}) {
  const [activeCategory, setActiveCategory] =
    useState(null);

  const availableCategories = useMemo(() => {
     const source = Array.isArray(categories)
    ? categories
    : [];

    return source
      .filter(
        (category) =>
          category.ativa !== false &&
          category.active !== false,
      )
      .sort(
        (firstCategory, secondCategory) =>
          Number(
            firstCategory.ordem ??
              firstCategory.displayOrder ??
              0,
          ) -
          Number(
            secondCategory.ordem ??
              secondCategory.displayOrder ??
              0,
          ),
      );
  }, [categories]);

  const availableProducts = useMemo(() => {
    const source = Array.isArray(products)
      ? products
      : [];

    return source
      .filter(
        (product) =>
          product.ativo !== false &&
          product.active !== false &&
          product.disponivel !== false &&
          product.available !== false,
      )
      .sort(
        (firstProduct, secondProduct) =>
          Number(
            firstProduct.ordem ??
              firstProduct.displayOrder ??
              0,
          ) -
          Number(
            secondProduct.ordem ??
              secondProduct.displayOrder ??
              0,
          ),
      );
  }, [products]);

  const selectedCategory = useMemo(() => {
    return availableCategories.find(
      (category) =>
        String(category.id) ===
        String(activeCategory),
    );
  }, [
    activeCategory,
    availableCategories,
  ]);

  const categoryItems = useMemo(() => {
    return availableProducts.filter(
      (product) => {
        const productCategory =
          product.categoriaId ??
          product.categoria ??
          product.categoryId;

        return (
          String(productCategory) ===
          String(activeCategory)
        );
      },
    );
  }, [
    activeCategory,
    availableProducts,
  ]);

  /*
   * Caso uma categoria seja desativada ou excluída
   * enquanto o usuário estiver nela, volta para
   * a tela inicial do cardápio.
   */
  useEffect(() => {
    if (!activeCategory) return;

    const categoryStillExists =
      availableCategories.some(
        (category) =>
          String(category.id) ===
          String(activeCategory),
      );

    if (!categoryStillExists) {
      setActiveCategory(null);
    }
  }, [
    activeCategory,
    availableCategories,
  ]);

  return (
    <>
      <header className="menu-header">
        <div className="menu-header__left">
          <button
            className="btn-back-home"
            type="button"
            onClick={() => onNavigate("/")}
          >
            ← Mesas
          </button>
        </div>

        <div className="menu-header__center">
          <span className="mesa-badge">
            Mesa {table}
          </span>
        </div>

        <div className="menu-header__right">
          <button
            className="btn-servico"
            type="button"
            onClick={onRequestService}
          >
            Atendimento
          </button>
        </div>
      </header>

      <nav
        className="categorias-nav"
        aria-label="Categorias do cardápio"
      >
        {availableCategories.map(
          (category) => (
            <button
              className={
                `categoria-tab ${
                  String(activeCategory) ===
                  String(category.id)
                    ? "active"
                    : ""
                }`
              }
              key={category.id}
              type="button"
              onClick={() =>
                setActiveCategory(category.id)
              }
            >
              <span aria-hidden="true">
                {category.icone ??
                  category.icon ??
                  "🍽️"}
              </span>

              {category.nome ??
                category.name}
            </button>
          ),
        )}
      </nav>

      <main>
        {firebaseLoading && (
          <section className="empty-state">
            <span
              className="empty-state__icon"
              aria-hidden="true"
            >
              ⏳
            </span>

            <p>Carregando cardápio...</p>
          </section>
        )}

        {!firebaseLoading &&
          availableCategories.length === 0 && (
            <section className="empty-state">
              <span
                className="empty-state__icon"
                aria-hidden="true"
              >
                🍽️
              </span>

              <p>
                Nenhuma categoria disponível no
                momento.
              </p>
            </section>
          )}

        {!firebaseLoading &&
          availableCategories.length > 0 &&
          !activeCategory && (
            <section className="welcome-section">
              <div className="welcome-hero">
                <div
                  className="welcome-hero__emoji"
                  aria-hidden="true"
                >
                  🍽️
                </div>

                <h2>Bem-vindo!</h2>

                <p>
                  Selecione uma categoria para ver
                  o cardápio
                </p>
              </div>

              <h3>O que você quer hoje?</h3>

              <div className="categorias-grid">
                {availableCategories.map(
                  (category) => (
                    <button
                      className="categoria-card"
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setActiveCategory(
                          category.id,
                        )
                      }
                      aria-label={
                        `Ver ${
                          category.nome ??
                          category.name
                        }`
                      }
                    >
                      <span
                        className={
                          "categoria-card__icon"
                        }
                        aria-hidden="true"
                      >
                        {category.icone ??
                          category.icon ??
                          "🍽️"}
                      </span>

                      <h3
                        className={
                          "categoria-card__nome"
                        }
                      >
                        {category.nome ??
                          category.name}
                      </h3>

                      <p
                        className={
                          "categoria-card__desc"
                        }
                      >
                        {category.descricao ??
                          category.description ??
                          ""}
                      </p>

                      <span
                        className={
                          "categoria-card__arrow"
                        }
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </button>
                  ),
                )}
              </div>
            </section>
          )}

        {!firebaseLoading &&
          activeCategory &&
          selectedCategory && (
            <section className="itens-section">
              <div className="itens-header">
                <button
                  type="button"
                  id="btn-back-categorias"
                  onClick={() =>
                    setActiveCategory(null)
                  }
                >
                  ← Voltar
                </button>

                <h2 id="categoria-titulo">
                  <span aria-hidden="true">
                    {selectedCategory.icone ??
                      selectedCategory.icon ??
                      "🍽️"}
                  </span>{" "}
                  {selectedCategory.nome ??
                    selectedCategory.name}
                </h2>
              </div>

              {categoryItems.length === 0 ? (
                <div className="empty-state">
                  <span
                    className="empty-state__icon"
                    aria-hidden="true"
                  >
                    📋
                  </span>

                  <p>
                    Nenhum produto disponível nesta
                    categoria.
                  </p>
                </div>
              ) : (
                <div className="itens-grid">
                  {categoryItems.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddItem={onAddItem}
                      />
                    ),
                  )}
                </div>
              )}
            </section>
          )}

        {activeOrder && (
          <OrderStatus order={activeOrder} />
        )}
      </main>

      <button
        className={
          `cart-fab ${
            cartCount > 0
              ? "cart-fab--visible"
              : ""
          }`
        }
        type="button"
        onClick={onOpenCart}
        aria-label="Abrir carrinho"
      >
        🛒

        {cartCount > 0 && (
          <span className="cart-badge">
            {cartCount}
          </span>
        )}
      </button>
    </>
  );
}

function ProductCard({
  product,
  onAddItem,
}) {
  const productName =
    product.nome ?? product.name ?? "";

  const productDescription =
    product.descricao ??
    product.description ??
    "";

  const productPrice = Number(
    product.preco ?? product.price ?? 0,
  );

  const imageUrl =
    product.fotoUrl ??
    product.imageUrl ??
    "";

  return (
    <article className="item-card">
      {imageUrl ? (
        <img
          className="item-card__image"
          src={imageUrl}
          alt={productName}
          loading="lazy"
        />
      ) : (
        <div
          className="item-card__emoji"
          aria-hidden="true"
        >
          {product.emoji || "🍽️"}
        </div>
      )}

      <div className="item-card__info">
        <h4 className="item-card__nome">
          {productName}
        </h4>

        <p className="item-card__desc">
          {productDescription}
        </p>

        <span className="item-card__preco">
          {formatCurrency(productPrice)}
        </span>
      </div>

      <button
        className="btn-add"
        type="button"
        onClick={() =>
          onAddItem({
            ...product,
            nome: productName,
            descricao: productDescription,
            preco: productPrice,
          })
        }
        aria-label={
          `Adicionar ${productName}`
        }
      >
        <span>+</span>
      </button>
    </article>
  );
}

function OrderStatus({ order }) {
  const status = getStatus(order.status);

  const orderItems = Array.isArray(
    order.itens,
  )
    ? order.itens
    : [];

  return (
    <section className="pedido-status-section">
      <h3>📦 Seu pedido</h3>

      <div className="pedido-card">
        <div className="pedido-card__header">
          <span
            className={
              `pedido-badge ${status.color}`
            }
          >
            {status.icon} {status.label}
          </span>

          <span className="pedido-hora">
            Feito às{" "}
            {formatTime(order.criadoEm)}
          </span>
        </div>

        <details className="pedido-detalhes">
          <summary>
            Ver itens do pedido
          </summary>

          <ul className="pedido-itens">
            {orderItems.map(
              (item, index) => (
                <li
                  key={
                    `${item.id}-${index}`
                  }
                >
                  {item.emoji || "🍽️"}{" "}
                  {item.nome} x{" "}
                  {item.quantidade} -{" "}
                  {formatCurrency(
                    Number(item.subtotal) ||
                      0,
                  )}
                </li>
              ),
            )}
          </ul>

          <strong className="pedido-total">
            Total:{" "}
            {formatCurrency(
              Number(order.total) || 0,
            )}
          </strong>
        </details>
      </div>
    </section>
  );
}