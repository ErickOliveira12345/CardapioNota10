import React, { useState } from "react";

import logoCardapioNota10 from "../../img/logo-CardapioNota10.png";
import { PasswordInput } from "../components/PasswordInput.jsx";

import {
  entrar,
  recuperarSenha,
} from "../services/authService.js";

import {
  showToast,
} from "../services/toast.js";

export function LoginPage({
  onNavigate,
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] =
    useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (entrando) return;

    try {
      setEntrando(true);

      const resultado = await entrar({
        email,
        senha,
      });

      // ======================================================
      // VERIFICAÇÃO DO E-MAIL
      // Impede que usuários com e-mail ainda não confirmado
      // avancem para o primeiro acesso ou painel administrativo.
      // ======================================================
      if (!resultado?.emailVerificado) {
        showToast(
          "Seu e-mail ainda não foi verificado. Verifique seu e-mail para continuar.",
          "warning",
          5000,
        );

        // ======================================================
        // VERIFICAÇÃO DO E-MAIL
        // O usuário permanece autenticado porque a página de
        // verificação utiliza auth.currentUser para consultar
        // o status e permitir o reenvio do link.
        // ======================================================
        onNavigate("/verificar-email");
        return;
      }

      const perfil = resultado?.perfil;
      const role = perfil?.role;
      const status = perfil?.status;

      showToast(
        "Login realizado com sucesso!",
        "success",
      );

      if (role === "super_admin") {
        onNavigate("/super-admin");
        return;
      }

      if (
        status === "onboarding" ||
        perfil?.onboardingCompleto === false
      ) {
        onNavigate("/primeiro-acesso");
        return;
      }

      onNavigate("/admin");
    } catch (error) {
      console.error("Erro no login:", error);

      showToast(
        error.message,
        "error",
        5000,
      );
    } finally {
      setEntrando(false);
    }
  }

  async function handleRecuperarSenha() {
    try {
      await recuperarSenha(email);

      showToast(
        "E-mail de recuperação enviado.",
        "success",
        5000,
      );
    } catch (error) {
      showToast(
        error.message,
        "error",
        5000,
      );
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

          <h1>Entrar</h1>

          <p>
            Acesse o painel do seu estabelecimento.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            E-mail

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />
          </label>

          <label>
            Senha

            <PasswordInput
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
              autoComplete="current-password"
              required
            />
          </label>

          <button
            className="btn-finalizar"
            type="submit"
            disabled={entrando}
          >
            {entrando
              ? "Entrando..."
              : "Entrar"}
          </button>
        </form>

        <button
          className="auth-link-button"
          type="button"
          onClick={handleRecuperarSenha}
        >
          Esqueci minha senha
        </button>

        <p className="auth-card__footer">
          Ainda não possui conta?{" "}

          <button
            type="button"
            onClick={() =>
              onNavigate("/cadastro")
            }
          >
            Criar conta
          </button>
        </p>
      </section>
    </main>
  );
}