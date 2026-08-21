import React, {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../contexts/AuthContext.jsx";
import { sair } from "../services/authService.js";
import { showToast } from "../services/toast.js";

const MENU_ITEMS = [
  {
    label: "Dashboard",
    icon: "📊",
    path: "/super-admin",
  },
  {
    label: "Estabelecimentos",
    icon: "🏪",
    path: "/super-admin/estabelecimentos",
  },
  {
    label: "Usuários",
    icon: "👥",
    path: "/super-admin/usuarios",
  },
  {
    label: "Planos",
    icon: "💳",
    path: "/super-admin/planos",
  },
  {
    label: "Assinaturas",
    icon: "📑",
    path: "/super-admin/assinaturas",
  },
  {
    label: "Pagamentos",
    icon: "💰",
    path: "/super-admin/pagamentos",
  },
  {
    label: "Auditoria",
    icon: "📜",
    path: "/super-admin/auditoria",
  },
  {
    label: "Configurações",
    icon: "⚙️",
    path: "/super-admin/configuracoes",
  },
  {
    label: "Entregadores",
    icon: "🛵",
    path: "/super-admin/entregadores",
  },
];

function navigateTo(path) {
  window.history.pushState({}, "", path);

  window.dispatchEvent(
    new PopStateEvent("popstate"),
  );
}



export default function SuperAdminLayout({
  children,
}) {

  async function handleLogout() {
    try {
      await sair();

      showToast(
        "Sessão encerrada com sucesso.",
        "success"
      );

      navigateTo("/login");
    } catch (error) {
      console.error(error);

      showToast(
        "Erro ao sair da aplicação.",
        "error"
      );
    }
  }
  const { profile } = useAuth();

  const [currentPath, setCurrentPath] =
    useState(window.location.pathname);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(
        window.location.pathname,
      );

      setSidebarOpen(false);
    }

    window.addEventListener(
      "popstate",
      handlePopState,
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState,
      );
    };
  }, []);

  function handleNavigate(path) {
    navigateTo(path);
  }

  return (
    <div className="super-admin-layout">
      <aside
        className={
          sidebarOpen
            ? "super-admin-sidebar super-admin-sidebar--open"
            : "super-admin-sidebar"
        }
      >
        <div className="super-admin-brand">
          <span className="super-admin-brand__icon">
            🍽️
          </span>

          <div>
            <strong>
              Cardápio Nota10
            </strong>

            <small>
              Administração
            </small>
          </div>
        </div>

        <nav className="super-admin-menu">
          {MENU_ITEMS.map((item) => {
            const isActive =
              currentPath === item.path;

            return (
              <button
                key={item.path}
                type="button"
                className={
                  isActive
                    ? "super-admin-menu__item super-admin-menu__item--active"
                    : "super-admin-menu__item"
                }
                onClick={() =>
                  handleNavigate(item.path)
                }
              >
                <span>
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </button>
            );
          })}

        </nav>
        <div className="sidebar-footer">
            <div className="sidebar-user">
                <strong>{profile?.nome}</strong>

                <span>Super Administrador</span>
            </div>

            <button
                type="button"
                className="sidebar-logout"
                onClick={handleLogout}
            >
                🚪 Sair
            </button>
          </div>
        
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="super-admin-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <div className="super-admin-content">
        <header className="super-admin-header">
          <button
            type="button"
            className="super-admin-menu-button"
            onClick={() =>
              setSidebarOpen(
                (current) => !current,
              )
            }
          >
            ☰
          </button>
          

          <div className="super-admin-header__title">
            <h1>
              Painel administrativo
            </h1>

            <p>
              Gestão da plataforma
              Cardápio Nota10
            </p>
          </div>

          <div className="super-admin-user">
            <div className="super-admin-user__avatar">
              {profile?.nome
                ?.charAt(0)
                ?.toUpperCase() || "A"}
            </div>

            <div className="super-admin-user__info">
              <strong>
                {profile?.nome ||
                  "Superadministrador"}
              </strong>

              <small>
                {profile?.email || ""}
              </small>
            </div>
          </div>
        </header>

        <main className="super-admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}