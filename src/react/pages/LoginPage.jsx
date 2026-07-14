import React, { useState } from "react";

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

      showToast(
        "Login realizado com sucesso!",
        "success",
      );

      if (
        resultado.perfil?.status ===
        "onboarding"
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

            <input
              type="password"
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