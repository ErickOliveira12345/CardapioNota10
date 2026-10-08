import React, { useState } from "react";

import logoCardapioNota10 from "../../img/logo-CardapioNota10.png";
import { PasswordInput } from "../components/PasswordInput.jsx";

import {
  cadastrarProprietario,
} from "../services/authService.js";

import {
  showToast,
} from "../services/toast.js";

export function RegisterPage({
  onNavigate,
}) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    cpf: "",
    senha: "",
    confirmarSenha: "",
  });

  const [enviando, setEnviando] =
    useState(false);

  // ======================================================
  // VALIDAÇÃO DE CPF
  // Aplica a máscara 000.000.000-00 enquanto o usuário
  // digita o CPF no formulário de cadastro.
  // ======================================================
  function formatarCPF(valor) {
    const numeros = String(valor || "")
      .replace(/\D/g, "")
      .slice(0, 11);

    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  // ======================================================
  // VALIDAÇÃO DE CPF
  // Verifica os dígitos verificadores do CPF e rejeita
  // números incompletos ou sequências repetidas.
  // ======================================================
  function validarCPF(cpf) {
    const numeros = String(cpf || "")
      .replace(/\D/g, "");

    if (numeros.length !== 11) {
      return false;
    }

    if (/^(\d)\1{10}$/.test(numeros)) {
      return false;
    }

    let soma = 0;

    for (let i = 0; i < 9; i += 1) {
      soma +=
        Number(numeros[i]) *
        (10 - i);
    }

    let resto = (soma * 10) % 11;

    if (resto === 10) {
      resto = 0;
    }

    if (resto !== Number(numeros[9])) {
      return false;
    }

    soma = 0;

    for (let i = 0; i < 10; i += 1) {
      soma +=
        Number(numeros[i]) *
        (11 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10) {
      resto = 0;
    }

    return resto === Number(numeros[10]);
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;

    // ======================================================
    // VALIDAÇÃO DE CPF
    // Quando o campo alterado for CPF, aplica a máscara
    // antes de armazenar o valor no formulário.
    // ======================================================
    const valorFormatado =
      name === "cpf"
        ? formatarCPF(value)
        : value;

    setForm((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: valorFormatado,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (enviando) return;

    // ======================================================
    // VALIDAÇÃO DE CPF
    // Impede a criação da conta quando o CPF informado
    // não possuir dígitos verificadores válidos.
    // ======================================================
    if (!validarCPF(form.cpf)) {
      showToast(
        "Informe um CPF válido.",
        "warning",
        5000,
      );

      return;
    }

    try {
      setEnviando(true);

      await cadastrarProprietario(form);

      showToast(
        "Conta criada com sucesso!",
        "success",
        4000,
      );

      // ======================================================
      // VERIFICAÇÃO DO E-MAIL
      // Após criar a conta, direciona o usuário para a página
      // de verificação em vez de liberar o primeiro acesso.
      // ======================================================
      onNavigate("/verificar-email");

    } catch (error) {
      console.error(
        "Erro no cadastro:",
        error,
      );

      showToast(
        error.message,
        "error",
        5000,
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">

      <section className="navigation-header">
        <div className="navigation-header__content">
          <button
            type="button"
            className="navigation-back-button"
            onClick={() => onNavigate?.("/")}
          >
            <span>←</span>
            <span>Voltar</span>
          </button>

          <img
            className="logoCardapioNota10"
            src={logoCardapioNota10}
            alt="Logo do Cardápio Nota10"
          />
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-card__header">
          <span
            className="auth-card__icon"
            aria-hidden="true"
          >
            🍽️
          </span>

          <h1>Criar conta</h1>

          <p>
            Cadastre-se para configurar seu
            estabelecimento.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            Nome do responsável

            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={atualizarCampo}
              autoComplete="name"
              required
            />
          </label>

          <label>
            E-mail

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={atualizarCampo}
              autoComplete="email"
              required
            />
          </label>

          <label>
            CPF

            <input
              type="text"
              name="cpf"
              value={form.cpf}
              onChange={atualizarCampo}
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              maxLength={14}
              required
            />
          </label>

          <label>
            Senha

            <PasswordInput
              name="senha"
              value={form.senha}
              onChange={atualizarCampo}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          <label>
            Confirmar senha

            <PasswordInput
              name="confirmarSenha"
              value={form.confirmarSenha}
              onChange={atualizarCampo}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          <button
            className="btn-finalizar"
            type="submit"
            disabled={enviando}
          >
            {enviando
              ? "Criando conta..."
              : "Criar conta"}
          </button>
        </form>

        <p className="auth-card__footer">
          Já possui uma conta?{" "}

          <button
            type="button"
            onClick={() =>
              onNavigate("/login")
            }
          >
            Entrar
          </button>
        </p>
      </section>
    </main>
  );
}