import React, { useState } from "react";

import {
  sair,
} from "../services/authService.js";

import {
  showToast,
} from "../services/toast.js";

import {
  NotificationCenter,
} from "./NotificationCenter.jsx";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "📊",
    path: "/admin",
  },
  {
    id: "caixa",
    label: "Caixa",
    icon: "💰",
    path: "/admin/caixa",
  },
  {
    id: "pedidos",
    label: "Pedidos",
    icon: "📦",
    path: "/admin/pedidos",
  },
  {
    id: "cozinha",
    label: "Cozinha",
    icon: "🍳",
    path: "/admin/cozinha",
  },
  {
    id: "produtos",
    label: "Produtos",
    icon: "🍔",
    path: "/admin/produtos",
  },
  {
    id: "categorias",
    label: "Categorias",
    icon: "📂",
    path: "/admin/categorias",
  },
  {
    id: "mesas",
    label: "Mesas",
    icon: "🪑",
    path: "/admin/mesas",
  },
  {
    id: "mapa-mesas",
    label: "Mapa de mesas",
    icon: "🗺️",
    path: "/admin/mapa-mesas",
  },
  {
    id: "funcionarios",
    label: "Funcionários",
    icon: "👥",
    path: "/admin/funcionarios",
    disabled: true,
  },
  {
    id: "assinatura",
    label: "Assinatura",
    icon: "💳",
    path: "/admin/assinatura",
    disabled: true,
  },
  {
    id: "configuracoes",
    label: "Configurações",
    icon: "⚙️",
    path: "/admin/configuracoes",
    disabled: true,
  },
];

export function AdminLayout({
  children,
  activePage,
  onNavigate,
  orders = [],
}) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  async function handleLogout() {
    try {
      await sair();

      showToast(
        "Sessão encerrada com sucesso.",
        "success",
      );

      onNavigate("/login");
    } catch (error) {
      console.error(
        "Erro ao sair:",
        error,
      );

      showToast(
        "Não foi possível encerrar a sessão.",
        "error",
      );
    }
  }

  function handleNavigate(item) {
    if (item.disabled) {
      showToast(
        "Essa funcionalidade será criada em breve.",
        "info",
      );

      return;
    }

    setMenuOpen(false);
    onNavigate(item.path);
  }

  return (
    <div className="admin-shell">
      <aside
        className={
          `admin-sidebar ${
            menuOpen
              ? "admin-sidebar--open"
              : ""
          }`
        }
      >
        <div className="admin-sidebar__brand">
          <span
            className="admin-sidebar__logo"
            aria-hidden="true"
          >
            🍽️
          </span>

          <div>
            <strong>Cardápio Nota10</strong>
            <small>Painel do estabelecimento</small>
          </div>

          <NotificationCenter
            orders={orders}
            onNavigate={onNavigate}
          />
        </div>

        <nav
          className="admin-sidebar__nav"
          aria-label="Menu administrativo"
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                `admin-nav-item ${
                  activePage === item.id
                    ? "admin-nav-item--active"
                    : ""
                } ${
                  item.disabled
                    ? "admin-nav-item--disabled"
                    : ""
                }`
              }
              onClick={() =>
                handleNavigate(item)
              }
            >
              <span
                className="admin-nav-item__icon"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span>{item.label}</span>

              {item.disabled && (
                <small>Em breve</small>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            🚪 Sair
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={() =>
            setMenuOpen(false)
          }
          aria-label="Fechar menu"
        />
      )}

      <div className="admin-shell__content">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-button"
            onClick={() =>
              setMenuOpen(
                (current) => !current,
              )
            }
            aria-label="Abrir menu"
          >
            ☰
          </button>

          <div>
            <strong>Painel administrativo</strong>
            <small>
              Gerencie seu estabelecimento
            </small>
          </div>

          <button
            type="button"
            className="admin-client-button"
            onClick={() =>
              onNavigate("/")
            }
          >
            Ver como cliente
          </button>
        </header>

        <div className="admin-page-content">
          {children}
        </div>
      </div>
    </div>
  );
}