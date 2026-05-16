// Camada de abstração do LocalStorage — todas as leituras/escritas passam por aqui
const Storage = {
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('[Storage] Erro ao salvar:', key, e);
    }
  },

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      console.error('[Storage] Erro ao ler:', key, e);
      return defaultValue;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  },

  // Chaves centralizadas para evitar typos em qualquer módulo
  KEYS: {
    MESA:     'ps_mesa_atual',
    CARRINHO: 'ps_carrinho',
    PEDIDOS:  'ps_pedidos',
    CHAMADOS: 'ps_chamados',
  },
};
