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
  getDriverByUid,
} from "../services/driverService.js";

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
  const [driverProfile, setDriverProfile] = useState(null);
  const [accountType, setAccountType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] =
    useState(false);
  const [authError, setAuthError] =
    useState(null);

  async function carregarPerfil(uid) {
    if (!uid) {
      setProfile(null);
      setDriverProfile(null);
      setAccountType(null);
      return null;
    }

    try {
      setProfileLoading(true);
      setAuthError(null);
      /*
      * 1. Primeiro procura uma conta
      * administrativa / estabelecimento.
      */
      const userProfile =
        await buscarPerfilUsuario(
          uid,
        );

      if (userProfile) {
        setProfile(
          userProfile,
        );
        setDriverProfile(
          null,
        );

        const userRole =
          userProfile?.role ||
          null;

        if (
          userRole ===
          USER_ROLES.SUPER_ADMIN
        ) {
          setAccountType(
            "superAdmin",
          );
        } else {
          setAccountType(
            "establishment",
          );
        }
        return userProfile;
      }
      /*
      * 2. Se não existir perfil normal,
      * procura cadastro de entregador.
      */
      const driver =
        await getDriverByUid(
          uid,
        );

      if (driver) {
        setProfile(null);
        setDriverProfile(
          driver,
        );

        setAccountType(
          "driver",
        );
        return driver;
      }

      /*
      * Existe autenticação, mas não
      * encontramos nenhum perfil.
      */
      setProfile(null);
      setDriverProfile(null);
      setAccountType(null);

      return null;
    } catch (error) {
      console.error(
        "Erro ao carregar perfil do usuário:",
        error,
      );

      setProfile(null);
      setDriverProfile(null);
      setAccountType(null);

      setAuthError(
        "Não foi possível carregar o perfil do usuário.",
      );

      throw error;
    } finally {
      setProfileLoading(false);
    }
  }

  async function refreshProfile() {
    if (
      !user?.uid ||
      user.isAnonymous
    ) {
      setProfile(null);
      setDriverProfile(null);
      setAccountType(null);

      return null;
    }

    return carregarPerfil(
      user.uid,
    );
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
              setDriverProfile(null);
              setAccountType(null);
              return;
            }

            const userProfile =
              await carregarPerfil(
                authenticatedUser.uid,
              );
            } catch (error) {
              console.error(
                "Erro ao carregar autenticação:",
                error,
              );

            if (mounted) {
              setProfile(null);
              setDriverProfile(null);
              setAccountType(null);

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

    const isDriver = accountType === "driver";

    const isEstablishmentUser = accountType === "establishment";

    const isSuperAdminAccount = accountType === "superAdmin";  

    const role =
      profile?.role || null;

    const status =
      profile?.status || null;

    const establishmentId =
      profile?.estabelecimentoId || null;

    const permissions =
      ROLE_PERMISSIONS[role] || [];

    const isSuperAdmin = accountType === "superAdmin" ||
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
      isEstablishmentUser &&
      !isSuperAdmin &&
      (
        status ===
          USER_STATUS.ONBOARDING ||
        profile?.onboardingCompleto ===
          false ||
        !establishmentId
      );

    const isDriverApproved =
      isDriver &&
      driverProfile?.status ===
        "approved";

    const isDriverPending =
      isDriver &&
      driverProfile?.status ===
        "pending";

    const isDriverBlocked =
      isDriver &&
      driverProfile?.status ===
        "blocked";

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
      driverProfile,

      accountType,

      isDriverApproved,
      isDriverPending,
      isDriverBlocked,

      loading,
      profileLoading,
      authError,

      role,
      status,
      permissions,
      establishmentId,

      isAnonymous,
      isAuthenticated,

      isDriver,
      isEstablishmentUser,
  
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
    driverProfile,
    accountType,
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