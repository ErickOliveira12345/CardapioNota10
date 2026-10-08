import React, { useState } from "react";
import logoCardapioNota10 from "../../img/logo-CardapioNota10.png";

import {
  atualizarStatusVerificacaoEmail,
  reenviarEmailVerificacao,
  sair,
} from "../services/authService.js";

import { showToast } from "../services/toast.js";

export default function VerifyEmailPage({ onNavigate }) {
  const [verificando, setVerificando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  // ======================================================
  // VERIFICAÇÃO DO E-MAIL
  // Atualiza os dados do usuário no Firebase Authentication
  // e verifica se o endereço de e-mail já foi confirmado.
  // ======================================================
  async function handleVerificarEmail() {
    if (verificando) return;

    try {
      setVerificando(true);

      const resultado =
        await atualizarStatusVerificacaoEmail();

      if (!resultado.verificado) {
        showToast(
          "Seu e-mail ainda não foi verificado. Abra o e-mail enviado pelo Cardápio Nota10 e clique no link de confirmação.",
          "warning",
          5000
        );

        return;
      }

      showToast(
        "E-mail verificado com sucesso!",
        "success",
        3000
      );

      // ======================================================
      // VERIFICAÇÃO DO E-MAIL
      // Somente após o Firebase confirmar emailVerified=true
      // o usuário pode prosseguir para o primeiro acesso.
      // ======================================================
      onNavigate?.("/primeiro-acesso");
    } catch (error) {
      console.error(
        "Erro ao verificar e-mail:",
        error
      );

      showToast(
        error?.message ||
          "Não foi possível verificar o e-mail.",
        "error",
        5000
      );
    } finally {
      setVerificando(false);
    }
  }

  // ======================================================
  // VERIFICAÇÃO DO E-MAIL
  // Solicita ao Firebase Authentication o reenvio do link
  // de verificação para o usuário autenticado.
  // ======================================================
  async function handleReenviarEmail() {
    if (reenviando) return;

    try {
      setReenviando(true);

      const resultado =
        await reenviarEmailVerificacao();

      if (resultado.verificado) {
        showToast(
          "Seu e-mail já está verificado.",
          "success",
          3000
        );

        return;
      }

      showToast(
        "E-mail de verificação reenviado.",
        "success",
        4000
      );
    } catch (error) {
      console.error(
        "Erro ao reenviar e-mail de verificação:",
        error
      );

      showToast(
        error?.message ||
          "Não foi possível reenviar o e-mail.",
        "error",
        5000
      );
    } finally {
      setReenviando(false);
    }
  }

  // ======================================================
  // VERIFICAÇÃO DO E-MAIL
  // Permite sair da conta caso o usuário não queira
  // concluir a verificação neste momento.
  // ======================================================
  async function handleSair() {
    try {
      await sair();
      onNavigate?.("/login");
    } catch (error) {
      console.error(
        "Erro ao sair da conta:",
        error
      );

      showToast(
        "Não foi possível sair da conta.",
        "error",
        4000
      );
    }
  }

  return (
    <div className="verify-email-page">
      <div className="verify-email-card">
        <div className="verify-email-logo-container">
            <img
            src={logoCardapioNota10}
            alt="Cardápio Nota10"
            className="verify-email-logo"
            />
        </div>
        

        <div className="verify-email-icon">
          📧
        </div>

        <h1>Verifique seu e-mail</h1>

        <p className="verify-email-description">
          Enviamos um link de verificação para o
          endereço de e-mail informado no cadastro.
        </p>

        <p className="verify-email-instructions">
          Abra seu e-mail, clique no link de
          confirmação e depois volte para esta página.
        </p>

        <button
          type="button"
          className="verify-email-primary-button"
          onClick={handleVerificarEmail}
          disabled={verificando}
        >
          {verificando
            ? "Verificando..."
            : "Já verifiquei meu e-mail"}
        </button>

        <button
          type="button"
          className="verify-email-secondary-button"
          onClick={handleReenviarEmail}
          disabled={reenviando}
        >
          {reenviando
            ? "Reenviando..."
            : "Reenviar e-mail"}
        </button>

        <button
          type="button"
          className="verify-email-logout-button"
          onClick={handleSair}
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}