import React, {
  useState,
} from "react";

import {
  loginDriver,
} from "../../services/driverService.js";

import "../../styles/driver/driverLogin.css";

export default function DriverLoginPage({
  onNavigate,
}) {
  const [
    form,
    setForm,
  ] = useState({
    email: "",
    senha: "",
  });

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");

    const email =
      String(
        form.email || "",
      )
        .trim()
        .toLowerCase();

    const senha =
      String(
        form.senha || "",
      );

    if (!email) {
      setError(
        "Informe seu e-mail.",
      );

      return;
    }

    if (!senha) {
      setError(
        "Informe sua senha.",
      );

      return;
    }

    try {
      setIsSubmitting(true);

      const driver =
        await loginDriver({
          email,
          senha,
        });

      console.log(
        "Entregador autenticado:",
        driver,
      );

      /*
       * Cadastro ainda aguardando
       * aprovação.
       */
      if (
        driver.status ===
        "pending"
      ) {
        onNavigate?.(
          "/entregador/aguardando-aprovacao",
        );

        return;
      }

      /*
       * Cadastro bloqueado.
       */
      if (
        driver.status ===
        "blocked"
      ) {
        setError(
          "Seu cadastro de entregador está bloqueado.",
        );

        return;
      }

      /*
       * Somente entregadores
       * aprovados acessam o painel.
       */
      if (
        driver.status !==
        "approved"
      ) {
        setError(
          "Seu cadastro ainda não está liberado para entregas.",
        );

        return;
      }

      onNavigate?.(
        "/entregador",
      );
    } catch (loginError) {
      console.error(
        "Erro no login do entregador:",
        loginError,
      );

      const errorCode =
        loginError?.code || "";

      if (
        errorCode ===
          "auth/invalid-credential" ||
        errorCode ===
          "auth/wrong-password" ||
        errorCode ===
          "auth/user-not-found"
      ) {
        setError(
          "E-mail ou senha inválidos.",
        );
      } else if (
        errorCode ===
        "auth/too-many-requests"
      ) {
        setError(
          "Muitas tentativas de login. Tente novamente mais tarde.",
        );
      } else {
        setError(
          loginError?.message ||
            "Não foi possível entrar.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="driver-login-page">
      <section className="driver-login">
        <header className="driver-login__header">
          <div className="driver-login__icon">
            🛵
          </div>

          <div>
            <h1>
              Área do entregador
            </h1>

            <p>
              Cardápio Nota10
            </p>
          </div>
        </header>

        <div className="driver-login__intro">
          <p>
            Entre com sua conta para
            visualizar entregas
            disponíveis e acompanhar
            suas corridas.
          </p>
        </div>

        {error && (
          <div
            className="driver-login__error"
            role="alert"
          >
            {error}
          </div>
        )}

        <form
          className="driver-login__form"
          onSubmit={
            handleSubmit
          }
        >
          <label>
            <span>
              E-mail
            </span>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={
                handleChange
              }
              disabled={
                isSubmitting
              }
              autoComplete="email"
              placeholder="seu@email.com"
              required
            />
          </label>

          <label>
            <span>
              Senha
            </span>

            <input
              type="password"
              name="senha"
              value={form.senha}
              onChange={
                handleChange
              }
              disabled={
                isSubmitting
              }
              autoComplete="current-password"
              placeholder="Sua senha"
              required
            />
          </label>

          <button
            type="submit"
            className="driver-login__submit"
            disabled={
              isSubmitting
            }
          >
            {isSubmitting
              ? "Entrando..."
              : "Entrar"}
          </button>
        </form>

        <div className="driver-login__footer">
          <span>
            Ainda não possui cadastro?
          </span>

          <button
            type="button"
            className="driver-login__register"
            disabled={
              isSubmitting
            }
            onClick={() =>
              onNavigate?.(
                "/entregador/cadastro",
              )
            }
          >
            Criar cadastro
          </button>
        </div>
      </section>
    </main>
  );
}