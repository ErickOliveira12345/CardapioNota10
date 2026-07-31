export default function PlanCard({
  plan,
  recommended = false,
  onSelect,
}) {
  return (
    <div
      className={`plan-card ${
        recommended ? "recommended" : ""
      }`}
    >
      {recommended && (
        <div className="plan-badge">
          Mais Popular
        </div>
      )}

      <h2>{plan.nome}</h2>

      <p className="plan-description">
        {plan.descricao}
      </p>

      <div className="plan-price">
        <span>R$</span>

        <strong>
          {Number(plan.preco).toFixed(2)}
        </strong>

        <small>/mês</small>
      </div>

      <ul className="plan-features">
        <li>✔ Dashboard</li>
        <li>✔ Pedidos</li>
        <li>✔ Cozinha</li>

        <li>
          {plan.recursos?.estoque
            ? "✔"
            : "✖"}{" "}
          Estoque
        </li>

        <li>
          {plan.recursos?.financeiro
            ? "✔"
            : "✖"}{" "}
          Financeiro
        </li>

        <li>
          {plan.limites?.mesas} mesas
        </li>

        <li>
          {plan.limites?.usuarios} usuários
        </li>
      </ul>

      <button
        className="plan-button"
        onClick={() => onSelect(plan)}
      >
        Escolher Plano
      </button>
    </div>
  );
}