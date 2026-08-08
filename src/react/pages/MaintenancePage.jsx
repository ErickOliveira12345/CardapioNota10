import React from "react";

import "../styles/MaintenancePage.css";

export default function MaintenancePage() {
  return (
    <main className="maintenance-page">
      <div className="maintenance-card">
        <div className="maintenance-icon">
          🛠️
        </div>

        <h1>
          Sistema em manutenção
        </h1>

        <p>
          O Cardápio Nota10 está passando
          por uma manutenção programada.
        </p>

        <p>
          Tente novamente em alguns
          minutos.
        </p>
      </div>
    </main>
  );
}