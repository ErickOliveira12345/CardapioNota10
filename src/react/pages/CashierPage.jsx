import React,{
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  observePayments,
} from "../services/orders.js";

import {
  formatCurrency,
  formatDateTime,
} from "../services/formatters.js";

import {
  showToast,
} from "../services/toast.js";

const PAYMENT_LABELS = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  credito: "Crédito",
  debito: "Débito",
  voucher: "Voucher",
  outro: "Outro",
};

function isToday(timestamp) {
  if (!timestamp) {
    return false;
  }

  const date = new Date(timestamp);
  const today = new Date();

  return (
    date.getDate() ===
      today.getDate() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getFullYear() ===
      today.getFullYear()
  );
}

export default function CashierPage({
  establishmentId,
}) {
  const [payments, setPayments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!establishmentId) {
      setPayments([]);
      setLoading(false);
      return undefined;
    }

    const unsubscribe =
      observePayments(
        (items) => {
          setPayments(items);
          setLoading(false);
        },

        (error) => {
          console.error(error);

          showToast(
            "Não foi possível carregar os pagamentos.",
            "error",
            5000,
          );

          setLoading(false);
        },

        establishmentId,
      );

    return unsubscribe;
  }, [establishmentId]);

  const todayPayments =
    useMemo(
      () =>
        payments.filter(
          (payment) =>
            payment.status ===
              "pago" &&
            isToday(
              payment.criadoEm,
            ),
        ),
      [payments],
    );

  const summary = useMemo(() => {
    const initialSummary = {
      total: 0,
      quantidade: 0,
      ticketMedio: 0,

      pix: 0,
      dinheiro: 0,
      credito: 0,
      debito: 0,
      voucher: 0,
      outro: 0,
    };

    const result =
      todayPayments.reduce(
        (accumulator, payment) => {
          const value =
            Number(
              payment.totalFinal,
            ) || 0;

          accumulator.total += value;
          accumulator.quantidade += 1;

          const method =
            payment.formaPagamento ||
            "outro";

          if (
            Object.prototype
              .hasOwnProperty.call(
                accumulator,
                method,
              )
          ) {
            accumulator[method] +=
              value;
          } else {
            accumulator.outro +=
              value;
          }

          return accumulator;
        },
        initialSummary,
      );

    result.ticketMedio =
      result.quantidade > 0
        ? result.total /
          result.quantidade
        : 0;

    return result;
  }, [todayPayments]);

  if (loading) {
    return (
      <main className="admin-main cashier-page">
        <section className="cashier-loading">
          Carregando caixa...
        </section>
      </main>
    );
  }

  return (
    <main className="admin-main cashier-page">
      <section className="cashier-header">
        <div>
          <h1>Caixa</h1>

          <p>
            Acompanhe os recebimentos
            e o fechamento das
            comandas.
          </p>
        </div>

        <div className="cashier-header__status">
          <span />

          Atualização em tempo real
        </div>
      </section>

      <section className="cashier-summary-grid">
        <article className="cashier-summary-card cashier-summary-card--primary">
          <span>
            Total recebido hoje
          </span>

          <strong>
            {formatCurrency(
              summary.total,
            )}
          </strong>
        </article>

        <article className="cashier-summary-card">
          <span>
            Comandas fechadas
          </span>

          <strong>
            {summary.quantidade}
          </strong>
        </article>

        <article className="cashier-summary-card">
          <span>
            Ticket médio
          </span>

          <strong>
            {formatCurrency(
              summary.ticketMedio,
            )}
          </strong>
        </article>
      </section>

      <section className="cashier-payment-methods">
        <header>
          <div>
            <h2>
              Formas de pagamento
            </h2>

            <p>
              Valores recebidos hoje.
            </p>
          </div>
        </header>

        <div className="cashier-method-grid">
          <article>
            <span>PIX</span>

            <strong>
              {formatCurrency(
                summary.pix,
              )}
            </strong>
          </article>

          <article>
            <span>Dinheiro</span>

            <strong>
              {formatCurrency(
                summary.dinheiro,
              )}
            </strong>
          </article>

          <article>
            <span>Crédito</span>

            <strong>
              {formatCurrency(
                summary.credito,
              )}
            </strong>
          </article>

          <article>
            <span>Débito</span>

            <strong>
              {formatCurrency(
                summary.debito,
              )}
            </strong>
          </article>

          <article>
            <span>Voucher</span>

            <strong>
              {formatCurrency(
                summary.voucher,
              )}
            </strong>
          </article>

          <article>
            <span>Outros</span>

            <strong>
              {formatCurrency(
                summary.outro,
              )}
            </strong>
          </article>
        </div>
      </section>

      <section className="cashier-history">
        <header>
          <div>
            <h2>
              Últimos pagamentos
            </h2>

            <p>
              Comandas registradas
              no sistema.
            </p>
          </div>
        </header>

        {payments.length === 0 ? (
          <div className="cashier-empty">
            Nenhum pagamento
            registrado.
          </div>
        ) : (
          <div className="cashier-table-wrapper">
            <table className="cashier-table">
              <thead>
                <tr>
                  <th>Mesa</th>
                  <th>Pagamento</th>
                  <th>Pedidos</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {payments
                  .slice(0, 20)
                  .map(
                    (payment) => (
                      <tr
                        key={
                          payment.idPagamento
                        }
                      >
                        <td>
                          Mesa{" "}
                          {
                            payment.mesa
                          }
                        </td>

                        <td>
                          {PAYMENT_LABELS[
                            payment
                              .formaPagamento
                          ] ||
                            "Outro"}
                        </td>

                        <td>
                          {
                            payment
                              .quantidadePedidos
                          }
                        </td>

                        <td>
                          {payment.criadoEm
                            ? formatDateTime(
                                payment.criadoEm,
                              )
                            : "-"}
                        </td>

                        <td>
                          <span className="cashier-status cashier-status--paid">
                            Pago
                          </span>
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              payment.totalFinal,
                            )}
                          </strong>
                        </td>
                      </tr>
                    ),
                  )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}