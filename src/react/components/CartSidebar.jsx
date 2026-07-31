import React from "react";

import { useCart } from "../contexts/CartContext.jsx";
import { formatCurrency } from "../services/formatters.js";

export function CartSidebar({
  isSubmitting = false,
  onFinishOrder,
}) {
  const {
    items,
    total,
    isCartOpen,
    closeCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const safeItems = Array.isArray(items) ? items : [];
  const isEmpty = safeItems.length === 0;

  function handleFinishOrder() {
    if (isEmpty || isSubmitting) {
      return;
    }

    if (typeof onFinishOrder === "function") {
      onFinishOrder();
    }
  }

  return (
    <>
      <div
        className={`cart-overlay ${
          isCartOpen ? "active" : ""
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        className={`cart-sidebar ${
          isCartOpen ? "open" : ""
        }`}
        aria-label="Carrinho de compras"
        aria-hidden={!isCartOpen}
      >
        <div className="cart-header">
          <h3>🛒 Carrinho</h3>

          <button
            className="btn-close-cart"
            type="button"
            onClick={closeCart}
            aria-label="Fechar carrinho"
          >
            ×
          </button>
        </div>

        <div className="cart-body">
          {isEmpty ? (
            <div className="cart-empty">
              <span
                className="cart-empty__icon"
                aria-hidden="true"
              >
                🛒
              </span>

              <p>Seu carrinho está vazio</p>

              <p style={{ fontSize: ".82rem" }}>
                Adicione itens do cardápio
              </p>
            </div>
          ) : (
            <div>
              {safeItems.map((item) => {
                const itemId = String(item.id);

                const itemName =
                  item.nome ||
                  item.name ||
                  "Produto";

                const itemQuantity = Number(
                  item.quantity ??
                    item.quantidade ??
                    1,
                );

                const itemPrice = Number(
                  item.preco ??
                    item.price ??
                    item.precoUnitario ??
                    0,
                );

                const itemSubtotal =
                  Number(item.subtotal) ||
                  itemPrice * itemQuantity;

                return (
                  <div
                    className="cart-item"
                    key={itemId}
                  >
                    {item.fotoUrl ||
                    item.imageUrl ||
                    item.image ? (
                      <img
                        className="cart-item__image"
                        src={
                          item.fotoUrl ||
                          item.imageUrl ||
                          item.image
                        }
                        alt={itemName}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="cart-item__emoji"
                        aria-hidden="true"
                      >
                        {item.emoji || "🍽️"}
                      </div>
                    )}

                    <div className="cart-item__info">
                      <span className="cart-item__nome">
                        {itemName}
                      </span>

                      <span className="cart-item__preco">
                        {formatCurrency(
                          itemSubtotal,
                        )}
                      </span>
                    </div>

                    <div className="cart-item__qty">
                      <button
                        className="qty-btn"
                        type="button"
                        onClick={() =>
                          decreaseQuantity(item.id)
                        }
                        aria-label={`Diminuir quantidade de ${itemName}`}
                      >
                        −
                      </button>

                      <span className="qty-value">
                        {itemQuantity}
                      </span>

                      <button
                        className="qty-btn"
                        type="button"
                        onClick={() =>
                          increaseQuantity(item.id)
                        }
                        aria-label={`Aumentar quantidade de ${itemName}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!isEmpty && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total do pedido:</span>

              <strong>
                {formatCurrency(
                  Number(total) || 0,
                )}
              </strong>
            </div>

            <button
              className="btn-finalizar"
              type="button"
              onClick={handleFinishOrder}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Enviando pedido..."
                : "Finalizar pedido"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}