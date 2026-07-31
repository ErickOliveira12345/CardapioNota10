import React from "react";

import {
  useAuth,
} from "../../contexts/AuthContext.jsx";

import "../../styles/ProtectedRoute.css";

export default function ProtectedRoute({
  children,
  requiredRole = null,
  requiredPermission = null,
  allowOnboarding = false,
}) {
  const {
    loading,
    profileLoading,
    authError,

    role,

    isAuthenticated,
    isActive,
    isBlocked,
    isOnboarding,

    hasPermission,
  } = useAuth();

  if (loading || profileLoading) {
    return (
      <main className="access-page">
        <section className="access-card">
          <h1>Verificando acesso</h1>

          <p>
            Aguarde enquanto carregamos os
            dados da sua conta.
          </p>
        </section>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="access-page">
        <section className="access-card">
          <h1>Erro ao carregar conta</h1>

          <p>{authError}</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="access-page">
        <section className="access-card">
          <h1>Login necessário</h1>

          <p>
            Entre na sua conta para acessar
            esta página.
          </p>

          <button
            type="button"
            onClick={() => {
              window.history.pushState(
                {},
                "",
                "/login",
              );

              window.dispatchEvent(
                new PopStateEvent("popstate"),
              );
            }}
          >
            Ir para o login
          </button>
        </section>
      </main>
    );
  }

  if (isBlocked) {
    return (
      <main className="access-page">
        <section className="access-card">
          <h1>Conta bloqueada</h1>

          <p>
            Entre em contato com o suporte
            para verificar sua conta.
          </p>
        </section>
      </main>
    );
  }

  if (!isActive && !isOnboarding) {
    return (
      <main className="access-page">
        <section className="access-card">
          <h1>Conta indisponível</h1>

          <p>
            Sua conta ainda não está ativa.
          </p>
        </section>
      </main>
    );
  }

  if (
    isOnboarding &&
    !allowOnboarding
  ) {
    return (
      <main className="access-page">
        <section className="access-card">
          <h1>Cadastro incompleto</h1>

          <p>
            Finalize a configuração da sua
            conta antes de continuar.
          </p>
        </section>
      </main>
    );
  }

  if (
    requiredRole &&
    role !== requiredRole
  ) {
    return (
      <main className="access-page">
        <section className="access-card">
          <h1>Acesso negado</h1>

          <p>
            Seu usuário não possui acesso
            a esta página.
          </p>
        </section>
      </main>
    );
  }

  if (
    requiredPermission &&
    !hasPermission(
      requiredPermission,
    )
  ) {
    return (
      <main className="access-page">
        <section className="access-card">
          <h1>Permissão necessária</h1>

          <p>
            Você não possui permissão para
            acessar este recurso.
          </p>
        </section>
      </main>
    );
  }

  return children;
}