import React, {
  useState,
} from "react";

import {
  criarEstruturaInicialEstabelecimento,
} from "../services/establishmentService.js";

import {
  showToast,
} from "../services/toast.js";

const INITIAL_FORM = {
  nomeResponsavel: "",
  cpf: "",

  nomeEstabelecimento: "",
  cnpj: "",
  email: "",
  telefone: "",

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

export function FirstAccessPage({
  onNavigate,
}) {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [submitting, setSubmitting] =
    useState(false);

  function updateField(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateAddress(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,

      endereco: {
        ...current.endereco,
        [name]: value,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);

      const result =
        await criarEstruturaInicialEstabelecimento(
          form,
        );

      console.log(
        "Estabelecimento criado:",
        result,
      );

      showToast(
        "Estabelecimento criado com sucesso!",
        "success",
        5000,
      );

      onNavigate("/admin");
    } catch (error) {
      console.error(
        "Erro no primeiro acesso:",
        error,
      );

      showToast(
        error.message ||
          "Não foi possível criar o estabelecimento.",
        "error",
        5000,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <header className="auth-card__header">
          <span
            className="auth-card__icon"
            aria-hidden="true"
          >
            🏪
          </span>

          <h1>Configure seu estabelecimento</h1>

          <p>
            Preencha os dados para iniciar seus
            30 dias gratuitos.
          </p>
        </header>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <h2>Responsável</h2>

          <label>
            Nome completo

            <input
              name="nomeResponsavel"
              value={form.nomeResponsavel}
              onChange={updateField}
              required
            />
          </label>

          <label>
            CPF

            <input
              name="cpf"
              value={form.cpf}
              onChange={updateField}
              inputMode="numeric"
              maxLength={14}
              required
            />
          </label>

          <h2>Estabelecimento</h2>

          <label>
            Nome do estabelecimento

            <input
              name="nomeEstabelecimento"
              value={form.nomeEstabelecimento}
              onChange={updateField}
              required
            />
          </label>

          <label>
            CNPJ opcional

            <input
              name="cnpj"
              value={form.cnpj}
              onChange={updateField}
              inputMode="numeric"
              maxLength={18}
            />
          </label>

          <label>
            E-mail comercial

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Telefone

            <input
              name="telefone"
              value={form.telefone}
              onChange={updateField}
              inputMode="tel"
              required
            />
          </label>

          <h2>Endereço</h2>

          <label>
            CEP

            <input
              name="cep"
              value={form.endereco.cep}
              onChange={updateAddress}
              inputMode="numeric"
              maxLength={9}
              required
            />
          </label>

          <label>
            Rua

            <input
              name="rua"
              value={form.endereco.rua}
              onChange={updateAddress}
              required
            />
          </label>

          <label>
            Número

            <input
              name="numero"
              value={form.endereco.numero}
              onChange={updateAddress}
              required
            />
          </label>

          <label>
            Complemento

            <input
              name="complemento"
              value={
                form.endereco.complemento
              }
              onChange={updateAddress}
            />
          </label>

          <label>
            Bairro

            <input
              name="bairro"
              value={form.endereco.bairro}
              onChange={updateAddress}
              required
            />
          </label>

          <label>
            Cidade

            <input
              name="cidade"
              value={form.endereco.cidade}
              onChange={updateAddress}
              required
            />
          </label>

          <label>
            Estado

            <input
              name="estado"
              value={form.endereco.estado}
              onChange={updateAddress}
              maxLength={2}
              placeholder="SP"
              required
            />
          </label>

          <button
            className="btn-finalizar"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Criando estabelecimento..."
              : "Criar estabelecimento"}
          </button>
        </form>
      </section>
    </main>
  );
}