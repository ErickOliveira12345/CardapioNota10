import React from "react";
import { formatCurrency } from "../services/formatters.js";

export function CartSidebar({
  items,
  total,
  isOpen,
  onClose,
  onUpdateQuantity,
  onFinishOrder,
}) {
  const isEmpty = items.length === 0;

  return (
    <>
      <div
        className={`cart-overlay ${isOpen ? "active" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`cart-sidebar ${isOpen ? "open" : ""}`} aria-label="Carrinho de compras">
        <div className="cart-header">
          <h3>🛒 Carrinho</h3>
          <button className="btn-close-cart" type="button" onClick={onClose} aria-label="Fechar carrinho">
            ×
          </button>
        </div>

        <div className="cart-body">
          {isEmpty ? (
            <div className="cart-empty">
              <span className="cart-empty__icon" aria-hidden="true">
                🛒
              </span>
              <p>Seu carrinho está vazio</p>
              <p style={{ fontSize: ".82rem" }}>Adicione itens do cardápio</p>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item__emoji" aria-hidden="true">
                    {item.emoji}
                  </div>
                  <div className="cart-item__info">
                    <span className="cart-item__nome">{item.nome}</span>
                    <span className="cart-item__preco">{formatCurrency(item.subtotal)}</span>
                  </div>
                  <div className="cart-item__qty">
                    <button className="qty-btn" type="button" onClick={() => onUpdateQuantity(item.id, -1)}>
                      −
                    </button>
                    <span className="qty-value">{item.quantidade}</span>
                    <button className="qty-btn" type="button" onClick={() => onUpdateQuantity(item.id, 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isEmpty && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total do pedido:</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            <button className="btn-finalizar" type="button" onClick={onFinishOrder}>
              Finalizar pedido
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
