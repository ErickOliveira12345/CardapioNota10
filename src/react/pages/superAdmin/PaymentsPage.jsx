import React, {
  useMemo,
  useState,
} from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "../../styles/superAdminCommon.css";
import "../../styles/PaymentsPage.css";

const INITIAL_PAYMENTS = [
  {
    id: "pay-001",
    estabelecimento:
      "Restaurante Sabor da Casa",
    descricao: "Plano Premium",
    valor: 99.9,
    metodo: "Pix",
    status: "approved",
    data: "15/07/2026",
  },
  {
    id: "pay-002",
    estabelecimento:
      "Lanchonete Central",
    descricao: "Plano Intermediário",
    valor: 59.9,
    metodo: "Cartão de crédito",
    status: "approved",
    data: "21/07/2026",
  },
  {
    id: "pay-003",
    estabelecimento: "Pizzaria Nota 10",
    descricao: "Plano Básico",
    valor: 39.9,
    metodo: "Boleto",
    status: "pending",
    data: "10/07/2026",
  },
  {
    id: "pay-004",
    estabelecimento: "Hambúrguer & Cia",
    descricao: "Plano Premium",
    valor: 99.9,
    metodo: "Cartão de crédito",
    status: "rejected",
    data: "18/07/2026",
  },
];

const PAYMENT_STATUS_LABELS = {
  approved: "Aprovado",
  pending: "Pendente",
  rejected: "Recusado",
  refunded: "Reembolsado",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] =
    useState("all");

  const payments = useMemo(() => {
    if (statusFilter === "all") {
      return INITIAL_PAYMENTS;
    }

    return INITIAL_PAYMENTS.filter(
      (payment) =>
        payment.status === statusFilter,
    );
  }, [statusFilter]);


  function handleExportPdf() {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Relatório de Pagamentos", 14, 20);

    doc.setFontSize(10);
    doc.text(
      `Data: ${new Date().toLocaleDateString("pt-BR")}`,
      14,
      28
    );

    autoTable(doc, {
      startY: 35,

      head: [[
        "Transação",
        "Estabelecimento",
        "Plano",
        "Valor",
        "Método",
        "Status",
        "Data"
      ]],

      body: payments.map(payment => [
        payment.id,
        payment.estabelecimento,
        payment.descricao,
        formatCurrency(payment.valor),
        payment.metodo,
        PAYMENT_STATUS_LABELS[payment.status],
        payment.data
      ]),
    });

    doc.save("relatorio-pagamentos.pdf");
  }

  return (
    <section className="super-admin-page payments-page">
      <header className="super-admin-page__header">
        <div>
          <span className="super-admin-page__eyebrow">
            Mercado Pago
          </span>

          <h1>Pagamentos</h1>

          <p>
            Consulte as cobranças e transações
            realizadas na plataforma.
          </p>
        </div>

        <button
          type="button"
          className="super-admin-button super-admin-button--secondary"
          onClick={handleExportPdf}
          disabled={payments.length === 0}
        >
          Exportar relatório
        </button>
      </header>

      <div className="super-admin-summary-grid">
        <article>
          <span>Total recebido</span>
          <strong>R$ 159,80</strong>
        </article>

        <article>
          <span>Pagamentos aprovados</span>
          <strong>2</strong>
        </article>

        <article>
          <span>Pagamentos pendentes</span>
          <strong>1</strong>
        </article>

        <article>
          <span>Pagamentos recusados</span>
          <strong>1</strong>
        </article>
      </div>

      <div className="super-admin-filters">
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value,
            )
          }
        >
          <option value="all">
            Todos os pagamentos
          </option>

          <option value="approved">
            Aprovados
          </option>

          <option value="pending">
            Pendentes
          </option>

          <option value="rejected">
            Recusados
          </option>

          <option value="refunded">
            Reembolsados
          </option>
        </select>
      </div>

      <div className="super-admin-table-wrapper">
        <table className="super-admin-table">
          <thead>
            <tr>
              <th>Transação</th>
              <th>Estabelecimento</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Método</th>
              <th>Data</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>
                  <strong>{payment.id}</strong>
                </td>

                <td>
                  {payment.estabelecimento}
                </td>

                <td>{payment.descricao}</td>

                <td>
                  {formatCurrency(
                    payment.valor,
                  )}
                </td>

                <td>{payment.metodo}</td>
                <td>{payment.data}</td>

                <td>
                  <span
                    className={`super-admin-status super-admin-status--${payment.status}`}
                  >
                    {
                      PAYMENT_STATUS_LABELS[
                        payment.status
                      ]
                    }
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}