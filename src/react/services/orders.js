import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig.js";
import {autenticarClienteAnonimo} from "./authService.js";

export function observeCustomerOrders({
  establishmentId,
  customerUid,
  table,
  onChange,
  onError,
}) {
  if (
    !establishmentId ||
    !customerUid ||
    !table
  ) {
    onChange([]);
    return () => {};
  }

  const customerOrdersQuery = query(
    ordersCollection(establishmentId),
    where(
      "clienteUid",
      "==",
      customerUid,
    ),
  );

  return onSnapshot(
    customerOrdersQuery,
    (snapshot) => {
      const customerOrders = snapshot.docs
        .map((document) => ({
          idPedido: document.id,
          ...document.data(),
        }))
        .filter(
          (order) =>
            Number(order.mesa) ===
            Number(table),
        )
        .sort(
          (firstOrder, secondOrder) =>
            Number(
              secondOrder.criadoEmMs || 0,
            ) -
            Number(
              firstOrder.criadoEmMs || 0,
            ),
        );

      console.log(
        "Pedidos acompanhados pela mesa:",
        customerOrders,
      );

      onChange(customerOrders);
    },
    (error) => {
      console.error(
        "Erro ao acompanhar pedido:",
        error,
      );

      onError?.(error);
    },
  );
}


export const DEFAULT_ESTABLISHMENT_ID =
  "cardapio-nota10-demo";

const ACTIVE_ORDER_STATUSES = [
  "aguardando",
  "recebido",
  "preparando",
  "saindo",
];

const VALID_ORDER_STATUSES = [
  "aguardando",
  "recebido",
  "preparando",
  "saindo",
  "finalizado",
  "cancelado",
];

function ordersCollection(establishmentId) {
  return collection(
    db,
    "establishments",
    establishmentId,
    "orders",
  );
}

function callsCollection(establishmentId) {
  return collection(
    db,
    "establishments",
    establishmentId,
    "serviceCalls",
  );
}

function paymentsCollection(establishmentId) {
  return collection(
    db,
    "establishments",
    establishmentId,
    "payments",
  );
}

function timestampToMilliseconds(value, fallback = 0) {
  if (!value) return fallback;

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}

function normalizeOrder(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    ...data,

    idPedido: documentSnapshot.id,

    mesa: Number(data.mesa),

    itens: Array.isArray(data.itens)
      ? data.itens
      : [],

    total: Number(data.total) || 0,

    criadoEm: timestampToMilliseconds(
      data.criadoEm,
      data.criadoEmMs,
    ),

    atualizadoEm: timestampToMilliseconds(
      data.atualizadoEm,
      data.atualizadoEmMs,
    ),
  };
}

function normalizeCall(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    ...data,

    id: documentSnapshot.id,

    mesa: Number(data.mesa),

    timestamp: timestampToMilliseconds(
      data.timestamp,
      data.timestampMs,
    ),

    visualizado: Boolean(data.visualizado),
  };
}

/**
 * Observa todos os pedidos em tempo real.
 *
 * Retorna uma função para cancelar o listener.
 */
export function observeOrders(
  onChange,
  onError,
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
) {
  const ordersQuery = query(
    ordersCollection(establishmentId),
    orderBy("criadoEmMs", "desc"),
  );

  return onSnapshot(
    ordersQuery,

    (snapshot) => {
      const orders = snapshot.docs.map(normalizeOrder);
      onChange(orders);
    },

    (error) => {
      console.error(
        "Erro ao observar pedidos:",
        error,
      );

      if (onError) {
        onError(error);
      }
    },
  );
}

/**
 * Busca todos os pedidos uma única vez.
 */
export async function getOrders(
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
) {
  const ordersQuery = query(
    ordersCollection(establishmentId),
    orderBy("criadoEmMs", "desc"),
  );

  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs.map(normalizeOrder);
}

/**
 * Busca pedidos de uma mesa.
 */
