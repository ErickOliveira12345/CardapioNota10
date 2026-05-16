// Utilitários compartilhados por todos os módulos
const Utils = {
  generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  },

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  },

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  },

  formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  },

  timeSince(timestamp) {
    const s = Math.floor((Date.now() - timestamp) / 1000);
    if (s < 60) return 'agora mesmo';
    const m = Math.floor(s / 60);
    if (m < 60) return `há ${m} min`;
    return `há ${Math.floor(m / 60)}h`;
  },

  showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || icons.info}</span>
      <span class="toast__message">${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  },

  // Status do pedido: valor -> label e cor CSS
  STATUS: {
    aguardando: { label: 'Aguardando atendimento', color: 'status--warning',  icon: '⏳' },
    recebido:   { label: 'Pedido recebido',         color: 'status--info',     icon: '📋' },
    preparando: { label: 'Em preparação',            color: 'status--primary',  icon: '👨‍🍳' },
    saindo:     { label: 'Saindo para entrega',      color: 'status--purple',   icon: '🛵' },
    finalizado: { label: 'Finalizado',               color: 'status--success',  icon: '✅' },
    cancelado:  { label: 'Cancelado',                color: 'status--danger',   icon: '❌' },
  },

  getStatus(key) {
    return this.STATUS[key] || { label: key, color: '', icon: '?' };
  },
};
