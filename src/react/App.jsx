import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { CartSidebar } from "./components/CartSidebar.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import {AdminLayout} from "./components/AdminLayout.jsx";
import { FirstAccessPage } from "./pages/FirstAccessPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { MenuPage } from "./pages/MenuPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import {ProductsPage} from "./pages/ProductsPage.jsx";
import { getStatus } from "./services/formatters.js";
import {CategoriesPage} from "./pages/CategoriesPage.jsx";
import {TablesPage} from "./pages/TablesPage.jsx";
import {observeMenuCategories,observeMenuProducts} from "./services/menuService.js";
import {autenticarClienteAnonimo} from "./services/authService.js";
import {KitchenPage} from "./pages/KitchenPage.jsx";
import {DashboardPage} from "./pages/DashboardPage.jsx";
import {TablesMapPage} from "./pages/TablesMapPage.jsx";
import {AdminOrdersPage} from "./pages/AdminOrdersPage.jsx";


import {
  createOrder,
  markCallAsSeen,
  observeCalls,
  observeCustomerOrders,
  observeOrders,
  requestService,
  updateOrderStatus,
} from "./services/orders.js";

import {
  Storage,
  STORAGE_KEYS,
} from "./services/storage.js";

import { showToast } from "./services/toast.js";

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

function getEstablishmentFromUrl() {
  const params =
    new URLSearchParams(
      window.location.search,
    );

  return (
    params.get("est")?.trim() || null
  );
}

function getTableTokenFromUrl() {
  const params =
    new URLSearchParams(
      window.location.search,
    );

  return (
    params.get("token")?.trim() || null
  );
}

