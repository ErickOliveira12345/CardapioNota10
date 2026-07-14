import React, { useState } from "react";

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
    senha: "",
    confirmarSenha: "",
  });

  const [enviando, setEnviando] =
    useState(false);

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setForm((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (enviando) return;

    try {
      setEnviando(true);

      await cadastrarProprietario(form);

      showToast(
        "Conta criada com sucesso!",
        "success",
        4000,
      );

      /*
       * Na próxima etapa criaremos essa tela
       * para completar os dados do restaurante.
       */
      onNavigate("/primeiro-acesso");
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
            Senha

            <input
              type="password"
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

            <input
              type="password"
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