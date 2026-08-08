import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_PLATFORM_SETTINGS,
  getPlatformSettings,
} from "../services/platformSettingsService.js";

const PlatformSettingsContext =
  createContext(null);

export function PlatformSettingsProvider({
  children,
}) {
  const [
    settings,
    setSettings,
  ] = useState(
    DEFAULT_PLATFORM_SETTINGS,
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function reloadSettings() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getPlatformSettings();

      setSettings(data);
    } catch (loadError) {
      console.error(
        "Erro ao carregar configurações da plataforma:",
        loadError,
      );

      setError(
        loadError?.message ||
          "Não foi possível carregar as configurações da plataforma.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadSettings();
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      reloadSettings,
    }),
    [
      settings,
      loading,
      error,
    ],
  );

  return (
    <PlatformSettingsContext.Provider
      value={value}
    >
      {children}
    </PlatformSettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  const context =
    useContext(
      PlatformSettingsContext,
    );

  if (!context) {
    throw new Error(
      "usePlatformSettings deve ser usado dentro de PlatformSettingsProvider.",
    );
  }

  return context;
}