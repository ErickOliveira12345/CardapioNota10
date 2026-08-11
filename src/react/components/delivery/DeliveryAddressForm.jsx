import React, {
  useState,
} from "react";

export function DeliveryAddressForm({
  value,
  onChange,
  disabled = false,
}) {
  const form = value || {
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    latitude: "",
    longitude: "",
  };

  const [
    locationLoading,
    setLocationLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  function updateField(
    name,
    fieldValue,
  ) {
    const nextForm = {
      ...form,
      [name]: fieldValue,
    };

    if (
      typeof onChange ===
      "function"
    ) {
      onChange(nextForm);
    }
  }

  function handleChange(event) {
    const {
      name,
      value: fieldValue,
    } = event.target;

    updateField(
      name,
      fieldValue,
    );
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError(
        "Seu navegador não oferece suporte à localização.",
      );

      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
        } = position.coords;

        const nextForm = {
          ...form,
          latitude,
          longitude,
        };

        if (
          typeof onChange ===
          "function"
        ) {
          onChange(nextForm);
        }

        setLocationLoading(false);
      },

      (locationError) => {
        console.error(
          "Erro ao obter localização:",
          locationError,
        );

        setLocationLoading(false);

        if (
          locationError.code ===
          locationError.PERMISSION_DENIED
        ) {
          setError(
            "Permissão de localização negada. Autorize o acesso no navegador.",
          );

          return;
        }

        if (
          locationError.code ===
          locationError.POSITION_UNAVAILABLE
        ) {
          setError(
            "Sua localização não está disponível no momento.",
          );

          return;
        }

        if (
          locationError.code ===
          locationError.TIMEOUT
        ) {
          setError(
            "A obtenção da localização demorou demais.",
          );

          return;
        }

        setError(
          "Não foi possível obter sua localização.",
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  const hasLocation =
    form.latitude !== "" &&
    form.longitude !== "" &&
    Number.isFinite(
      Number(form.latitude),
    ) &&
    Number.isFinite(
      Number(form.longitude),
    );

  return (
    <section className="delivery-address">
      <header className="delivery-address__header">
        <h3>
          Endereço de entrega
        </h3>

        <p>
          Informe o endereço ou use sua
          localização atual.
        </p>
      </header>

      {error && (
        <div className="delivery-address__error">
          {error}
        </div>
      )}

      <div className="delivery-address__grid">
        <label>
          <span>CEP</span>

          <input
            type="text"
            name="cep"
            value={form.cep}
            onChange={handleChange}
            disabled={disabled}
            inputMode="numeric"
          />
        </label>

        <label>
          <span>Número</span>

          <input
            type="text"
            name="numero"
            value={form.numero}
            onChange={handleChange}
            disabled={disabled}
          />
        </label>

        <label className="delivery-address__full">
          <span>Rua</span>

          <input
            type="text"
            name="rua"
            value={form.rua}
            onChange={handleChange}
            disabled={disabled}
          />
        </label>

        <label>
          <span>Complemento</span>

          <input
            type="text"
            name="complemento"
            value={form.complemento}
            onChange={handleChange}
            disabled={disabled}
          />
        </label>

        <label>
          <span>Bairro</span>

          <input
            type="text"
            name="bairro"
            value={form.bairro}
            onChange={handleChange}
            disabled={disabled}
          />
        </label>

        <label>
          <span>Cidade</span>

          <input
            type="text"
            name="cidade"
            value={form.cidade}
            onChange={handleChange}
            disabled={disabled}
          />
        </label>

        <label>
          <span>Estado</span>

          <input
            type="text"
            name="estado"
            value={form.estado}
            onChange={(event) =>
              updateField(
                "estado",
                event.target.value
                  .toUpperCase()
                  .slice(0, 2),
              )
            }
            disabled={disabled}
            maxLength={2}
          />
        </label>
      </div>

      <div className="delivery-address__location">
        <button
          type="button"
          onClick={
            handleUseCurrentLocation
          }
          disabled={
            disabled ||
            locationLoading
          }
        >
          {locationLoading
            ? "Obtendo localização..."
            : "📍 Usar minha localização atual"}
        </button>

        {hasLocation && (
          <small>
            Localização obtida com
            sucesso.
          </small>
        )}
      </div>
    </section>
  );
}