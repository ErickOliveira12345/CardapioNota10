export const STORAGE_KEYS = {
  MESA: "ps_mesa_atual",
  CARRINHO: "ps_carrinho",
  PEDIDOS: "ps_pedidos",
  CHAMADOS: "ps_chamados",
};

export const Storage = {
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  },
};
