import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  buscarPerfilUsuario,
  observarAutenticacao,
} from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregarPerfil(uid) {
    if (!uid) {
      setProfile(null);
      return null;
    }

    const userProfile =
      await buscarPerfilUsuario(uid);

    setProfile(userProfile);

    return userProfile;
  }

  async function refreshProfile() {
    if (!user?.uid) {
      setProfile(null);
      return null;
    }

    return carregarPerfil(user.uid);
  }

  useEffect(() => {
    let mounted = true;

    const unsubscribe = observarAutenticacao(
      async (authenticatedUser) => {
        try {
          if (!mounted) return;

          setUser(authenticatedUser);

          if (!authenticatedUser) {
            setProfile(null);
            return;
          }

          const userProfile =
            await buscarPerfilUsuario(
              authenticatedUser.uid,
            );

          if (mounted) {
            setProfile(userProfile);
          }
        } catch (error) {
          console.error(
            "Erro ao carregar autenticação:",
            error,
          );

          if (mounted) {
            setProfile(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      },
    );

    return () => {
      mounted = false;

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,

      isAuthenticated: Boolean(user),

      establishmentId:
        profile?.estabelecimentoId || null,

      isOnboarding:
        profile?.status === "onboarding" ||
        !profile?.estabelecimentoId,

      refreshProfile,
    }),
    [user, profile, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser utilizado dentro de AuthProvider.",
    );
  }

  return context;
}