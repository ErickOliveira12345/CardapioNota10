import React from "react";



export function CustomerDeliveryForm({
  value,
  onChange,
  disabled = false,
}) {
  const form = value || {
    nome: "",
    telefone: "",
    email: "",
  };

  function updateField(
    field,
    fieldValue,
  ) {
    if (
      typeof onChange !==
      "function"
    ) {
      return;
    }

    onChange({
      ...form,
      [field]: fieldValue,
    });
  }

  function handleChange(event) {
    const {
      name,
      value: fieldValue,
    } = event.target;

    updateField(
      name,
      fieldValue,
    );
  }

  return (
    <section className="customer-delivery-form">
      <header>
        <h3>
          Seus dados
        </h3>

        <p>
          Informe seus dados para
          identificação do pedido.
        </p>
      </header>

      <div className="customer-delivery-form__fields">
        <label>
          <span>
            Nome :
          </span>

          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            disabled={disabled}
            autoComplete="name"
            placeholder="Seu nome"
          />
        </label>

        <label>
          <span>
            Telefone :
          </span>

          <input
            type="tel"
            name="telefone"
            value={form.telefone}
            onChange={handleChange}
            disabled={disabled}
            autoComplete="tel"
            placeholder="(00) 00000-0000"
          />
        </label>

        <label>
          <span>
            E-mail :
          </span>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={disabled}
            autoComplete="email"
            placeholder="cliente@email.com"
          />
        </label>
      </div>
    </section>
  );
}