export async function getOrdersByTable(
  table,
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
) {
  const tableNumber = Number(table);

  if (!Number.isInteger(tableNumber)) {
    return [];
  }

  const tableQuery = query(
    ordersCollection(establishmentId),
    where("mesa", "==", tableNumber),
  );

  const snapshot = await getDocs(tableQuery);

  return snapshot.docs
    .map(normalizeOrder)
    .sort(
      (firstOrder, secondOrder) =>
        secondOrder.criadoEm -
        firstOrder.criadoEm,
    );
}

/**
 * Busca o pedido ativo mais recente da mesa.
 */
export async function getActiveOrderByTable(
  table,
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
) {
  const orders = await getOrdersByTable(
    table,
    establishmentId,
  );

  return (
    orders.find(
      (order) =>
        ACTIVE_ORDER_STATUSES.includes(
          order.status,
        ) &&
        Array.isArray(order.itens),
    ) || null
  );
}

/**
 * Cria um pedido no Firestore.
 */
export async function createOrder({
  table,
  items,
  total,
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
}) {
  const tableNumber = Number(table);

  if (!Number.isInteger(tableNumber)) {
    throw new Error("Mesa inválida.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      "Adicione pelo menos um item ao pedido.",
    );
  }

  const normalizedItems = items.map((item) => ({
    id: String(item.id),

    nome: String(item.nome || ""),

    descricao: String(
      item.descricao || "",
    ),

    emoji: String(item.emoji || ""),

    categoriaId:
      item.categoriaId ||
      item.categoria ||
      item.categoryId ||
      "",

    preco: Number(item.preco) || 0,

    quantidade:
      Number(item.quantidade) || 1,

    subtotal:
      Number(item.subtotal) ||
      (Number(item.preco) || 0) *
        (Number(item.quantidade) || 1),
  }));

  const orderTotal = Number(total);

  if (
    !Number.isFinite(orderTotal) ||
    orderTotal < 0
  ) {
    throw new Error(
      "O total do pedido é inválido.",
    );
  }

  const currentTime = Date.now();

  const customer =
    await autenticarClienteAnonimo();

  const orderReference = await addDoc(
    ordersCollection(establishmentId),
    {
      mesa: tableNumber,

      clienteUid: customer.uid,

      itens: normalizedItems,

      total: orderTotal,

      status: "aguardando",

      criadoEm: serverTimestamp(),
      criadoEmMs: currentTime,

      atualizadoEm: serverTimestamp(),
      atualizadoEmMs: currentTime,
    },
  );

  return {
    idPedido: orderReference.id,

    mesa: tableNumber,

    itens: normalizedItems,

    total: orderTotal,

    status: "aguardando",

    criadoEm: currentTime,
    atualizadoEm: currentTime,
  };
}

/**
 * Atualiza o status de um pedido.
 */
export async function updateOrderStatus(
  orderId,
  status,
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
) {
  if (!orderId) {
    throw new Error(
      "O ID do pedido é obrigatório.",
    );
  }

  if (
    !VALID_ORDER_STATUSES.includes(status)
  ) {
    throw new Error(
      "Status de pedido inválido.",
    );
  }

  const orderReference = doc(
    db,
    "establishments",
    establishmentId,
    "orders",
    orderId,
  );

  const currentTime = Date.now();

  const updateData = {
    status,

    atualizadoEm: serverTimestamp(),
    atualizadoEmMs: currentTime,
  };

  const statusDateFields = {
    recebido: "recebidoEm",
    preparando: "preparandoEm",
    saindo: "saindoEm",
    finalizado: "finalizadoEm",
    cancelado: "canceladoEm",
  };

  const statusDateField =
    statusDateFields[status];

  if (statusDateField) {
    updateData[statusDateField] =
      serverTimestamp();

    updateData[`${statusDateField}Ms`] =
      currentTime;
  }

  await updateDoc(
    orderReference,
    updateData,
  );

  return true;
}

/**
 * Registra o pagamento e o fechamento de uma comanda.
 */
