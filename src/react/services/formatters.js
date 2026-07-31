function toDate(value) {
  if (!value) return null;

  // Firebase Timestamp
  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  // Firebase Timestamp convertido em objeto
  if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    return new Date(value.seconds * 1000);
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

export function formatCurrency(value) {
  const numericValue = Number(value);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(
    Number.isFinite(numericValue)
      ? numericValue
      : 0,
  );
}

export function formatTime(timestamp) {
  const date = toDate(timestamp);

  if (!date) return "--:--";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(timestamp) {
  const date = toDate(timestamp);

  if (!date) return "--/-- --:--";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeSince(timestamp) {
  const date = toDate(timestamp);

  if (!date) return "horário indisponível";

  const difference = Date.now() - date.getTime();

  if (difference <= 0) {
    return "agora mesmo";
  }

  const seconds = Math.floor(
    difference / 1000,
  );

  if (seconds < 60) {
    return "agora mesmo";
  }

  const minutes = Math.floor(
    seconds / 60,
  );

  if (minutes < 60) {
    return `há ${minutes} min`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `há ${hours}h`;
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days === 1) {
    return "há 1 dia";
  }

  return `há ${days} dias`;
}

export function getStatus(key) {
  const statuses = {
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

  return (
    statuses[key] || {
      label: key || "Desconhecido",
      color: "",
      icon: "?",
    }
  );
}

export function formatCurrencyFromCents(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0) / 100);
}