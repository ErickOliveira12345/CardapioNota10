import React, { useState } from "react";

import "../../styles/superAdminCommon.css";
import "../../styles/SettingsPage.css";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    nomePlataforma: "Cardápio Nota10",
    emailSuporte:
      "suporte@cardapionota10.com",
    telefoneSuporte: "",
    diasTolerancia: 3,
    bloquearInadimplente: true,
    enviarAvisoVencimento: true,
    permitirNovosCadastros: true,
    modoManutencao: false,
  });

  const [saved, setSaved] = useState(false);

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
          : value,
    }));

    setSaved(false);
  }

  function handleSubmit(event) {
    event.preventDefault();

    console.log(
      "Configurações salvas:",
      settings,
    );

    setSaved(true);
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
            Configure regras gerais, cobrança e
            atendimento da plataforma.
          </p>
        </div>
      </header>

      <form
        className="super-admin-settings"
        onSubmit={handleSubmit}
      >
        <section className="super-admin-settings__section">
          <div>
            <h2>Informações gerais</h2>

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
              />
            </label>

            <label>
              E-mail de suporte

              <input
                type="email"
                name="emailSuporte"
                value={settings.emailSuporte}
                onChange={handleChange}
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
              />
            </label>
          </div>
        </section>

        <section className="super-admin-settings__section">
          <div>
            <h2>Cobrança</h2>

            <p>
              Regras aplicadas às assinaturas.
            </p>
          </div>

          <div className="super-admin-settings__fields">
            <label>
              Dias de tolerância

              <input
                type="number"
                min="0"
                name="diasTolerancia"
                value={
                  settings.diasTolerancia
                }
                onChange={handleChange}
              />
            </label>

            <label className="super-admin-switch">
              <input
                type="checkbox"
                name="bloquearInadimplente"
                checked={
                  settings.bloquearInadimplente
                }
                onChange={handleChange}
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
                  settings.enviarAvisoVencimento
                }
                onChange={handleChange}
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
            <h2>Controle da plataforma</h2>

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
                  settings.permitirNovosCadastros
                }
                onChange={handleChange}
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
                  settings.modoManutencao
                }
                onChange={handleChange}
              />

              <span>
                Ativar modo de manutenção
              </span>
            </label>
          </div>
        </section>

        <div className="super-admin-settings__footer">
          {saved && (
            <span>
              Configurações salvas com
              sucesso.
            </span>
          )}

          <button
            type="submit"
            className="super-admin-button"
          >
            Salvar configurações
          </button>
        </div>
      </form>
    </section>
  );
}