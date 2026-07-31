import React,{
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "ps_carrinho";

function loadStoredCart() {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!storedCart) {
      return [];
    }

    const parsedCart = JSON.parse(storedCart);

    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.error("Erro ao carregar o carrinho:", error);
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadStoredCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch (error) {
      console.error("Erro ao salvar o carrinho:", error);
    }
  }, [items]);

  const addItem = useCallback((product, quantity = 1) => {
    if (!product?.id) {
      console.error(
        "Não foi possível adicionar o produto: ID inválido.",
      );
      return;
    }

    const validQuantity = Math.max(
      1,
      Number(quantity) || 1,
    );

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === product.id,
      );

      if (existingItem) {
        return currentItems.map((item) => {
          if (item.id !== product.id) {
            return item;
          }

          return {
            ...item,
            quantity:
              Number(item.quantity || 0) +
              validQuantity,
          };
        });
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: validQuantity,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== productId,
      ),
    );
  }, []);

  const updateQuantity = useCallback(
    (productId, quantity) => {
      const newQuantity = Number(quantity);

      if (!Number.isFinite(newQuantity)) {
        return;
      }

      if (newQuantity <= 0) {
        setItems((currentItems) =>
          currentItems.filter(
            (item) => item.id !== productId,
          ),
        );

        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) => {
          if (item.id !== productId) {
            return item;
          }

          return {
            ...item,
            quantity: newQuantity,
          };
        }),
      );
    },
    [],
  );

  const increaseQuantity = useCallback((productId) => {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        return {
          ...item,
          quantity: Number(item.quantity || 0) + 1,
        };
      }),
    );
  }, []);

  const decreaseQuantity = useCallback((productId) => {
    setItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.id !== productId) {
            return item;
          }

          return {
            ...item,
            quantity: Number(item.quantity || 0) - 1,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((currentValue) => !currentValue);
  }, []);

  const totalItems = useMemo(() => {
    return items.reduce((total, item) => {
      return total + Number(item.quantity || 0);
    }, 0);
  }, [items]);

  const total = useMemo(() => {
    return items.reduce((cartTotal, item) => {
      const price = Number(
        item.preco ??
          item.price ??
          item.precoEmCentavos ??
          0,
      );

      const quantity = Number(item.quantity || 0);

      return cartTotal + price * quantity;
    }, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      cartItems: items,

      total,
      cartTotal: total,
      totalItems,

      isCartOpen,

      addItem,
      addToCart: addItem,

      removeItem,
      removeFromCart: removeItem,

      updateQuantity,
      increaseQuantity,
      decreaseQuantity,

      clearCart,

      openCart,
      closeCart,
      toggleCart,
    }),
    [
      items,
      total,
      totalItems,
      isCartOpen,
      addItem,
      removeItem,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart deve ser utilizado dentro de um CartProvider.",
    );
  }

  return context;
}