
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({
  value,
  onChange,
  name,
  placeholder,
  autoComplete,
  minLength,
  required = false,
  disabled = false,
}) {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <div className="password-input">
      <input
        type={mostrarSenha ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        disabled={disabled}
      />

      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setMostrarSenha((atual) => !atual)}
        aria-label={
          mostrarSenha ? "Ocultar senha" : "Mostrar senha"
        }
        aria-pressed={mostrarSenha}
        disabled={disabled}
      >
        {mostrarSenha ? (
          <EyeOff size={20} />
        ) : (
          <Eye size={20} />
        )}
      </button>
    </div>
  );
}
