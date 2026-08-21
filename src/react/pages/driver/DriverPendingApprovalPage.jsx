import React from "react";

import "../../styles/driver/driverPendingApproval.css";

export default function DriverPendingApprovalPage({
  onNavigate,
}) {
  return (
    <main className="driver-pending-page">
      <section className="driver-pending">
        <div className="driver-pending__icon">
          ⏳
        </div>

        <h1>
          Cadastro aguardando aprovação
        </h1>

        <p className="driver-pending__text">
          Seu cadastro de entregador foi
          realizado com sucesso.
        </p>

        <p className="driver-pending__text">
          Antes de começar a receber
          pedidos, seu cadastro precisa ser
          analisado e aprovado pela
          plataforma.
        </p>

        <div className="driver-pending__status">
          <span className="driver-pending__status-dot" />

          <div>
            <strong>
              Status atual
            </strong>

            <span>
              Aguardando aprovação
            </span>
          </div>
        </div>

        <div className="driver-pending__info">
          <span>
            ℹ️
          </span>

          <p>
            Após a aprovação, você poderá
            acessar os pedidos disponíveis
            dos estabelecimentos Premium.
          </p>
        </div>

        <button
          type="button"
          className="driver-pending__login"
          onClick={() =>
            onNavigate?.(
              "/entregador/login",
            )
          }
        >
          Voltar para o login
        </button>
      </section>
    </main>
  );
}