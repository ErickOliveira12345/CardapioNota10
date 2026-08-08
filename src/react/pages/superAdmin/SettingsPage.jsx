import React, {
  useEffect,
  useState,
} from "react";

import {
  DEFAULT_PLATFORM_SETTINGS,
  getPlatformSettings,
  savePlatformSettings,
} from "../../services/platformSettingsService.js";

import {
  usePlatformSettings,
} from "../../contexts/PlatformSettingsContext.jsx";

import "../../styles/superAdminCommon.css";
import "../../styles/SettingsPage.css";

export default function SettingsPage() {

  const {
    reloadSettings,
  } = usePlatformSettings();
  
  const [settings, setSettings] =
    useState(
      DEFAULT_PLATFORM_SETTINGS,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

  

    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getPlatformSettings();

        if (!mounted) {
          return;
        }

        setSettings(data);
      } catch (loadError) {
        console.error(
          "Erro ao carregar configurações:",
          loadError,
        );

        if (mounted) {
          setError(
            loadError?.message ||
              "Não foi possível carregar as configurações da plataforma.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setSettings((current) => ({
      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));

    setSaved(false);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setSaved(false);
      setError("");

      await savePlatformSettings(
        settings,
      );

      await reloadSettings();

      setSaved(true);

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
      <div className="super-admin-loading">
        Carregando configurações...
      </div>
    );
  }

  return (
    <section className="super-admin-page">
      <header className="super-admin-page__header">
        <div>
          <span className="super-admin-page__eyebrow">
            Preferências da plataforma
          </span>

          <h1>Configurações</h1>

          <p>
            Configure regras gerais,
            cobrança e atendimento da
            plataforma.
          </p>
        </div>
      </header>

      {error && (
        <div className="super-admin-alert super-admin-alert--error">
          {error}
        </div>
      )}

      <form
        className="super-admin-settings"
        onSubmit={handleSubmit}
      >
        <section className="super-admin-settings__section">
          <div>
            <h2>
              Informações gerais
            </h2>

            <p>
              Dados básicos exibidos na
              plataforma.
            </p>
          </div>

          <div className="super-admin-settings__fields">
            <label>
              Nome da plataforma

              <input
                type="text"
                name="nomePlataforma"
                value={
                  settings.nomePlataforma
                }
                onChange={handleChange}
                disabled={saving}
              />
            </label>

            <label>
              E-mail de suporte

              <input
                type="email"
                name="emailSuporte"
                value={
                  settings.emailSuporte
                }
                onChange={handleChange}
                disabled={saving}
              />
            </label>

            <label>
              Telefone de suporte

              <input
                type="tel"
                name="telefoneSuporte"
                value={
                  settings.telefoneSuporte
                }
                onChange={handleChange}
                disabled={saving}
              />
            </label>
          </div>
        </section>

        <section className="super-admin-settings__section">
          <div>
            <h2>Cobrança</h2>

            <p>
              Regras aplicadas às
              assinaturas.
            </p>
          </div>

          <div className="super-admin-settings__fields">
            <label>
              Dias de tolerância

              <input
                type="number"
                min="0"
                max="30"
                name="diasTolerancia"
                value={
                  settings.diasTolerancia
                }
                onChange={handleChange}
                disabled={saving}
              />
            </label>

            <label className="super-admin-switch">
              <input
                type="checkbox"
                name="bloquearInadimplente"
                checked={
                  settings
                    .bloquearInadimplente
                }
                onChange={handleChange}
                disabled={saving}
              />

              <span>
                Bloquear estabelecimento
                inadimplente
              </span>
            </label>

            <label className="super-admin-switch">
              <input
                type="checkbox"
                name="enviarAvisoVencimento"
                checked={
                  settings
                    .enviarAvisoVencimento
                }
                onChange={handleChange}
                disabled={saving}
              />

              <span>
                Enviar aviso antes do
                vencimento
              </span>
            </label>
          </div>
        </section>

        <section className="super-admin-settings__section">
          <div>
            <h2>
              Controle da plataforma
            </h2>

            <p>
              Recursos gerais de acesso e
              manutenção.
            </p>
          </div>

          <div className="super-admin-settings__fields">
            <label className="super-admin-switch">
              <input
                type="checkbox"
                name="permitirNovosCadastros"
                checked={
                  settings
                    .permitirNovosCadastros
                }
                onChange={handleChange}
                disabled={saving}
              />

              <span>
                Permitir novos cadastros
              </span>
            </label>

            <label className="super-admin-switch">
              <input
                type="checkbox"
                name="modoManutencao"
                checked={
                  settings
                    .modoManutencao
                }
                onChange={handleChange}
                disabled={saving}
              />

              <span>
                Ativar modo de manutenção
              </span>
            </label>
          </div>
        </section>

        <div className="super-admin-settings__footer">
          {saved && (
            <span className="super-admin-settings__success">
              Configurações salvas com
              sucesso.
            </span>
          )}

          <button
            type="submit"
            className="super-admin-button"
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