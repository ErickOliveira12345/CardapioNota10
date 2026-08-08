import React, {
  useEffect,
  useState,
} from "react";

export function EditEstablishmentModal({
  establishment,
  updating,
  onClose,
  onSubmit,
}) {
  const [form, setForm] =
    useState(null);

  useEffect(() => {
    if (!establishment) {
      setForm(null);
      return;
    }

    setForm({
      nome:
        establishment.nome || "",

      email:
        establishment.email || "",

      telefone:
        establishment.telefone || "",

      responsavelNome:
        establishment.responsavel
          ?.nome || "",

      endereco: {
        cep:
          establishment.endereco
            ?.cep || "",

        rua:
          establishment.endereco
            ?.rua || "",

        numero:
          establishment.endereco
            ?.numero || "",

        complemento:
          establishment.endereco
            ?.complemento || "",

        bairro:
          establishment.endereco
            ?.bairro || "",

        cidade:
          establishment.endereco
            ?.cidade || "",

        estado:
          establishment.endereco
            ?.estado || "",
      },
    });
  }, [establishment]);

  if (
    !establishment ||
    !form
  ) {
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

    await onSubmit(
      establishment,
      form,
    );
  }

  return (
    <div className="super-admin-modal-overlay">
      <div className="super-admin-modal super-admin-modal--large">
        <header className="super-admin-modal__header">
          <div>
            <span>
              Gestão do estabelecimento
            </span>

            <h2>
              Editar estabelecimento
            </h2>
          </div>

          <button
            type="button"
            disabled={updating}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="super-admin-form-grid">
            <label>
              <span>
                Nome
              </span>

              <input
                value={form.nome}
                disabled={updating}
                onChange={(event) =>
                  updateField(
                    "nome",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>
                Responsável
              </span>

              <input
                value={
                  form.responsavelNome
                }
                disabled={updating}
                onChange={(event) =>
                  updateField(
                    "responsavelNome",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>E-mail</span>

              <input
                type="email"
                value={form.email}
                disabled={updating}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Telefone</span>

              <input
                value={form.telefone}
                disabled={updating}
                onChange={(event) =>
                  updateField(
                    "telefone",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>CEP</span>

              <input
                value={form.endereco.cep}
                disabled={updating}
                onChange={(event) =>
                  updateAddress(
                    "cep",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Rua</span>

              <input
                value={form.endereco.rua}
                disabled={updating}
                onChange={(event) =>
                  updateAddress(
                    "rua",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Número</span>

              <input
                value={
                  form.endereco.numero
                }
                disabled={updating}
                onChange={(event) =>
                  updateAddress(
                    "numero",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Bairro</span>

              <input
                value={
                  form.endereco.bairro
                }
                disabled={updating}
                onChange={(event) =>
                  updateAddress(
                    "bairro",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Cidade</span>

              <input
                value={
                  form.endereco.cidade
                }
                disabled={updating}
                onChange={(event) =>
                  updateAddress(
                    "cidade",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Estado</span>

              <input
                maxLength="2"
                value={
                  form.endereco.estado
                }
                disabled={updating}
                onChange={(event) =>
                  updateAddress(
                    "estado",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <footer className="super-admin-modal__actions">
            <button
              type="button"
              disabled={updating}
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="super-admin-modal__primary"
              disabled={updating}
            >
              {updating
                ? "Salvando..."
                : "Salvar alterações"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}