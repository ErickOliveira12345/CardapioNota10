import React from "react";

import SuperAdminLayout from "../layouts/SuperAdminLayout.jsx";

import SuperAdminDashboardPage from "./superAdmin/DashboardPage.jsx";
import EstablishmentsPage from "./superAdmin/EstablishmentsPage.jsx";
import UsersPage from "./superAdmin/UsersPage.jsx";
import SuperAdminPlansPage from "./superAdmin/SuperAdminPlansPage.jsx";
import SubscriptionsPage from "./superAdmin/SubscriptionsPage.jsx";
import PaymentsPage from "./superAdmin/PaymentsPage.jsx";
import AuditPage from "./superAdmin/AuditPage.jsx";
import SettingsPage from "./superAdmin/SettingsPage.jsx";
import SuperAdminDriversPage from "./superAdmin/SuperAdminDriversPage.jsx";

function getCurrentPage() {
  const path = window.location.pathname;

  switch (path) {
    case "/super-admin":
      return <SuperAdminDashboardPage />;

    case "/super-admin/estabelecimentos":
      return <EstablishmentsPage />;

    case "/super-admin/usuarios":
      return <UsersPage />;

    case "/super-admin/planos":
      return <SuperAdminPlansPage />;

    case "/super-admin/assinaturas":
      return <SubscriptionsPage />;

    case "/super-admin/pagamentos":
      return <PaymentsPage />;

    case "/super-admin/auditoria":
      return <AuditPage />;

    case "/super-admin/configuracoes":
      return <SettingsPage />;

    case "/super-admin/entregadores":
      return <SuperAdminDriversPage />;

    default:
      return <SuperAdminDashboardPage />;
  }
}

export default function SuperAdminPage() {
  return (
    <SuperAdminLayout>
      {getCurrentPage()}
    </SuperAdminLayout>
  );
}