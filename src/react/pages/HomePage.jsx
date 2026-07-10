import React from "react";

const qrCodes = [
  {
    mesa: 1,
    imagem: "/src/img/qrcode-1.svg",
    descricao: "Mesa perto da janela",
  },
  {
    mesa: 2,
    imagem: "/src/img/qrcode-2.svg",
    descricao: "Mesa central",
  },
  {
    mesa: 3,
    imagem: "/src/img/qrcode-3.svg",
    descricao: "Mesa no terraço",
  },
  {
    mesa: 4,
    imagem: "/src/img/qrcode-4.svg",
    descricao: "Mesa reservada",
  },
];

export function HomePage({ currentTable, onSelectTable, onContinueSession, onNewSession, onNavigate }) {
  return (
    <div className="qr-page">
      <header className="qr-header">
        <div className="qr-logo" aria-hidden="true">
          🍽️
        </div>
        <h1 className="qr-restaurant-name">Cardápio Nota10</h1>
        <p className="qr-tagline">Cardápio digital · Peça na mesa</p>
      </header>

      {currentTable && (
        <div className="session-banner">
          <p>
            Você já tem uma sessão ativa na <strong>Mesa {currentTable}</strong>.
          </p>
          <div className="session-actions">
            <button className="btn-return" type="button" onClick={onContinueSession}>
              Continuar pedido
            </button>
            <button className="btn-new-session" type="button" onClick={onNewSession}>
              Nova sessão
            </button>
          </div>
        </div>
      )}

      <div className="qr-instructions">
        <div className="instruction-step">
          <span className="step-num">1</span>
          <span>Encontre o QR Code colado na sua mesa</span>
        </div>
        <div className="instruction-step">
          <span className="step-num">2</span>
          <span>Clique no QR Code correspondente abaixo</span>
        </div>
        <div className="instruction-step">
          <span className="step-num">3</span>
          <span>Escolha seus itens e faça seu pedido</span>
        </div>
      </div>

      <p className="qr-section-title">Selecione sua mesa</p>
      <div className="qr-grid" role="list">
        {qrCodes.map((qr) => (
          <button
            className="qr-card qr-card-button"
            key={qr.mesa}
            type="button"
            onClick={() => onSelectTable(qr.mesa)}
            aria-label={`Selecionar Mesa ${qr.mesa}`}
          >
            <div className="qr-card__img-wrapper">
              <img src={qr.imagem} alt={`QR Code Mesa ${qr.mesa}`} className="qr-card__img" />
              <div className="qr-card__overlay">
                <span className="qr-scan-icon">📷 Toque para escanear</span>
              </div>
            </div>
            <div className="qr-card__footer">
              <span className="qr-card__mesa">Mesa {qr.mesa}</span>
              <span className="qr-card__desc">{qr.descricao}</span>
            </div>
          </button>
        ))}
      </div>

      <p className="qr-admin-link">
        Funcionário?{" "}
        <button type="button" onClick={() => onNavigate("/admin")}>
          Acessar painel do estabelecimento →
        </button>
      </p>
    </div>
  );
}
