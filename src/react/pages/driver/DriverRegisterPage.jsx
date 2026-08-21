import React, {
  useState,
} from "react";

import {createDriverAccount} from "../../services/driverService.js";
import "../../styles/driver/driverRegister.css";

export default function DriverRegisterPage({
  onNavigate,
}) {
  const [
    form,
    setForm,
  ] = useState({
    nome: "",
    telefone: "",
    email: "",
    cpf: "",
    veiculoTipo: "moto",
    placa: "",
    senha: "",
    confirmarSenha: "",
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

    let normalizedValue =
      value;

    /*
     * CPF:
     * mantém somente números.
     */
    if (name === "cpf") {
      normalizedValue =
        value
          .replace(/\D/g, "")
          .slice(0, 11);
    }

    /*
     * Telefone:
     * mantém somente números.
     */
    if (
      name === "telefone"
    ) {
      normalizedValue =
        value
          .replace(/\D/g, "")
          .slice(0, 11);
    }

    /*
     * Placa:
     * deixa em maiúsculo.
     */
    if (name === "placa") {
      normalizedValue =
        value
          .toUpperCase()
          .replace(
            /[^A-Z0-9]/g,
            "",
          )
          .slice(0, 7);
    }

    setForm((current) => ({
      ...current,
      [name]:
        normalizedValue,
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

    const nome =
      String(
        form.nome || "",
      ).trim();

    const telefone =
      String(
        form.telefone || "",
      ).replace(/\D/g, "");

    const email =
      String(
        form.email || "",
      )
        .trim()
        .toLowerCase();

    const cpf =
      String(
        form.cpf || "",
      ).replace(/\D/g, "");

    const placa =
      String(
        form.placa || "",
      )
        .trim()
        .toUpperCase();

    if (!nome) {
      setError(
        "Informe seu nome completo.",
      );

      return;
    }

    if (
      telefone.length < 10
    ) {
      setError(
        "Informe um telefone válido.",
      );

      return;
    }

    if (!email) {
      setError(
        "Informe seu e-mail.",
      );

      return;
    }

    if (
      cpf.length !== 11
    ) {
      setError(
        "Informe um CPF válido.",
      );

      return;
    }

    /*
     * Moto e carro precisam
     * possuir placa.
     */
    if (
      [
        "moto",
        "carro",
      ].includes(
        form.veiculoTipo,
      ) &&
      !placa
    ) {
      setError(
        "Informe a placa do veículo.",
      );

      return;
    }

    if (
      String(
        form.senha || "",
      ).length < 6
    ) {
      setError(
        "A senha deve possuir pelo menos 6 caracteres.",
      );

      return;
    }

    if (
      form.senha !==
      form.confirmarSenha
    ) {
      setError(
        "As senhas não coincidem.",
      );

      return;
    }

    try {
      setIsSubmitting(true);

      const driverData = {
        nome,
        telefone,
        email,
        cpf,

        veiculo: {
          tipo:
            form.veiculoTipo,

          placa:
            form.veiculoTipo ===
            "bicicleta"
              ? ""
              : placa,
        },

        senha:
          form.senha,
      };

      await createDriverAccount(
            driverData,
        );

        onNavigate?.(
            "/entregador/login",
        );
        } catch (submitError) {
        console.error(
            "Erro ao cadastrar entregador:",
            submitError,
        );

        setError(
            submitError?.message ||
            "Não foi possível realizar o cadastro.",
        );
        } finally {
        setIsSubmitting(false);
        }
    }
  const vehicleNeedsPlate =
    form.veiculoTipo ===
      "moto" ||
    form.veiculoTipo ===
      "carro";

  return (
    <main className="driver-page">
      <section className="driver-register">
        <header className="driver-register__header">
          <div className="driver-register__icon">
            🛵
          </div>

          <div>
            <h1>
              Cadastro de entregador
            </h1>

            <p>
              Cardápio Nota10
            </p>
          </div>
        </header>

        <div className="driver-register__intro">
          <p>
            Cadastre-se para
            receber oportunidades
            de entrega dos
            estabelecimentos
            participantes da
            plataforma.
          </p>
        </div>

        {error && (
          <div
            className="driver-register__error"
            role="alert"
          >
            {error}
          </div>
        )}

        <form
          className="driver-register__form"
          onSubmit={
            handleSubmit
          }
        >
          <label>
            <span>
              Nome completo *
            </span>

            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={
                handleChange
              }
              disabled={
                isSubmitting
              }
              autoComplete="name"
              placeholder="Seu nome completo"
              required
            />
          </label>

          <label>
            <span>
              Telefone *
            </span>

            <input
              type="tel"
              name="telefone"
              value={
                form.telefone
              }
              onChange={
                handleChange
              }
              disabled={
                isSubmitting
              }
              inputMode="numeric"
              autoComplete="tel"
              placeholder="31999999999"
              required
            />
          </label>

          <label>
            <span>
              E-mail *
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
              CPF *
            </span>

            <input
              type="text"
              name="cpf"
              value={form.cpf}
              onChange={
                handleChange
              }
              disabled={
                isSubmitting
              }
              inputMode="numeric"
              autoComplete="off"
              maxLength={11}
              placeholder="00000000000"
              required
            />
          </label>

          <label>
            <span>
              Tipo de veículo *
            </span>

            <select
              name="veiculoTipo"
              value={
                form.veiculoTipo
              }
              onChange={
                handleChange
              }
              disabled={
                isSubmitting
              }
              required
            >
              <option value="moto">
                Moto
              </option>

              <option value="carro">
                Carro
              </option>

              <option value="bicicleta">
                Bicicleta
              </option>
            </select>
          </label>

          {vehicleNeedsPlate && (
            <label>
              <span>
                Placa *
              </span>

              <input
                type="text"
                name="placa"
                value={form.placa}
                onChange={
                  handleChange
                }
                disabled={
                  isSubmitting
                }
                maxLength={7}
                autoComplete="off"
                placeholder="ABC1D23"
                required
              />
            </label>
          )}

          <label>
            <span>
              Senha *
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
              autoComplete="new-password"
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </label>

          <label>
            <span>
              Confirmar senha *
            </span>

            <input
              type="password"
              name="confirmarSenha"
              value={
                form.confirmarSenha
              }
              onChange={
                handleChange
              }
              disabled={
                isSubmitting
              }
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          <button
            type="submit"
            className="driver-register__submit"
            disabled={
              isSubmitting
            }
          >
            {isSubmitting
              ? "Criando cadastro..."
              : "Criar cadastro"}
          </button>
        </form>

        <div className="driver-register__footer">
          <span>
            Já possui cadastro?
          </span>

          <button
            type="button"
            className="driver-register__login"
            disabled={
              isSubmitting
            }
            onClick={() =>
              onNavigate?.(
                "/entregador/login",
              )
            }
          >
            Entrar como entregador
          </button>
        </div>
      </section>
    </main>
  );
}