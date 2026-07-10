import React, { useState } from "react";
import { menuCategories, menuItems } from "../services/menuData.js";
import { formatCurrency, formatTime, getStatus } from "../services/formatters.js";

export function MenuPage({
  table,
  onTableChange,
  onNavigate,
  onAddItem,
  onOpenCart,
  onRequestService,
  cartCount,
  activeOrder,
}) {
  const [activeCategory, setActiveCategory] = useState(null);
  const category = menuCategories.find((item) => item.id === activeCategory);
  const items = menuItems.filter((item) => item.categoria === activeCategory);

  return (
    <>
      <header className="menu-header">
        <div className="menu-header__left">
          <button className="btn-back-home" type="button" onClick={() => onNavigate("/")}>
            ← Mesas
          </button>
        </div>

        <div className="menu-header__center">
          <span className="mesa-badge">Mesa {table}</span>
        </div>

        <div className="menu-header__right">
          <button className="btn-servico" type="button" onClick={onRequestService}>
            Atendimento
          </button>
        </div>
      </header>

      <nav className="categorias-nav" aria-label="Categorias do cardapio">
        {menuCategories.map((item) => (
          <button
            className={`categoria-tab ${activeCategory === item.id ? "active" : ""}`}
            key={item.id}
            type="button"
            onClick={() => setActiveCategory(item.id)}
          >
            <span aria-hidden="true">{item.icone}</span>
            {item.nome}
          </button>
        ))}
      </nav>

      <main>
        {!activeCategory && (
          <section className="welcome-section">
            <div className="welcome-hero">
              <div className="welcome-hero__emoji" aria-hidden="true">
                🍽️
              </div>
              <h2>Bem-vindo!</h2>
              <p>Selecione uma categoria para ver o cardapio</p>
            </div>

            <h3>O que voce quer hoje?</h3>
            <div className="categorias-grid">
              {menuCategories.map((item) => (
                <button
                  className="categoria-card"
                  key={item.id}
                  type="button"
                  onClick={() => setActiveCategory(item.id)}
                  aria-label={`Ver ${item.nome}`}
                >
                  <span className="categoria-card__icon" aria-hidden="true">
                    {item.icone}
                  </span>
                  <h3 className="categoria-card__nome">{item.nome}</h3>
                  <p className="categoria-card__desc">{item.descricao}</p>
                  <span className="categoria-card__arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeCategory && category && (
          <section className="itens-section">
            <div className="itens-header">
              <button type="button" id="btn-back-categorias" onClick={() => setActiveCategory(null)}>
                ← Voltar
              </button>
              <h2 id="categoria-titulo">
                <span aria-hidden="true">{category.icone}</span> {category.nome}
              </h2>
            </div>

            <div className="itens-grid">
              {items.map((item) => (
                <article className="item-card" key={item.id}>
                  <div className="item-card__emoji" aria-hidden="true">
                    {item.emoji}
                  </div>
                  <div className="item-card__info">
                    <h4 className="item-card__nome">{item.nome}</h4>
                    <p className="item-card__desc">{item.descricao}</p>
                    <span className="item-card__preco">{formatCurrency(item.preco)}</span>
                  </div>
                  <button
                    className="btn-add"
                    type="button"
                    onClick={() => onAddItem(item)}
                    aria-label={`Adicionar ${item.nome}`}
                  >
                    <span>+</span>
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeOrder && <OrderStatus order={activeOrder} />}
      </main>

      <button
        className={`cart-fab ${cartCount > 0 ? "cart-fab--visible" : ""}`}
        type="button"
        onClick={onOpenCart}
        aria-label="Abrir carrinho"
      >
        🛒
        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </button>
    </>
  );
}

function OrderStatus({ order }) {
  const status = getStatus(order.status);
  const orderItems = Array.isArray(order.itens) ? order.itens : [];

  return (
    <section className="pedido-status-section">
      <h3>📦 Seu pedido</h3>
      <div className="pedido-card">
        <div className="pedido-card__header">
          <span className={`pedido-badge ${status.color}`}>
            {status.icon} {status.label}
          </span>
          <span className="pedido-hora">Feito as {formatTime(order.criadoEm)}</span>
        </div>

        <details className="pedido-detalhes">
          <summary>Ver itens do pedido</summary>
          <ul className="pedido-itens">
            {orderItems.map((item) => (
              <li key={item.id}>
                {item.emoji} {item.nome} x {item.quantidade} - {formatCurrency(item.subtotal)}
              </li>
            ))}
          </ul>
          <strong className="pedido-total">Total: {formatCurrency(Number(order.total) || 0)}</strong>
        </details>
      </div>
    </section>
  );
}
