import React from "react";

export function EstablishmentDetailsModal({
  establishment,
  getPlanLabel,
  getStatusLabel,
  onClose,
  onEdit,
}) {
  if (!establishment) {
    return null;
  }

  const endereco =
    establishment.endereco || {};

  return (
    <div
      className="super-admin-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="super-admin-modal super-admin-modal--large"
        role="dialog"
        aria-modal="true"
      >
        <header className="super-admin-modal__header">
          <div>
            <span>
              Informações do estabelecimento
            </span>

            <h2>
              {establishment.nome}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="establishment-details-table-wrapper">
            <table className="establishment-details-table">
                <tbody>
                <tr>
                    <th>Estabelecimento</th>
                    <td>
                    {establishment.nome || "-"}
                    </td>
                </tr>

                <tr>
                    <th>Responsável</th>
                    <td>
                    {establishment.responsavel
                        ?.nome || "-"}
                    </td>
                </tr>

                <tr>
                    <th>E-mail</th>
                    <td>
                    {establishment.email || "-"}
                    </td>
                </tr>

                <tr>
                    <th>Telefone</th>
                    <td>
                    {establishment.telefone || "-"}
                    </td>
                </tr>

                <tr>
                    <th>Plano</th>
                    <td>
                    {getPlanLabel(
                        establishment.planoAtual,
                    )}
                    </td>
                </tr>

                <tr>
                    <th>Status</th>
                    <td>
                    <span
                        className={`super-admin-status super-admin-status--${establishment.status}`}
                    >
                        {getStatusLabel(
                        establishment.status,
                        )}
                    </span>
                    </td>
                </tr>

                <tr>
                    <th>Documento</th>
                    <td>
                    {establishment.documento
                        ?.numero || "-"}
                    </td>
                </tr>

                <tr>
                    <th>CEP</th>
                    <td>
                    {endereco.cep || "-"}
                    </td>
                </tr>

                <tr>
                    <th>Rua</th>
                    <td>
                    {endereco.rua || "-"}
                    </td>
                </tr>

                <tr>
                    <th>Número</th>
                    <td>
                    {endereco.numero || "-"}
                    </td>
                </tr>

                <tr>
                    <th>Complemento</th>
                    <td>
                    {endereco.complemento || "-"}
                    </td>
                </tr>

                <tr>
                    <th>Bairro</th>
                    <td>
                    {endereco.bairro || "-"}
                    </td>
                </tr>

                <tr>
                    <th>Cidade</th>
                    <td>
                    {endereco.cidade || "-"}
                    </td>
                </tr>

                <tr>
                    <th>Estado</th>
                    <td>
                    {endereco.estado || "-"}
                    </td>
                </tr>
                </tbody>
            </table>
        </div>

        <footer className="super-admin-modal__actions">
          <button
            type="button"
            onClick={onClose}
          >
            Fechar
          </button>

          <button
            type="button"
            className="super-admin-modal__primary"
            onClick={() =>
              onEdit(establishment)
            }
          >
            Editar
          </button>
        </footer>
      </div>
    </div>
  );
}