import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

function getTimestampMilliseconds(value) {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value.seconds === "number"
  ) {
    return value.seconds * 1000;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  const parsedDate = new Date(
    value,
  ).getTime();

  return Number.isFinite(parsedDate)
    ? parsedDate
    : 0;
}

function getOrderCreationTime(order) {
  return (
    getTimestampMilliseconds(
      order?.criadoEm,
    ) ||
    Number(order?.criadoEmMs) ||
    Number(order?.createdAt) ||
    0
  );
}

function formatElapsedTime(
  milliseconds,
) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000),
  );

  const hours = Math.floor(
    totalSeconds / 3600,
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  );

  const seconds =
    totalSeconds % 60;

  return [
    hours,
    minutes,
    seconds,
  ]
    .map((value) =>
      String(value).padStart(2, "0"),
    )
    .join(":");
}

function getTimerLevel(minutes) {
  if (minutes >= 30) {
    return {
      className: "critical",
      label: "Atraso crítico",
      icon: "🚨",
    };
  }

  if (minutes >= 20) {
    return {
      className: "late",
      label: "Pedido atrasado",
      icon: "🔴",
    };
  }

  if (minutes >= 10) {
    return {
      className: "attention",
      label: "Atenção",
      icon: "🟡",
    };
  }

  return {
    className: "normal",
    label: "Dentro do prazo",
    icon: "🟢",
  };
}

export function OrderTimer({
  order,
  compact = false,
}) {
  const creationTime = useMemo(
    () => getOrderCreationTime(order),
    [order],
  );

  const [currentTime, setCurrentTime] =
    useState(Date.now());

  useEffect(() => {
    setCurrentTime(Date.now());

    const intervalId =
      window.setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);

    return () => {
      window.clearInterval(
        intervalId,
      );
    };
  }, [creationTime]);

  const elapsedMilliseconds =
    creationTime > 0
      ? currentTime - creationTime
      : 0;

  const elapsedMinutes =
    elapsedMilliseconds / 60000;

  const timerLevel =
    getTimerLevel(elapsedMinutes);

  if (!creationTime) {
    return (
      <div className="order-timer order-timer--unavailable">
        <span>
          Tempo indisponível
        </span>
      </div>
    );
  }

  return (
    <div
      className={
        `order-timer ` +
        `order-timer--${timerLevel.className} ` +
        `${compact ? "order-timer--compact" : ""}`
      }
    >
      <div className="order-timer__header">
        <span>
          {timerLevel.icon}
        </span>

        <strong>
          {timerLevel.label}
        </strong>
      </div>

      <time className="order-timer__value">
        {formatElapsedTime(
          elapsedMilliseconds,
        )}
      </time>

      {!compact && (
        <small>
          Tempo desde a criação do pedido
        </small>
      )}
    </div>
  );
}

export function getOrderElapsedMinutes(
  order,
) {
  const creationTime =
    getOrderCreationTime(order);

  if (!creationTime) {
    return 0;
  }

  return Math.max(
    0,
    (Date.now() - creationTime) /
      60000,
  );
}