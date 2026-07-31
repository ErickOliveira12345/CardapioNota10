import { useEffect, useState } from "react";

import PlanCard from "../components/PlanCard";

import "../styles/plans.css";

import {
  getPlans,
} from "../services/subscriptionService";

import { formatCurrencyFromCents } from "../services/formatters";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    const data = await getPlans();

    data.sort((a, b) => a.ordem - b.ordem);

    setPlans(data);
  }

  function handleSelect(plan) {
    console.log(plan);

    // Mercado Pago
  }

  return (
    <div className="plans-page">
      <header className="plans-header">
        <h1>
          Escolha o plano ideal
        </h1>

        <p>
          Assine o Cardápio Nota10 e
          tenha acesso às melhores
          ferramentas para o seu
          restaurante.
        </p>
      </header>

      <section className="plans-grid">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            recommended={
              plan.id === "intermediario"
            }
            onSelect={handleSelect}
          />
        ))}
      </section>
    </div>
  );
}