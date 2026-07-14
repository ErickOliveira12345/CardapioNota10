import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { CartSidebar } from "./components/CartSidebar.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { MenuPage } from "./pages/MenuPage.jsx";
import {LoginPage} from "./pages/LoginPage.jsx";

import {RegisterPage} from "./pages/RegisterPage.jsx";

import {
  Storage,
  STORAGE_KEYS,
} from "./services/storage.js";

import {
  createOrder,
  markCallAsSeen,
  observeCalls,
  observeOrders,
  requestService,
  updateOrderStatus,
} from "./services/orders.js";

import {
  getStatus,
} from "./services/formatters.js";

import {
  showToast,
} from "./services/toast.js";

const ACTIVE_ORDER_STATUSES = [
  "aguardando",
  "recebido",
  "preparando",
  "saindo",
];

function getRoute() {
  const pathname = window.location.pathname;

  return pathname === "/"
    ? "/"
    : pathname.replace(/\/$/, "");
}

function getTableFromUrl() {
  const searchParams = new URLSearchParams(
    window.location.search,
  );

  const table = Number(
    searchParams.get("mesa"),
  );

  return Number.isInteger(table) && table > 0
    ? table
    : null;
}

function getSavedTable() {
  const savedTable = Number(
    Storage.get(STORAGE_KEYS.MESA, 1),
  );

  return Number.isInteger(savedTable) &&
    savedTable > 0
    ? savedTable
    : 1;
}

function getSavedCart() {
  const savedCart = Storage.get(
    STORAGE_KEYS.CARRINHO,
    [],
  );

  return Array.isArray(savedCart)
    ? savedCart
    : [];
}

