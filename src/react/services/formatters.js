export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeSince(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "agora mesmo";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;

  return `há ${Math.floor(minutes / 60)}h`;
}

export function getStatus(key) {
  const status = {
    aguardando: {
      label: "Aguardando atendimento",
      color: "status--warning",
      icon: "⏳",
    },
    recebido: {
      label: "Pedido recebido",
      color: "status--info",
      icon: "📋",
    },
    preparando: {
      label: "Em preparo",
      color: "status--primary",
      icon: "🍳",
    },
    saindo: {
      label: "Saindo",
      color: "status--purple",
      icon: "🛵",
    },
    finalizado: {
      label: "Finalizado",
      color: "status--success",
      icon: "✓",
    },
    cancelado: {
      label: "Cancelado",
      color: "status--danger",
      icon: "×",
    },
  };

  return status[key] || { label: key, color: "", icon: "?" };
}