export async function createPayment({
  mesa,
  pedidos,
  subtotal,
  taxaServicoPercentual = 0,
  taxaServicoValor = 0,
  desconto = 0,
  totalFinal,
  formaPagamento,
  fechadoPor = null,
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
}) {
  const tableNumber = Number(mesa);

  if (!Number.isInteger(tableNumber)) {
    throw new Error("Mesa inválida.");
  }

  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    throw new Error(
      "A comanda precisa possuir pelo menos um pedido.",
    );
  }

  const orderIds = pedidos
    .map((pedido) => {
      if (typeof pedido === "string") {
        return pedido;
      }

      return pedido.idPedido || pedido.id;
    })
    .filter(Boolean);

  if (orderIds.length === 0) {
    throw new Error(
      "Nenhum ID de pedido válido foi informado.",
    );
  }

  const normalizedSubtotal =
    Number(subtotal) || 0;

  const normalizedServicePercentage =
    Number(taxaServicoPercentual) || 0;

  const normalizedServiceValue =
    Number(taxaServicoValor) || 0;

  const normalizedDiscount =
    Number(desconto) || 0;

  const normalizedFinalTotal =
    Number(totalFinal);

  if (
    normalizedSubtotal < 0 ||
    normalizedServicePercentage < 0 ||
    normalizedServiceValue < 0 ||
    normalizedDiscount < 0
  ) {
    throw new Error(
      "Os valores da comanda não podem ser negativos.",
    );
  }

  if (
    !Number.isFinite(normalizedFinalTotal) ||
    normalizedFinalTotal < 0
  ) {
    throw new Error(
      "O total final da comanda é inválido.",
    );
  }

  const validPaymentMethods = [
    "pix",
    "dinheiro",
    "credito",
    "debito",
    "voucher",
    "outro",
  ];

  if (
    !validPaymentMethods.includes(
      formaPagamento,
    )
  ) {
    throw new Error(
      "Forma de pagamento inválida.",
    );
  }

  const currentTime = Date.now();

  // ===== DEBUG =====
  console.log("=== CRIANDO PAGAMENTO ===");
  console.log({
    establishmentId,
    mesa: tableNumber,
    pedidos: orderIds,
    subtotal: normalizedSubtotal,
    taxaServicoPercentual: normalizedServicePercentage,
    taxaServicoValor: normalizedServiceValue,
    desconto: normalizedDiscount,
    totalFinal: normalizedFinalTotal,
    formaPagamento,
    fechadoPor,
  });

  const paymentReference = await addDoc(
    paymentsCollection(establishmentId),
    {
      mesa: tableNumber,
      pedidos: orderIds,
      quantidadePedidos: orderIds.length,
      subtotal: normalizedSubtotal,

      taxaServico: {
        percentual:
          normalizedServicePercentage,
        valor: normalizedServiceValue,
      },

      desconto: normalizedDiscount,

      totalFinal: normalizedFinalTotal,

      formaPagamento,

      status: "pago",

      fechadoPor,

      criadoEm: serverTimestamp(),
      criadoEmMs: currentTime,

      atualizadoEm: serverTimestamp(),
      atualizadoEmMs: currentTime,
    },
  );

  console.log(
    "✅ Pagamento salvo no Firestore!",
  );

  console.log(
    "ID:",
    paymentReference.id,
  );

  return {
    idPagamento: paymentReference.id,

    mesa: tableNumber,

    pedidos: orderIds,

    quantidadePedidos: orderIds.length,

    subtotal: normalizedSubtotal,

    taxaServico: {
      percentual:
        normalizedServicePercentage,
      valor:
        normalizedServiceValue,
    },

    desconto: normalizedDiscount,

    totalFinal: normalizedFinalTotal,

    formaPagamento,

    status: "pago",

    fechadoPor,

    criadoEm: currentTime,
  };
}


function normalizePayment(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    ...data,

    idPagamento: documentSnapshot.id,

    mesa: Number(data.mesa) || 0,

    subtotal:
      Number(data.subtotal) || 0,

    desconto:
      Number(data.desconto) || 0,

    totalFinal:
      Number(data.totalFinal) || 0,

    taxaServico: {
      percentual:
        Number(
          data.taxaServico?.percentual,
        ) || 0,

      valor:
        Number(
          data.taxaServico?.valor,
        ) || 0,
    },

    quantidadePedidos:
      Number(
        data.quantidadePedidos,
      ) || 0,

    criadoEm:
      timestampToMilliseconds(
        data.criadoEm,
        data.criadoEmMs,
      ),

    atualizadoEm:
      timestampToMilliseconds(
        data.atualizadoEm,
        data.atualizadoEmMs,
      ),
  };
}

