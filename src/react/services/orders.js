import { Storage, STORAGE_KEYS } from "./storage.js";

export function getOrders() {
  const orders = Storage.get(STORAGE_KEYS.PEDIDOS, []);
  return Array.isArray(orders) ? orders : [];
}

export function getOrdersByTable(table) {
  return getOrders().filter((order) => order.mesa === Number(table));
}

export function getActiveOrderByTable(table) {
  const activeStatuses = ["aguardando", "recebido", "preparando", "saindo"];
  return (
    getOrdersByTable(table).find(
      (order) => activeStatuses.includes(order.status) && Array.isArray(order.itens),
    ) || null
  );
}

export function createOrder({ table, items, total }) {
  if (!items.length) return null;

  const order = {
    idPedido: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    mesa: Number(table),
    itens: items.map((item) => ({ ...item })),
    total,
    status: "aguardando",
    criadoEm: Date.now(),
    atualizadoEm: Date.now(),
  };

  Storage.save(STORAGE_KEYS.PEDIDOS, [...getOrders(), order]);
  return order;
}

export function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const nextOrders = orders.map((order) =>
    order.idPedido === orderId
      ? {
          ...order,
          status,
          atualizadoEm: Date.now(),
        }
      : order,
  );

  Storage.save(STORAGE_KEYS.PEDIDOS, nextOrders);
}

export function getCalls() {
  const calls = Storage.get(STORAGE_KEYS.CHAMADOS, []);
  return Array.isArray(calls) ? calls : [];
}

export function requestService(table) {
  const chamados = getCalls();
  const alreadyExists = chamados.some(
    (call) => call.mesa === Number(table) && !call.visualizado,
  );

  if (alreadyExists) return false;

  Storage.save(STORAGE_KEYS.CHAMADOS, [
    ...chamados,
    {
      mesa: Number(table),
      timestamp: Date.now(),
      visualizado: false,
    },
  ]);

  return true;
}

export function markCallAsSeen(table, timestamp) {
  const calls = getCalls().map((call) =>
    call.mesa === Number(table) && call.timestamp === Number(timestamp)
      ? { ...call, visualizado: true }
      : call,
  );

  Storage.save(STORAGE_KEYS.CHAMADOS, calls);
}