function getTime(value) {
  if (!value) return 0;

  if (
    typeof value?.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : 0;
}

export function App() {
  const [route, setRoute] = useState(getRoute);

  const [table, setTable] = useState(
    () => getTableFromUrl() || getSavedTable(),
  );

  const [cartItems, setCartItems] =
    useState(getSavedCart);

  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const [orders, setOrders] = useState([]);
  const [calls, setCalls] = useState([]);

  const [firebaseLoading, setFirebaseLoading] =
    useState(true);

  const [isSubmittingOrder, setIsSubmittingOrder] =
  useState(false);
  /*
   * Navegação do navegador:
   * voltar e avançar.
   */
  useEffect(() => {
    function handlePopState() {
      setRoute(getRoute());
    }

    window.addEventListener(
      "popstate",
      handlePopState,
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState,
      );
    };
  }, []);

  /*
   * Listener de pedidos do Firestore.
   */
  useEffect(() => {
    const stopObservingOrders = observeOrders(
      (firebaseOrders) => {
        setOrders(firebaseOrders);
        setFirebaseLoading(false);
      },

      (error) => {
        console.error(
          "Erro ao carregar pedidos:",
          error,
        );

        setFirebaseLoading(false);

        showToast(
          "Não foi possível carregar os pedidos.",
          "error",
          4000,
        );
      },
    );

    return () => {
      stopObservingOrders();
    };
  }, []);

  /*
   * Listener de chamados do Firestore.
   */
  useEffect(() => {
    const stopObservingCalls = observeCalls(
      (firebaseCalls) => {
        setCalls(firebaseCalls);
      },

      (error) => {
        console.error(
          "Erro ao carregar chamados:",
          error,
        );

        showToast(
          "Não foi possível carregar os chamados.",
          "error",
          4000,
        );
      },
    );

    return () => {
      stopObservingCalls();
    };
  }, []);

  /*
   * Atualiza mesa pela URL e configura
   * título e classe da página.
   */
  useEffect(() => {
    const tableFromUrl = getTableFromUrl();

    if (
      route === "/menu" &&
      tableFromUrl &&
      tableFromUrl !== table
    ) {
      setTable(tableFromUrl);
    }

    document.body.className =
      route === "/admin"
        ? "page-admin"
        : route === "/menu"
          ? "page-menu"
          : "page-qr";

    document.title =
      route === "/admin"
        ? "Painel Admin - CardápioNota10"
        : route === "/menu"
          ? `Mesa ${table} - CardápioNota10`
          : "CardápioNota10 - Escaneie sua mesa";
  }, [route, table]);

  /*
   * Salva a mesa localmente.
   */
  useEffect(() => {
    if (route !== "/menu") return;

    Storage.save(
      STORAGE_KEYS.MESA,
      Number(table),
    );
  }, [route, table]);

  /*
   * Salva o carrinho localmente.
   */
  useEffect(() => {
    Storage.save(
      STORAGE_KEYS.CARRINHO,
      cartItems,
    );
  }, [cartItems]);

  /*
   * Pedido ativo da mesa atual.
   *
   * Agora é obtido diretamente da lista
   * atualizada em tempo real pelo Firestore.
   */
  const activeOrder = useMemo(() => {
    return (
      [...orders]
        .sort(
          (firstOrder, secondOrder) =>
            getTime(secondOrder.criadoEm) -
            getTime(firstOrder.criadoEm),
        )
        .find(
          (order) =>
            Number(order.mesa) ===
              Number(table) &&
            ACTIVE_ORDER_STATUSES.includes(
              order.status,
            ) &&
            Array.isArray(order.itens),
        ) || null
    );
  }, [orders, table]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total +
        (Number(item.subtotal) || 0),
      0,
    );
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total +
        (Number(item.quantidade) || 0),
      0,
    );
  }, [cartItems]);

  function navigate(path) {
    window.history.pushState(
      {},
      "",
      path,
    );

    setRoute(getRoute());

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function addItem(product) {
    setCartItems((currentItems) => {
      const existingItem =
        currentItems.find(
          (item) =>
            String(item.id) ===
            String(product.id),
        );

      if (existingItem) {
        return currentItems.map((item) => {
          if (
            String(item.id) !==
            String(product.id)
          ) {
            return item;
          }

          const nextQuantity =
            Number(item.quantidade) + 1;

          return {
            ...item,
            quantidade: nextQuantity,
            subtotal:
              nextQuantity *
              Number(item.preco),
          };
        });
      }

      return [
        ...currentItems,
        {
          ...product,
          quantidade: 1,
          subtotal: Number(product.preco),
        },
      ];
    });

    showToast(
      `${product.nome} adicionado!`,
      "success",
    );

    setIsCartOpen(true);
  }

  function updateQuantity(itemId, delta) {
    setCartItems((currentItems) => {
      return currentItems
        .map((item) => {
          if (
            String(item.id) !==
            String(itemId)
          ) {
            return item;
          }

          const quantity = Math.max(
            0,
            Number(item.quantidade) +
              Number(delta),
          );

          return {
            ...item,
            quantidade: quantity,
            subtotal:
              quantity *
              Number(item.preco),
          };
        })
        .filter(
          (item) =>
            Number(item.quantidade) > 0,
        );
    });
  }

  async function finishOrder() {
    if (cartItems.length === 0 || isSubmittingOrder) {
      return;
    }

    try {
      setIsSubmittingOrder(true);

      await createOrder({
        table,
        items: cartItems,
        total: cartTotal,
      });

      setCartItems([]);
      Storage.remove(STORAGE_KEYS.CARRINHO);
      setIsCartOpen(false);

      /*
       * Atualização otimista.
       * O listener do Firestore confirmará
       * os dados logo em seguida.
       */

      showToast(
        "Pedido enviado com sucesso! Aguarde...",
        "success",
        4000,
      );
    } catch (error) {
      console.error(
        "Erro ao finalizar pedido:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível enviar o pedido.",
        "error",
        5000,
      );
    }finally {
      setIsSubmittingOrder(false);
    }
  }

  async function handleRequestService() {
    try {
      const created =
        await requestService(table);

      showToast(
        created
          ? "Chamado enviado! Um atendente virá até você."
          : "Chamado já enviado! Aguarde o atendimento.",
        created ? "success" : "warning",
        4000,
      );
    } catch (error) {
      console.error(
        "Erro ao solicitar atendimento:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível chamar o atendimento.",
        "error",
        4000,
      );
    }
  }

  function selectTable(nextTable) {
    const normalizedTable =
      Number(nextTable);

    if (
      !Number.isInteger(normalizedTable) ||
      normalizedTable <= 0
    ) {
      showToast(
        "Mesa inválida.",
        "error",
      );

      return;
    }

    Storage.save(
      STORAGE_KEYS.MESA,
      normalizedTable,
    );

    Storage.remove(
      STORAGE_KEYS.CARRINHO,
    );

    setTable(normalizedTable);
    setCartItems([]);
    setIsCartOpen(false);

    navigate(
      `/menu?mesa=${normalizedTable}`,
    );
  }

  function continueSession() {
    navigate(
      `/menu?mesa=${table}`,
    );
  }

  function startNewSession() {
    Storage.remove(
      STORAGE_KEYS.MESA,
    );

    Storage.remove(
      STORAGE_KEYS.CARRINHO,
    );

    setTable(1);
    setCartItems([]);
    setIsCartOpen(false);

    showToast(
      "Sessão local limpa. Escolha uma mesa para continuar.",
      "info",
    );
  }

  /*
   * Por segurança, esta função não apaga
   * os pedidos do Firestore.
   *
   * Posteriormente criaremos uma Cloud Function
   * exclusiva para o administrador excluir
   * dados de teste.
   */
  function resetData() {
    Storage.remove(
      STORAGE_KEYS.MESA,
    );

    Storage.remove(
      STORAGE_KEYS.CARRINHO,
    );

    setCartItems([]);
    setIsCartOpen(false);

    showToast(
      "Carrinho e sessão local foram limpos. Os pedidos do Firebase foram preservados.",
      "info",
      5000,
    );
  }

  async function handleUpdateOrderStatus(
    orderId,
    status,
  ) {
    try {
      await updateOrderStatus(
        orderId,
        status,
      );

      showToast(
        `Status atualizado para: ${
          getStatus(status).label
        }`,
        "info",
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar status:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível atualizar o status.",
        "error",
        4000,
      );
    }
  }

  async function handleMarkCallAsSeen(
    callTable,
    timestamp,
  ) {
    try {
      await markCallAsSeen(
        callTable,
        timestamp,
      );

      showToast(
        `Mesa ${callTable} marcada como atendida.`,
        "success",
      );
    } catch (error) {
      console.error(
        "Erro ao marcar chamado:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível concluir o atendimento.",
        "error",
        4000,
      );
    }
  }

  if (route === "/cadastro") {
    return (
      <>
        <RegisterPage
          onNavigate={navigate}
        />

        <div
          id="toast-container"
          aria-live="polite"
        />
      </>
    );
  }

  if (route === "/login") {
    return (
      <>
        <LoginPage
          onNavigate={navigate}
        />

        <div
          id="toast-container"
          aria-live="polite"
        />
      </>
    );
  }

  if (route === "/admin") {
    return (
      <>
        <AdminPage
          orders={orders}
          calls={calls}
          onNavigate={navigate}
          onResetData={resetData}
          onUpdateOrderStatus={
            handleUpdateOrderStatus
          }
          onMarkCallAsSeen={
            handleMarkCallAsSeen
          }
        />

        <div
          id="toast-container"
          aria-live="polite"
        />
      </>
    );
  }

  if (route !== "/menu") {
    return (
      <>
        <HomePage
          currentTable={
            Storage.get(
              STORAGE_KEYS.MESA,
            ) || null
          }
          onSelectTable={selectTable}
          onContinueSession={
            continueSession
          }
          onNewSession={
            startNewSession
          }
          onNavigate={navigate}
        />

        <div
          id="toast-container"
          aria-live="polite"
        />
      </>
    );
  }

  return (
    <>
      <MenuPage
        table={table}
        onNavigate={navigate}
        onAddItem={addItem}
        onOpenCart={() =>
          setIsCartOpen(true)
        }
        onRequestService={
          handleRequestService
        }
        cartCount={cartCount}
        activeOrder={activeOrder}
        firebaseLoading={
          firebaseLoading
        }
      />

      <CartSidebar
        items={cartItems}
        total={cartTotal}
        isOpen={isCartOpen}
        onClose={() =>
          setIsCartOpen(false)
        }
        onUpdateQuantity={
          updateQuantity
        }
        onFinishOrder={finishOrder}
      />

      <div
        id="toast-container"
        aria-live="polite"
      />
    </>
  );
}