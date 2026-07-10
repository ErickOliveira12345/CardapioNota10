import React, { useEffect, useMemo, useState } from "react";
import { CartSidebar } from "./components/CartSidebar.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { MenuPage } from "./pages/MenuPage.jsx";
import { Storage, STORAGE_KEYS } from "./services/storage.js";
import {
  createOrder,
  getActiveOrderByTable,
  getCalls,
  getOrders,
  markCallAsSeen,
  requestService,
  updateOrderStatus,
} from "./services/orders.js";
import { getStatus } from "./services/formatters.js";
import { showToast } from "./services/toast.js";

function getRoute() {
  return window.location.pathname === "/" ? "/" : window.location.pathname.replace(/\/$/, "");
}

function getTableFromUrl() {
  const table = new URLSearchParams(window.location.search).get("mesa");
  return Number(table) || null;
}

export function App() {
  const [route, setRoute] = useState(getRoute);
  const [table, setTable] = useState(
    () => getTableFromUrl() || Number(Storage.get(STORAGE_KEYS.MESA, 1)) || 1,
  );
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = Storage.get(STORAGE_KEYS.CARRINHO, []);
    return Array.isArray(savedCart) ? savedCart : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(() => getActiveOrderByTable(table));
  const [orders, setOrders] = useState(getOrders);
  const [calls, setCalls] = useState(getCalls);

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const tableFromUrl = getTableFromUrl();
    if (route === "/menu" && tableFromUrl && tableFromUrl !== table) {
      setTable(tableFromUrl);
      return;
    }

    document.body.className =
      route === "/admin" ? "page-admin" : route === "/menu" ? "page-menu" : "page-qr";
    document.title =
      route === "/admin"
        ? "Painel Admin - CardapioNota10"
        : route === "/menu"
          ? `Mesa ${table} - CardapioNota10`
          : "CardapioNota10 - Escaneie sua mesa";
  }, [route, table]);

  useEffect(() => {
    if (route !== "/menu") return;
    Storage.save(STORAGE_KEYS.MESA, Number(table));
    setActiveOrder(getActiveOrderByTable(table));
  }, [route, table]);

  useEffect(() => {
    Storage.save(STORAGE_KEYS.CARRINHO, cartItems);
  }, [cartItems]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refreshData();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [table]);

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + (Number(item.subtotal) || 0), 0),
    [cartItems],
  );

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + (Number(item.quantidade) || 0), 0),
    [cartItems],
  );

  function refreshData() {
    setActiveOrder(getActiveOrderByTable(table));
    setOrders(getOrders());
    setCalls(getCalls());
  }

  function navigate(path) {
    window.history.pushState({}, "", path);
    setRoute(getRoute());
    window.scrollTo({ top: 0 });
  }

  function addItem(product) {
    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantidade: item.quantidade + 1,
                subtotal: (item.quantidade + 1) * item.preco,
              }
            : item,
        );
      }

      return [...current, { ...product, quantidade: 1, subtotal: product.preco }];
    });

    showToast(`${product.nome} adicionado!`, "success");
    setIsCartOpen(true);
  }

  function updateQuantity(itemId, delta) {
    setCartItems((current) =>
      current
        .map((item) => {
          if (item.id !== itemId) return item;

          const quantidade = Math.max(0, item.quantidade + delta);
          return {
            ...item,
            quantidade,
            subtotal: quantidade * item.preco,
          };
        })
        .filter((item) => item.quantidade > 0),
    );
  }

  function finishOrder() {
    const order = createOrder({
      table,
      items: cartItems,
      total: cartTotal,
    });

    if (!order) return;

    setCartItems([]);
    setIsCartOpen(false);
    setActiveOrder(order);
    setOrders(getOrders());
    showToast("Pedido enviado com sucesso! Aguarde...", "success", 4000);
  }

  function handleRequestService() {
    const created = requestService(table);
    setCalls(getCalls());
    showToast(
      created
        ? "Chamado enviado! Um atendente vira ate voce."
        : "Chamado ja enviado! Aguarde o atendimento.",
      created ? "success" : "warning",
      4000,
    );
  }

  function selectTable(nextTable) {
    Storage.save(STORAGE_KEYS.MESA, Number(nextTable));
    Storage.remove(STORAGE_KEYS.CARRINHO);
    setTable(Number(nextTable));
    setCartItems([]);
    navigate(`/menu?mesa=${nextTable}`);
  }

  function continueSession() {
    navigate(`/menu?mesa=${table}`);
  }

  function startNewSession() {
    Storage.clear();
    setTable(1);
    setCartItems([]);
    setActiveOrder(null);
    setOrders([]);
    setCalls([]);
    showToast("Sessao limpa. Escolha uma mesa para continuar.", "info");
  }

  function resetData() {
    Storage.clear();
    setCartItems([]);
    setActiveOrder(null);
    setOrders([]);
    setCalls([]);
    showToast("Dados resetados com sucesso.", "success");
  }

  function handleUpdateOrderStatus(orderId, status) {
    updateOrderStatus(orderId, status);
    refreshData();
    showToast(`Status atualizado para: ${getStatus(status).label}`, "info");
  }

  function handleMarkCallAsSeen(callTable, timestamp) {
    markCallAsSeen(callTable, timestamp);
    refreshData();
    showToast(`Mesa ${callTable} marcada como atendida.`, "success");
  }

  if (route === "/admin") {
    return (
      <>
        <AdminPage
          orders={orders}
          calls={calls}
          onNavigate={navigate}
          onResetData={resetData}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onMarkCallAsSeen={handleMarkCallAsSeen}
        />
        <div id="toast-container" aria-live="polite" />
      </>
    );
  }

  if (route !== "/menu") {
    return (
      <>
        <HomePage
          currentTable={Storage.get(STORAGE_KEYS.MESA)}
          onSelectTable={selectTable}
          onContinueSession={continueSession}
          onNewSession={startNewSession}
          onNavigate={navigate}
        />
        <div id="toast-container" aria-live="polite" />
      </>
    );
  }

  return (
    <>
      <MenuPage
        table={table}
        onTableChange={setTable}
        onNavigate={navigate}
        onAddItem={addItem}
        onOpenCart={() => setIsCartOpen(true)}
        onRequestService={handleRequestService}
        cartCount={cartCount}
        activeOrder={activeOrder}
      />

      <CartSidebar
        items={cartItems}
        total={cartTotal}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onFinishOrder={finishOrder}
      />

      <div id="toast-container" aria-live="polite" />
    </>
  );
}
