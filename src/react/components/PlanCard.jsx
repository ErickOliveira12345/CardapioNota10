import React from "react";

function formatPrice(value) {
  const price = Number(value || 0);

  return price.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

function formatLimit(
  value,
  singular,
  plural,
) {
  const numberValue =
    Number(value);

  if (
    numberValue === -1
  ) {
    return `${plural} ilimitados`;
  }

  if (
    numberValue === 1
  ) {
    return `1 ${singular}`;
  }

  return `${numberValue} ${plural}`;
}

export default function PlanCard({
  plan,
  recommended = false,
  onSelect,
}) {
  const funcionalidades =
    plan?.funcionalidades || {};

  const {
    cardapioQrCode = false,
    chamadosAtendimento = false,
    controlePedidos = false,
    marcaPersonalizada = false,
    relatoriosAvancados = false,
    relatoriosVendas = false,
    suportePrioritario = false,

    maxCategorias = 0,
    maxFuncionarios = 0,
    maxMesas = 0,
    maxProdutos = 0,
  } = funcionalidades;

  return (
    <div
      className={`plan-card ${
        recommended
          ? "recommended"
          : ""
      }`}
    >
      {recommended && (
        <div className="plan-badge">
          Mais Popular
        </div>
      )}

      <h2>
        {plan?.nome ||
          "Plano"}
      </h2>

      <p className="plan-description">
        {plan?.descricao ||
          ""}
      </p>

      <div className="plan-price">
        <span>
          R$
        </span>

        <strong>
          {formatPrice(
            Number(plan?.precoMensal || 0) / 100,
          )}
        </strong>

        <small>
          /mês
        </small>
      </div>

      <ul className="plan-features">

        {/* LIMITES */}

        <li>
          <span>✔</span>

          {formatLimit(
            maxMesas,
            "mesa",
            "mesas",
          )}
        </li>

        <li>
          <span>✔</span>

          {formatLimit(
            maxProdutos,
            "produto",
            "produtos",
          )}
        </li>

        <li>
          <span>✔</span>

          {formatLimit(
            maxCategorias,
            "categoria",
            "categorias",
          )}
        </li>

        <li>
          <span>✔</span>

          {formatLimit(
            maxFuncionarios,
            "funcionário",
            "funcionários",
          )}
        </li>


        {/* FUNCIONALIDADES */}

        <li
          className={
            cardapioQrCode
              ? ""
              : "feature-disabled"
          }
        >
          <span>
            {cardapioQrCode
              ? "✔"
              : "✖"}
          </span>

          Cardápio por QR Code
        </li>

        <li
          className={
            controlePedidos
              ? ""
              : "feature-disabled"
          }
        >
          <span>
            {controlePedidos
              ? "✔"
              : "✖"}
          </span>

          Controle de pedidos
        </li>

        <li
          className={
            chamadosAtendimento
              ? ""
              : "feature-disabled"
          }
        >
          <span>
            {chamadosAtendimento
              ? "✔"
              : "✖"}
          </span>

          Chamados de atendimento
        </li>

        <li
          className={
            relatoriosVendas
              ? ""
              : "feature-disabled"
          }
        >
          <span>
            {relatoriosVendas
              ? "✔"
              : "✖"}
          </span>

          Relatórios de vendas
        </li>

        <li
          className={
            relatoriosAvancados
              ? ""
              : "feature-disabled"
          }
        >
          <span>
            {relatoriosAvancados
              ? "✔"
              : "✖"}
          </span>

          Relatórios avançados
        </li>

        <li
          className={
            marcaPersonalizada
              ? ""
              : "feature-disabled"
          }
        >
          <span>
            {marcaPersonalizada
              ? "✔"
              : "✖"}
          </span>

          Marca personalizada
        </li>

        <li
          className={
            suportePrioritario
              ? ""
              : "feature-disabled"
          }
        >
          <span>
            {suportePrioritario
              ? "✔"
              : "✖"}
          </span>

          Suporte prioritário
        </li>
      </ul>

      <button
        type="button"
        className="plan-button"
        onClick={() =>
          onSelect?.(plan)
        }
      >
        Escolher Plano
      </button>
    </div>
  );
}