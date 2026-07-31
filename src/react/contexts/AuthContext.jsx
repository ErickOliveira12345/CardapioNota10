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

import {
  USER_ROLES,
  USER_STATUS,
} from "../constants/roles.js";

import {
  ROLE_PERMISSIONS,
} from "../constants/rolePermissions.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] =
    useState(false);
  const [authError, setAuthError] =
    useState(null);

  async function carregarPerfil(uid) {
    if (!uid) {
      setProfile(null);
      return null;
    }

    try {
      setProfileLoading(true);
      setAuthError(null);

      const userProfile =
        await buscarPerfilUsuario(uid);

      setProfile(userProfile);

      return userProfile;
    } catch (error) {
      console.error(
        "Erro ao carregar perfil do usuário:",
        error,
      );

      setProfile(null);
      setAuthError(
        "Não foi possível carregar o perfil do usuário.",
      );

      throw error;
    } finally {
      setProfileLoading(false);
    }
  }

  async function refreshProfile() {
    if (!user?.uid || user.isAnonymous) {
      setProfile(null);
      return null;
    }

    return carregarPerfil(user.uid);
  }

  useEffect(() => {
    let mounted = true;

    const unsubscribe =
      observarAutenticacao(
        async (authenticatedUser) => {
          try {
            if (!mounted) {
              return;
            }

            setLoading(true);
            setAuthError(null);
            setUser(authenticatedUser);

            if (
              !authenticatedUser ||
              authenticatedUser.isAnonymous
            ) {
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
              setAuthError(
                "Não foi possível carregar os dados da conta.",
              );
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

      if (
        typeof unsubscribe === "function"
      ) {
        unsubscribe();
      }
    };
  }, []);

  const value = useMemo(() => {
    const isAnonymous =
      Boolean(user?.isAnonymous);

    const isAuthenticated =
      Boolean(user) && !isAnonymous;

    const role =
      profile?.role || null;

    const status =
      profile?.status || null;

    const establishmentId =
      profile?.estabelecimentoId || null;

    const permissions =
      ROLE_PERMISSIONS[role] || [];

    const isSuperAdmin =
      role === USER_ROLES.SUPER_ADMIN;

    const isSubscriber =
      role === USER_ROLES.SUBSCRIBER;

    const isManager =
      role === USER_ROLES.MANAGER;

    const isEmployee =
      role === USER_ROLES.EMPLOYEE;

    const isWaiter =
      role === USER_ROLES.WAITER;

    const isKitchen =
      role === USER_ROLES.KITCHEN;

    const isAdmin =
      isSuperAdmin ||
      isSubscriber ||
      isManager;

    const isActive =
      status === USER_STATUS.ACTIVE;

    const isBlocked =
      status === USER_STATUS.BLOCKED;

    const isPending =
      status === USER_STATUS.PENDING;

    const isOnboarding =
      isAuthenticated &&
      !isSuperAdmin &&
      (
        status ===
          USER_STATUS.ONBOARDING ||
        profile?.onboardingCompleto ===
          false ||
        !establishmentId
      );

    function hasPermission(
      permission,
    ) {
      if (
        !isAuthenticated ||
        !isActive ||
        !permission
      ) {
        return false;
      }

      return permissions.includes(
        permission,
      );
    }

    function hasAnyPermission(
      requiredPermissions = [],
    ) {
      if (
        !Array.isArray(
          requiredPermissions,
        ) ||
        requiredPermissions.length === 0
      ) {
        return false;
      }

      return requiredPermissions.some(
        (permission) =>
          hasPermission(permission),
      );
    }

    function hasAllPermissions(
      requiredPermissions = [],
    ) {
      if (
        !Array.isArray(
          requiredPermissions,
        ) ||
        requiredPermissions.length === 0
      ) {
        return false;
      }

      return requiredPermissions.every(
        (permission) =>
          hasPermission(permission),
      );
    }

    return {
      user,
      profile,

      loading,
      profileLoading,
      authError,

      role,
      status,
      permissions,
      establishmentId,

      isAnonymous,
      isAuthenticated,
      isActive,
      isBlocked,
      isPending,
      isOnboarding,

      isAdmin,
      isSuperAdmin,
      isSubscriber,
      isManager,
      isEmployee,
      isWaiter,
      isKitchen,

      hasPermission,
      hasAnyPermission,
      hasAllPermissions,

      refreshProfile,
    };
  }, [
    user,
    profile,
    loading,
    profileLoading,
    authError,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser utilizado dentro de AuthProvider.",
    );
  }
  

  return context;
}