function getTableFromUrl() {
  const searchParams = new URLSearchParams(
    window.location.search,
  );

  const table = Number(searchParams.get("mesa"));

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

  if (typeof value?.toMillis === "function") {
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

function Redirect({ to }) {
  useEffect(() => {
    if (getRoute() === to) return;

    window.history.replaceState({}, "", to);
    window.dispatchEvent(
      new PopStateEvent("popstate"),
    );
  }, [to]);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p>Redirecionando...</p>
      </section>
    </main>
  );
}

function ToastContainer() {
  return (
    <div
      id="toast-container"
      aria-live="polite"
    />
  );
}

export function App() {
  const {
    loading: authLoading,
    establishmentId,
    isAuthenticated,
    isOnboarding,
    refreshProfile,
  } = useAuth();

  const [route, setRoute] = useState(getRoute);

  const [customerUid,setCustomerUid,] =
    useState(null);

  const [customerOrders,setCustomerOrders,] =
    useState([]);

  const [publicEstablishmentId, setPublicEstablishmentId,] = 
    useState(getEstablishmentFromUrl);

  const [tableToken, setTableToken,] =
    useState(getTableTokenFromUrl);

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
    useState(false);

  const [
    isSubmittingOrder,
    setIsSubmittingOrder,
  ] = useState(false);

  const [menuCategories, setMenuCategories] =
    useState([]);

  const [menuProducts, setMenuProducts] =
    useState([]);

  const [menuLoading, setMenuLoading] =
    useState(false);

  useEffect(() => {
    function handlePopState() {
      setRoute(getRoute());
    }

    setPublicEstablishmentId(
      getEstablishmentFromUrl(),
    );

    setTableToken(
      getTableTokenFromUrl(),
    );
  

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

 useEffect(() => {
  if (
    route !== "/menu" ||
    !publicEstablishmentId
  ) {
    setCustomerUid(null);
    setCustomerOrders([]);
    return undefined;
  }

  let mounted = true;

  async function iniciarSessaoDaMesa() {
    try {
      const customer =
        await autenticarClienteAnonimo();

      if (mounted) {
        console.log(
          "Cliente anônimo autenticado:",
          customer.uid,
        );

        setCustomerUid(customer.uid);
      }
    } catch (error) {
      console.error(
        "Erro ao iniciar sessão da mesa:",
        error,
      );

      showToast(
        "Não foi possível acompanhar o pedido.",
        "error",
      );
    }
  }

  iniciarSessaoDaMesa();

  return () => {
    mounted = false;
  };
}, [
  route,
  publicEstablishmentId,
]);

useEffect(() => {
  if (
    route !== "/menu" ||
    !publicEstablishmentId ||
    !customerUid ||
    !table
  ) {
    setCustomerOrders([]);
    return undefined;
  }

  console.log(
    "Iniciando listener da mesa:",
    {
      establishmentId:
        publicEstablishmentId,
      customerUid,
      table,
    },
  );

  const unsubscribe =
    observeCustomerOrders({
      establishmentId:
        publicEstablishmentId,

      customerUid,

      table,

      onChange: (firebaseOrders) => {
        console.log(
          "Pedidos da mesa recebidos:",
          firebaseOrders,
        );

        setCustomerOrders(firebaseOrders);
      },

      onError: (error) => {
        console.error(
          "Erro ao acompanhar pedidos da mesa:",
          error,
        );
      },
    });

  return () => {
    if (
      typeof unsubscribe === "function"
    ) {
      unsubscribe();
    }
  };
}, [
  route,
  publicEstablishmentId,
  customerUid,
  table,
]);
  useEffect(() => {
    if (
      route !== "/menu" ||
      !publicEstablishmentId
    ) {
      setCustomerUid(null);
      setCustomerOrders([]);

      return undefined;
    }

    let mounted = true;

    async function authenticateCustomer() {
      try {
        const customer =
          await autenticarClienteAnonimo();

        if (mounted) {
          setCustomerUid(customer.uid);
        }
      } catch (error) {
        console.error(
          "Erro ao autenticar cliente:",
          error,
        );

        showToast(
          "Não foi possível iniciar a sessão da mesa.",
          "error",
        );
      }
    }

    authenticateCustomer();

    return () => {
      mounted = false;
    };
  }, [
    route,
    publicEstablishmentId,
  ]);

  useEffect(() => {
    if (
      route !== "/menu" ||
      !publicEstablishmentId ||
      !customerUid ||
      !table
    ) {
      setCustomerOrders([]);
      return undefined;
    }

    const unsubscribe =
      observeCustomerOrders({
        establishmentId:
          publicEstablishmentId,

        customerUid,

        table,

        onChange: setCustomerOrders,

        onError: (error) => {
          console.error(
            "Erro ao carregar pedido da mesa:",
            error,
          );
        },
      });

    return () => {
      if (
        typeof unsubscribe === "function"
      ) {
        unsubscribe();
      }
    };
  }, [
    route,
    publicEstablishmentId,
    customerUid,
    table,
  ]);

  useEffect(() => {
    if (
      route !== "/admin" ||
      !isAuthenticated ||
      !establishmentId
    ) {
      setOrders([]);
      setFirebaseLoading(false);
      return undefined;
    }

    setFirebaseLoading(true);

    const unsubscribe = observeOrders(
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
      establishmentId,
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [
    route,
    isAuthenticated,
    establishmentId,
  ]);

  useEffect(() => {
    if (
      route !== "/admin" ||
      !isAuthenticated ||
      !establishmentId
    ) {
      setCalls([]);
      return undefined;
    }

    const unsubscribe = observeCalls(
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
      establishmentId,
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [
    route,
    isAuthenticated,
    establishmentId,
  ]);

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
          : route === "/login" ||
              route === "/cadastro" ||
              route === "/primeiro-acesso"
            ? "page-auth"
            : "page-qr";

    document.title =
      route === "/admin"
        ? "Painel Admin - CardápioNota10"
        : route === "/menu"
          ? `Mesa ${table} - CardápioNota10`
          : route === "/login"
            ? "Entrar - CardápioNota10"
            : route === "/cadastro"
              ? "Criar conta - CardápioNota10"
              : route === "/primeiro-acesso"
                ? "Primeiro acesso - CardápioNota10"
                : "CardápioNota10 - Escaneie sua mesa";
  }, [route, table]);

  useEffect(() => {
    if (route !== "/menu") return;

    Storage.save(
      STORAGE_KEYS.MESA,
      Number(table),
    );
  }, [route, table]);

  useEffect(() => {
    if (
      route !== "/menu" ||
      !publicEstablishmentId
    ) {
      setMenuCategories([]);
      setMenuProducts([]);
      setMenuLoading(false);

      return undefined;
    }

    setMenuLoading(true);

    let categoriesLoaded = false;
    let productsLoaded = false;

    function finishLoading() {
      if (
        categoriesLoaded &&
        productsLoaded
      ) {
        setMenuLoading(false);
      }
    }

    const stopCategories =
      observeMenuCategories(
        publicEstablishmentId,
        (categories) => {
          setMenuCategories(categories);
          categoriesLoaded = true;
          finishLoading();
        },
        (error) => {
          console.error(
            "Erro nas categorias:",
            error,
          );

          categoriesLoaded = true;
          finishLoading();
        },
      );

    const stopProducts =
      observeMenuProducts(
        publicEstablishmentId,
        (products) => {
          setMenuProducts(products);
          productsLoaded = true;
          finishLoading();
        },
        (error) => {
          console.error(
            "Erro nos produtos:",
            error,
          );

          productsLoaded = true;
          finishLoading();
        },
      );

    return () => {
      if (
        typeof stopCategories ===
        "function"
      ) {
        stopCategories();
      }

      if (
        typeof stopProducts === "function"
      ) {
        stopProducts();
      }
    };
  }, [
    route,
    publicEstablishmentId,
  ]);

  useEffect
  (() => {
    Storage.save(
      STORAGE_KEYS.CARRINHO,
      cartItems,
    );
  }, [cartItems]);

  const activeOrder = useMemo(() => {
    const sourceOrders =
      route === "/menu"
        ? customerOrders
        : orders;

    return (
      [...sourceOrders]
        .sort(
          (firstOrder, secondOrder) =>
            Number(
              secondOrder.criadoEmMs ??
                getTime(secondOrder.criadoEm) ??
                0,
            ) -
            Number(
              firstOrder.criadoEmMs ??
                getTime(firstOrder.criadoEm) ??
                0,
            ),
        )
        .find(
          (order) =>
            Number(order.mesa) ===
              Number(table) &&
            [
              "aguardando",
              "recebido",
              "preparando",
              "saindo",
              "finalizado",
            ].includes(order.status) &&
            Array.isArray(order.itens),
        ) || null
    );
  }, [
    route,
    customerOrders,
    orders,
    table,
  ]);

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
    window.history.pushState({}, "", path);
    setRoute(getRoute());

    setPublicEstablishmentId(
    getEstablishmentFromUrl(),
  );

  setTableToken(
    getTableTokenFromUrl(),
  );

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
    if (
      cartItems.length === 0 ||
      isSubmittingOrder
    ) {
      return;
    }

    if (!publicEstablishmentId) {
      showToast(
        "Estabelecimento não identificado.",
        "error",
        4000,
      );

      return;
    }

    if (!tableToken) {
      showToast(
        "O acesso desta mesa é inválido.",
        "error",
        4000,
      );

      return;
    }


    try {
      setIsSubmittingOrder(true);

      await createOrder({
        table,
        items: cartItems,
        total: cartTotal,
        establishmentId:publicEstablishmentId,
      });

      setCartItems([]);
      Storage.remove(STORAGE_KEYS.CARRINHO);
      setIsCartOpen(false);

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
    } finally {
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
    navigate(`/menu?mesa=${table}`);
  }

  function startNewSession() {
    Storage.remove(STORAGE_KEYS.MESA);
    Storage.remove(STORAGE_KEYS.CARRINHO);

    setTable(1);
    setCartItems([]);
    setIsCartOpen(false);

    showToast(
      "Sessão local limpa. Escolha uma mesa para continuar.",
      "info",
    );
  }

  function resetData() {
    Storage.remove(STORAGE_KEYS.MESA);
    Storage.remove(STORAGE_KEYS.CARRINHO);

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
    if (!establishmentId) {
      showToast(
        "Estabelecimento não identificado.",
        "error",
      );

      return;
    }

    try {
      await updateOrderStatus(
        orderId,
        status,
        establishmentId,
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
    if (!establishmentId) {
      showToast(
        "Estabelecimento não identificado.",
        "error",
      );

      return;
    }

    try {
      await markCallAsSeen(
        callTable,
        timestamp,
        establishmentId,
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

  if (authLoading) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p>Carregando...</p>
        </section>
      </main>
    );
  }

  if (route === "/cadastro") {
    if (isAuthenticated && isOnboarding) {
      return <Redirect to="/primeiro-acesso" />;
    }

    if (isAuthenticated && !isOnboarding) {
      return <Redirect to="/admin" />;
    }

    return (
      <>
        <RegisterPage onNavigate={navigate} />
        <ToastContainer />
      </>
    );
  }

  if (route === "/login") {
    if (isAuthenticated && isOnboarding) {
      return <Redirect to="/primeiro-acesso" />;
    }

    if (isAuthenticated && !isOnboarding) {
      return <Redirect to="/admin" />;
    }

    return (
      <>
        <LoginPage onNavigate={navigate} />
        <ToastContainer />
      </>
    );
  }

  if (route === "/primeiro-acesso") {
    if (!isAuthenticated) {
      return <Redirect to="/login" />;
    }

    if (!isOnboarding) {
      return <Redirect to="/admin" />;
    }

    return (
      <>
        <FirstAccessPage
          onNavigate={navigate}
          onCompleted={refreshProfile}
        />
        <ToastContainer />
      </>
    );
  }

  if (route === "/admin/produtos") {
    if (!isAuthenticated) {
      return <Redirect to="/login" />;
    }

    if (isOnboarding) {
      return (
        <Redirect to="/primeiro-acesso" />
      );
    }

    return (
      <>
        <AdminLayout
          activePage="produtos"
          onNavigate={navigate}
        >
          <ProductsPage
            onNavigate={navigate}
          />
        </AdminLayout>
        <ToastContainer />
      </>
    );
  }

  if (
    route === "/admin/categorias"
  ) {
    if (!isAuthenticated) {
      return (
        <Redirect to="/login" />
      );
    }

    if (isOnboarding) {
      return (
        <Redirect to="/primeiro-acesso" />
      );
    }

    return (
      <>
        <AdminLayout
          activePage="categorias"
          onNavigate={navigate}
        >
          <CategoriesPage
            onNavigate={navigate}
          />
        </AdminLayout>

        <ToastContainer />
      </>
    );
  }

  if (route === "/admin/mesas") {
    if (!isAuthenticated) {
      return <Redirect to="/login" />;
    }

    if (isOnboarding) {
      return (
        <Redirect to="/primeiro-acesso" />
      );
    }

    return (
      <>
        <AdminLayout
          activePage="mesas"
          onNavigate={navigate}
        >
          <TablesPage />
        </AdminLayout>

        <ToastContainer />
      </>
    );
  }

  if (route === "/admin/mapa-mesas") {
    if (!isAuthenticated) {
      return <Redirect to="/login" />;
    }

    if (isOnboarding) {
      return (
        <Redirect to="/primeiro-acesso" />
      );
    }

    return (
      <>
        <AdminLayout
          activePage="mapa-mesas"
          onNavigate={navigate}
          orders={orders}
        >
          <TablesMapPage
            onNavigate={navigate}
          />
        </AdminLayout>

        <ToastContainer />
      </>
    );
  }

  if (route === "/admin/cozinha") {
    if (!isAuthenticated) {
      return (
        <Redirect to="/login" />
      );
    }

    if (isOnboarding) {
      return (
        <Redirect to="/primeiro-acesso" />
      );
    }

    return (
      <>
        <AdminLayout
          activePage="cozinha"
          onNavigate={navigate}
          orders={orders}
        >
          <KitchenPage />
        </AdminLayout>

        <ToastContainer />
      </>
    );
  }

  if (route === "/admin/pedidos") {
    if (!isAuthenticated) {
      return (
        <Redirect to="/login" />
      );
    }

    if (isOnboarding) {
      return (
        <Redirect to="/primeiro-acesso" />
      );
    }

    return (
      <>
        <AdminLayout
          activePage="pedidos"
          onNavigate={navigate}
          orders={orders}
        >
          <AdminOrdersPage />
        </AdminLayout>

        <ToastContainer />
      </>
    );
  }

  if (route === "/admin") {
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (isOnboarding) {
    return (
      <Redirect to="/primeiro-acesso" />
    );
  }

  return (
    <>
      <AdminLayout
        activePage="dashboard"
        onNavigate={navigate}
        orders={orders}
      >
        <DashboardPage />
      </AdminLayout>

      <ToastContainer />
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
          onContinueSession={continueSession}
          onNewSession={startNewSession}
          onNavigate={navigate}
        />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <MenuPage
        table={table}
        categories={menuCategories}
        products={menuProducts}
        onNavigate={navigate}
        onAddItem={addItem}
        onOpenCart={() => setIsCartOpen(true)}
        onRequestService={handleRequestService}
        cartCount={cartCount}
        activeOrder={activeOrder}
        firebaseLoading={menuLoading}
      />

      <CartSidebar
        items={cartItems}
        total={cartTotal}
        isOpen={isCartOpen}
        isSubmitting={isSubmittingOrder}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onFinishOrder={finishOrder}
      />

      <ToastContainer />
    </>
  );
}