/**
 * Observa os pagamentos em tempo real.
 */
export function observePayments(
  onChange,
  onError,
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
) {
  const paymentsQuery = query(
    paymentsCollection(establishmentId),

    orderBy(
      "criadoEmMs",
      "desc",
    ),
  );

  return onSnapshot(
    
    paymentsQuery,

    (snapshot) => {
      const payments =
        snapshot.docs.map(
          normalizePayment,
        );

      onChange(payments);
    },

    (error) => {
      console.error(
        "Erro ao observar pagamentos:",
        error,
      );

      onError?.(error);
    },
  );
}

/**
 * Observa os chamados de atendimento em tempo real.
 *
 * Retorna uma função para cancelar o listener.
 */
export function observeCalls(
  onChange,
  onError,
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
) {
  const callsQuery = query(
    callsCollection(establishmentId),
    orderBy("timestampMs", "desc"),
  );

  return onSnapshot(
    callsQuery,

    (snapshot) => {
      const calls =
        snapshot.docs.map(normalizeCall);

      onChange(calls);
    },

    (error) => {
      console.error(
        "Erro ao observar chamados:",
        error,
      );

      if (onError) {
        onError(error);
      }
    },
  );
}

/**
 * Busca os chamados uma única vez.
 */
export async function getCalls(
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
) {
  const callsQuery = query(
    callsCollection(establishmentId),
    orderBy("timestampMs", "desc"),
  );

  const snapshot = await getDocs(callsQuery);

  return snapshot.docs.map(normalizeCall);
}

/**
 * Cria um chamado de atendimento.
 *
 * Não permite dois chamados ativos da mesma mesa.
 */
export async function requestService(
  table,
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
) {
  const tableNumber = Number(table);

  if (!Number.isInteger(tableNumber)) {
    throw new Error("Mesa inválida.");
  }

  const activeCallQuery = query(
    callsCollection(establishmentId),

    where("mesa", "==", tableNumber),

    where("visualizado", "==", false),

    limit(1),
  );

  const activeCallSnapshot =
    await getDocs(activeCallQuery);

  if (!activeCallSnapshot.empty) {
    return false;
  }

  const currentTime = Date.now();

  await addDoc(
    callsCollection(establishmentId),
    {
      mesa: tableNumber,

      visualizado: false,

      timestamp: serverTimestamp(),
      timestampMs: currentTime,

      atendidoEm: null,
      atendidoEmMs: null,
    },
  );

  return true;
}

/**
 * Mantém compatibilidade com seu AdminPage atual:
 *
 * markCallAsSeen(call.mesa, call.timestamp)
 */
export async function markCallAsSeen(
  table,
  timestamp,
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
) {
  const tableNumber = Number(table);
  const timestampNumber = Number(timestamp);

  if (!Number.isInteger(tableNumber)) {
    throw new Error("Mesa inválida.");
  }

  const callQuery = query(
    callsCollection(establishmentId),

    where("mesa", "==", tableNumber),

    where(
      "timestampMs",
      "==",
      timestampNumber,
    ),

    limit(1),
  );

  const snapshot = await getDocs(callQuery);

  if (snapshot.empty) {
    throw new Error(
      "Chamado não encontrado.",
    );
  }

  const callDocument = snapshot.docs[0];

  await updateDoc(callDocument.ref, {
    visualizado: true,

    atendidoEm: serverTimestamp(),
    atendidoEmMs: Date.now(),
  });

  return true;
}

/**
 * Forma recomendada para marcar um chamado usando seu ID.
 */
export async function markCallAsSeenById(
  callId,
  establishmentId = DEFAULT_ESTABLISHMENT_ID,
) {
  if (!callId) {
    throw new Error(
      "O ID do chamado é obrigatório.",
    );
  }

  const callReference = doc(
    db,
    "establishments",
    establishmentId,
    "serviceCalls",
    callId,
  );

  await updateDoc(callReference, {
    visualizado: true,

    atendidoEm: serverTimestamp(),
    atendidoEmMs: Date.now(),
  });

  return true;
}