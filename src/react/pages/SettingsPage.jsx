import React, {
  useEffect,
  useState,
} from "react";

import {
  observeEstablishmentSettings,
  saveEstablishmentSettings,
} from "../services/settingsService.js";

import {
  showToast,
} from "../services/toast.js";

import "../styles/SettingsPage.css";

const INITIAL_FORM = {
  nomeEstabelecimento: "",
  telefone: "",
  emailContato: "",
  endereco: "",

  nomeExibicao: "",
  corPrincipal: "#f97316",
  logoUrl: "",

  aceitarPedidos: true,
  permitirChamados: true,
  tempoMedioPreparo: 30,
  mensagemPedido: "",

  exigirConfirmacaoCancelamento: true,
  permitirEdicaoPedido: true,
};

export default function SettingsPage({
  establishmentId,
}) {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!establishmentId) {
      setLoading(false);
      setError(
        "Estabelecimento não identificado.",
      );

      return undefined;
    }

    setLoading(true);
    setError("");

    const unsubscribe =
      observeEstablishmentSettings(
        establishmentId,

        (settings) => {
          setForm((currentForm) => ({
            ...currentForm,
            ...settings,
          }));

          setLoading(false);
        },

        (loadError) => {
          console.error(
            "Erro ao carregar configurações:",
            loadError,
          );

          setError(
            loadError?.message ||
              "Não foi possível carregar as configurações.",
          );

          setLoading(false);
        },
      );

    return () => {
      if (
        typeof unsubscribe === "function"
      ) {
        unsubscribe();
      }
    };
  }, [establishmentId]);

  function handleInputChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((currentForm) => ({
      ...currentForm,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!establishmentId) {
      setError(
        "Estabelecimento não identificado.",
      );

      return;
    }

    if (!form.nomeEstabelecimento.trim()) {
      setError(
        "Informe o nome do estabelecimento.",
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      await saveEstablishmentSettings({
        establishmentId,
        settings: {
          ...form,

          tempoMedioPreparo: Number(
            form.tempoMedioPreparo,
          ),
        },
      });

      showToast(
        "Configurações salvas com sucesso.",
        "success",
        4000,
      );
    } catch (saveError) {
      console.error(
        "Erro ao salvar configurações:",
        saveError,
      );

      setError(
        saveError?.message ||
          "Não foi possível salvar as configurações.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-page__loading">
        Carregando configurações...
      </div>
    );
  }

  return (
    <section className="settings-page">
      <header className="settings-page__header">
        <div>
          <span className="settings-page__eyebrow">
            Personalização do sistema
          </span>

          <h1>Configurações</h1>

          <p>
            Atualize os dados, a aparência e o
            funcionamento do estabelecimento.
          </p>
        </div>
      </header>

      {error && (
        <div className="settings-page__alert">
          {error}
        </div>
      )}

      <form
        className="settings-page__form"
        onSubmit={handleSubmit}
      >
        <section className="settings-card">
          <header className="settings-card__header">
            <div>
              <h2>
                Dados do estabelecimento
              </h2>

              <p>
                Informações principais exibidas
                no sistema.
              </p>
            </div>

            <span>🏪</span>
          </header>

          <div className="settings-form-grid">
            <label>
              <span>
                Nome do estabelecimento
              </span>

              <input
                type="text"
                name="nomeEstabelecimento"
                value={
                  form.nomeEstabelecimento
                }
                onChange={
                  handleInputChange
                }
                disabled={saving}
              />
            </label>

            <label>
              <span>Nome de exibição</span>

              <input
                type="text"
                name="nomeExibicao"
                value={form.nomeExibicao}
                onChange={
                  handleInputChange
                }
                disabled={saving}
              />
            </label>

            <label>
              <span>Telefone</span>

              <input
                type="tel"
                name="telefone"
                value={form.telefone}
                onChange={
                  handleInputChange
                }
                disabled={saving}
              />
            </label>

            <label>
              <span>E-mail de contato</span>

              <input
                type="email"
                name="emailContato"
                value={form.emailContato}
                onChange={
                  handleInputChange
                }
                disabled={saving}
              />
            </label>

            <label className="settings-form-grid__full">
              <span>Endereço</span>

              <input
                type="text"
                name="endereco"
                value={form.endereco}
                onChange={
                  handleInputChange
                }
                disabled={saving}
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <header className="settings-card__header">
            <div>
              <h2>Aparência</h2>

              <p>
                Personalize a identidade visual
                do cardápio.
              </p>
            </div>

            <span>🎨</span>
          </header>

          <div className="settings-form-grid">
            <label>
              <span>Cor principal</span>

              <input
                type="color"
                name="corPrincipal"
                value={form.corPrincipal}
                onChange={
                  handleInputChange
                }
                disabled={saving}
              />
            </label>

            <label>
              <span>URL do logotipo</span>

              <input
                type="url"
                name="logoUrl"
                value={form.logoUrl}
                onChange={
                  handleInputChange
                }
                disabled={saving}
                placeholder="https://..."
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <header className="settings-card__header">
            <div>
              <h2>
                Atendimento e pedidos
              </h2>

              <p>
                Defina o comportamento operacional
                do cardápio.
              </p>
            </div>

            <span>🧾</span>
          </header>

          <div className="settings-options">
            <label className="settings-option">
              <div>
                <strong>
                  Aceitar pedidos
                </strong>

                <span>
                  Permite novos pedidos pelo
                  cardápio.
                </span>
              </div>

              <input
                type="checkbox"
                name="aceitarPedidos"
                checked={
                  form.aceitarPedidos
                }
                onChange={
                  handleInputChange
                }
                disabled={saving}
              />
            </label>

            <label className="settings-option">
              <div>
                <strong>
                  Permitir chamados
                </strong>

                <span>
                  Permite que clientes chamem
                  atendimento.
                </span>
              </div>

              <input
                type="checkbox"
                name="permitirChamados"
                checked={
                  form.permitirChamados
                }
                onChange={
                  handleInputChange
                }
                disabled={saving}
              />
            </label>

            <label className="settings-option">
              <div>
                <strong>
                  Permitir edição de pedido
                </strong>

                <span>
                  Permite alterações antes do
                  preparo.
                </span>
              </div>

              <input
                type="checkbox"
                name="permitirEdicaoPedido"
                checked={
                  form.permitirEdicaoPedido
                }
                onChange={
                  handleInputChange
                }
                disabled={saving}
              />
            </label>
          </div>

          <div className="settings-form-grid">
            <label>
              <span>
                Tempo médio de preparo
              </span>

              <input
                type="number"
                min="1"
                name="tempoMedioPreparo"
                value={
                  form.tempoMedioPreparo
                }
                onChange={
                  handleInputChange
                }
                disabled={saving}
              />
            </label>

            <label className="settings-form-grid__full">
              <span>
                Mensagem após o pedido
              </span>

              <textarea
                name="mensagemPedido"
                value={form.mensagemPedido}
                onChange={
                  handleInputChange
                }
                disabled={saving}
                rows="4"
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <header className="settings-card__header">
            <div>
              <h2>Segurança</h2>

              <p>
                Defina confirmações para ações
                importantes.
              </p>
            </div>

            <span>🔐</span>
          </header>

          <div className="settings-options">
            <label className="settings-option">
              <div>
                <strong>
                  Confirmar cancelamentos
                </strong>

                <span>
                  Exige confirmação antes de
                  cancelar pedidos.
                </span>
              </div>

              <input
                type="checkbox"
                name="exigirConfirmacaoCancelamento"
                checked={
                  form.exigirConfirmacaoCancelamento
                }
                onChange={
                  handleInputChange
                }
                disabled={saving}
              />
            </label>
          </div>
        </section>

        <div className="settings-page__actions">
          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Salvando..."
              : "Salvar configurações"}
          </button>
        </div>
      </form>
    </section>
  );
}