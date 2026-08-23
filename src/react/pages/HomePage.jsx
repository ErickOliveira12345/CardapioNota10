import React from "react";

export function HomePage({ currentTable, onSelectTable, onContinueSession, onNewSession, onNavigate }) {
  return (
    <div className="qr-page">
      <header className="qr-header">
        <div className="qr-logo" aria-hidden="true">
          🍽️
        </div>
        <h1 className="qr-restaurant-name">Cardápio Nota10</h1>
        <p className="qr-tagline"> Bem Vindo ao Seu Novo Cardápio digital</p>
      </header>


      <div className="qr-instructions">
        <div className="instruction-step">
          <span className="step-num">1</span>
          <span>Cardápio com Qr Code na mesa</span>
        </div>
        <div className="instruction-step">
          <span className="step-num">2</span>
          <span>Comece a inovação no seu Estabelecimento</span>
        </div>
        <div className="instruction-step">
          <span className="step-num">3</span>
          <span>Escolha o melhor Plano para seu Estabelecimento</span>
        </div>
      </div>

      <p className="qr-admin-link ">
        <button type="button" onClick={() => onNavigate("/login")}>
          Criar Conta Para o meu Estabelecimento →
        </button>
      </p>
    </div>
  );
}
