const STORAGE_KEY =
  "cardapio_nota10_notificacoes";

export function getSavedNotifications() {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    return saved
      ? JSON.parse(saved)
      : [];
  } catch (error) {
    console.error(
      "Erro ao carregar notificações:",
      error,
    );

    return [];
  }
}

export function saveNotifications(
  notifications,
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications),
    );
  } catch (error) {
    console.error(
      "Erro ao salvar notificações:",
      error,
    );
  }
}

export function clearNotifications() {
  localStorage.removeItem(
    STORAGE_KEY,
  );
}

export function createOrderNotification(
  order,
) {
  const items = Array.isArray(
    order.itens,
  )
    ? order.itens
    : [];

  const totalItems = items.reduce(
    (total, item) =>
      total +
      Number(item.quantidade || 1),
    0,
  );

  return {
    id:
      `pedido-${order.idPedido || order.id}-` +
      `${Date.now()}`,

    orderId:
      order.idPedido || order.id,

    type: "new-order",

    title: "Novo pedido recebido",

    message:
      `Mesa ${order.mesa} realizou um pedido ` +
      `com ${totalItems} item` +
      `${totalItems === 1 ? "" : "s"}.`,

    table: order.mesa,

    read: false,

    createdAt: Date.now(),
  };
}