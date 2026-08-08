import React, {
  useState,
} from "react";

const INITIAL_FORM = {
  nomeEstabelecimento: "",
  nomeResponsavel: "",
  email: "",
  telefone: "",
  cpf: "",
  cnpj: "",

  endereco: {
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  },
};

export function CreateEstablishmentModal({
  open,
  creating,
  onClose,
  onSubmit,
}) {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [error, setError] =
    useState("");

  if (!open) {
    return null;
  }

  function updateField(
    field,
    value,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateAddress(
    field,
    value,
  ) {
    setForm((current) => ({
      ...current,

      endereco: {
        ...current.endereco,
        [field]: value,
      },
    }));
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    setError("");

    if (
      !form.nomeEstabelecimento.trim()
    ) {
      setError(
        "Informe o nome do estabelecimento.",
      );

      return;
    }

    if (
      !form.nomeResponsavel.trim()
    ) {
      setError(
        "Informe o nome do responsável.",
      );

      return;
    }

    if (!form.email.trim()) {
      setError(
        "Informe o e-mail do responsável.",
      );

      return;
    }

    try {
      await onSubmit(form);

      setForm(INITIAL_FORM);
    } catch (submitError) {
      console.error(
        "Erro ao criar estabelecimento:",
        submitError,
      );

      setError(
        submitError?.message ||
          "Não foi possível criar o estabelecimento.",
      );
    }
  }

  function handleClose() {
    if (creating) {
      return;
    }

    setError("");
    onClose();
  }

  return (
    <div
      className="super-admin-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !creating
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="super-admin-modal super-admin-modal--large"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-establishment-title"
      >
        <header className="super-admin-modal__header">
          <div>
            <span>
              Cadastro administrativo
            </span>

            <h2 id="create-establishment-title">
              Novo estabelecimento
            </h2>

            <p>
              Cadastre o estabelecimento e
              defina o responsável principal.
            </p>
          </div>

          <button
            type="button"
            aria-label="Fechar"
            disabled={creating}
            onClick={handleClose}
          >
            ×
          </button>
        </header>

        {error && (
          <div className="super-admin-alert super-admin-alert--error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
        >
          <div className="super-admin-form-section">
            <h3>
              Estabelecimento
            </h3>

            <div className="super-admin-form-grid">
              <label>
                <span>
                  Nome do estabelecimento
                </span>

                <input
                  type="text"
                  value={
                    form.nomeEstabelecimento
                  }
                  disabled={creating}
                  onChange={(event) =>
                    updateField(
                      "nomeEstabelecimento",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Nome do responsável
                </span>

                <input
                  type="text"
                  value={
                    form.nomeResponsavel
                  }
                  disabled={creating}
                  onChange={(event) =>
                    updateField(
                      "nomeResponsavel",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  E-mail
                </span>

                <input
                  type="email"
                  value={form.email}
                  disabled={creating}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Telefone
                </span>

                <input
                  type="tel"
                  value={form.telefone}
                  disabled={creating}
                  onChange={(event) =>
                    updateField(
                      "telefone",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  CPF
                </span>

                <input
                  type="text"
                  value={form.cpf}
                  disabled={creating}
                  onChange={(event) =>
                    updateField(
                      "cpf",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  CNPJ
                </span>

                <input
                  type="text"
                  value={form.cnpj}
                  disabled={creating}
                  onChange={(event) =>
                    updateField(
                      "cnpj",
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          </div>

          <div className="super-admin-form-section">
            <h3>
              Endereço
            </h3>

            <div className="super-admin-form-grid">
              <label>
                <span>
                  CEP
                </span>

                <input
                  type="text"
                  value={form.endereco.cep}
                  disabled={creating}
                  onChange={(event) =>
                    updateAddress(
                      "cep",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="super-admin-form-grid__wide">
                <span>
                  Rua
                </span>

                <input
                  type="text"
                  value={form.endereco.rua}
                  disabled={creating}
                  onChange={(event) =>
                    updateAddress(
                      "rua",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Número
                </span>

                <input
                  type="text"
                  value={
                    form.endereco.numero
                  }
                  disabled={creating}
                  onChange={(event) =>
                    updateAddress(
                      "numero",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Complemento
                </span>

                <input
                  type="text"
                  value={
                    form.endereco
                      .complemento
                  }
                  disabled={creating}
                  onChange={(event) =>
                    updateAddress(
                      "complemento",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Bairro
                </span>

                <input
                  type="text"
                  value={
                    form.endereco.bairro
                  }
                  disabled={creating}
                  onChange={(event) =>
                    updateAddress(
                      "bairro",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Cidade
                </span>

                <input
                  type="text"
                  value={
                    form.endereco.cidade
                  }
                  disabled={creating}
                  onChange={(event) =>
                    updateAddress(
                      "cidade",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Estado
                </span>

                <input
                  type="text"
                  maxLength="2"
                  value={
                    form.endereco.estado
                  }
                  disabled={creating}
                  onChange={(event) =>
                    updateAddress(
                      "estado",
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          </div>

          <footer className="super-admin-modal__actions">
            <button
              type="button"
              disabled={creating}
              onClick={handleClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="super-admin-modal__primary"
              disabled={creating}
            >
              {creating
                ? "Criando..."
                : "Criar estabelecimento"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}