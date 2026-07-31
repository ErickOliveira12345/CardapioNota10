import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listenAuditLogs,
} from "../../services/auditService";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/superAdminCommon.css";
import "../../styles/AuditPage.css";

const AUDIT_TYPE_ICONS = {
  create: "＋",
  update: "✎",
  block: "!",
  unblock: "✓",
  payment: "R$",
  delete: "×",
  login: "↪",
  logout: "↩",
  system: "⚙",
};

function formatAuditDate(value) {
  if (!value) {
    return "Data não disponível";
  }

  let date;

  if (typeof value.toDate === "function") {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "Data não disponível";
  }

  const formattedDate = date.toLocaleDateString("pt-BR");
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formattedDate} às ${formattedTime}`;
}

export default function AuditPage() {

const authContext = useAuth();

  const {
  user: currentUser,
  profile: userProfile,
  loading: authLoading,
  profileLoading,
} = useAuth();

  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
console.log("UID:", currentUser?.uid);
console.log("Perfil:", userProfile);
  useEffect(() => {
  if (authLoading || profileLoading) {
    return undefined;
  }

  if (!currentUser) {
    setAuditLogs([]);
    setLoading(false);
    setError(
      "Você precisa estar autenticado para consultar a auditoria.",
    );

    return undefined;
  }

  if (
    userProfile?.role !== "super_admin" ||
    userProfile?.status !== "active"
  ) {
    setAuditLogs([]);
    setLoading(false);
    setError(
      "Você não possui permissão para consultar os registros de auditoria.",
    );

    return undefined;
  }

  setLoading(true);
  setError("");

  const unsubscribe = listenAuditLogs({
    maxResults: 200,

    onData: (logs) => {
      setAuditLogs(logs);
      setLoading(false);
      setError("");
    },

    onError: (listenError) => {
      console.error(
        "Erro ao acompanhar registros de auditoria:",
        listenError,
      );

      setAuditLogs([]);
      setLoading(false);

      if (listenError?.code === "permission-denied") {
        setError(
          "O Firestore negou acesso aos registros de auditoria.",
        );

        return;
      }

      setError(
        listenError?.message ||
          "Não foi possível carregar os registros de auditoria.",
      );
    },
  });

  return () => {
    unsubscribe();
  };
}, [
  authLoading,
  profileLoading,
  currentUser,
  userProfile?.role,
  userProfile?.status,
]);

  const logs = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return auditLogs.filter((log) => {
      const matchesType =
        typeFilter === "all" ||
        log.tipo === typeFilter;

      if (!matchesType) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableContent = [
        log.usuario,
        log.usuarioEmail,
        log.acao,
        log.recurso,
        log.tipo,
        log.estabelecimentoId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableContent.includes(
        normalizedSearch,
      );
    });
  }, [auditLogs, search, typeFilter]);

  function handleExportRecords() {
    if (logs.length === 0) {
      window.alert(
        "Não existem registros para exportar.",
      );

      return;
    }

    const headers = [
      "ID",
      "Usuário",
      "E-mail",
      "Ação",
      "Recurso",
      "Tipo",
      "Estabelecimento",
      "Data",
    ];

    const rows = logs.map((log) => [
      log.id,
      log.usuario || "Sistema",
      log.usuarioEmail || "",
      log.acao || "",
      log.recurso || "",
      log.tipo || "",
      log.estabelecimentoId || "",
      formatAuditDate(log.criadoEm),
    ]);

    function escapeCsvValue(value) {
      const text = String(value ?? "");

      return `"${text.replaceAll('"', '""')}"`;
    }

    const csvContent = [
      headers.map(escapeCsvValue).join(";"),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(";"),
      ),
    ].join("\n");

    const blob = new Blob(
      [`\uFEFF${csvContent}`],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date()
      .toLocaleDateString("pt-BR")
      .replaceAll("/", "-");

    link.href = url;
    link.download = `auditoria-${date}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <section className="super-admin-page">
      <header className="super-admin-page__header">
        <div>
          <span className="super-admin-page__eyebrow">
            Segurança e rastreabilidade
          </span>

          <h1>Auditoria</h1>

          <p>
            Consulte ações realizadas por
            administradores e pelo sistema.
          </p>
        </div>

        <button
          type="button"
          className="super-admin-button super-admin-button--secondary"
          onClick={handleExportRecords}
          disabled={logs.length === 0}
        >
          Exportar registros
        </button>
      </header>

      {error && (
        <div className="super-admin-alert super-admin-alert--error">
          {error}
        </div>
      )}

      <div className="super-admin-filters">
        <input
          type="search"
          placeholder="Buscar nos registros..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
        >
          <option value="all">
            Todos os tipos
          </option>

          <option value="create">
            Criações
          </option>

          <option value="update">
            Atualizações
          </option>

          <option value="block">
            Bloqueios
          </option>

          <option value="unblock">
            Desbloqueios
          </option>

          <option value="payment">
            Pagamentos
          </option>

          <option value="delete">
            Exclusões
          </option>

          <option value="login">
            Acessos
          </option>

          <option value="system">
            Sistema
          </option>
        </select>
      </div>

      {loading && (
        <div className="super-admin-loading">
          Carregando registros de auditoria...
        </div>
      )}

      {!loading && (
        <div className="super-admin-audit-list">
          {logs.map((log) => (
            <article
              key={log.id}
              className="super-admin-audit-item"
            >
              <div className="super-admin-audit-item__icon">
                {AUDIT_TYPE_ICONS[log.tipo] ||
                  "•"}
              </div>

              <div className="super-admin-audit-item__content">
                <strong>
                  {log.acao ||
                    "Ação não identificada"}
                </strong>

                <p>
                  Realizado por{" "}
                  {log.usuario || "Sistema"}
                </p>

                {log.usuarioEmail && (
                  <small>{log.usuarioEmail}</small>
                )}

                <span>
                  {log.recurso ||
                    "Recurso não informado"}
                </span>
              </div>

              <time
                dateTime={
                  log.criadoEm
                    ?.toDate?.()
                    ?.toISOString?.() || ""
                }
              >
                {formatAuditDate(log.criadoEm)}
              </time>
            </article>
          ))}

          {logs.length === 0 && !error && (
            <div className="super-admin-empty">
              {auditLogs.length === 0
                ? "Nenhum registro de auditoria foi criado."
                : "Nenhum registro corresponde aos filtros."}
            </div>
          )}
        </div>
      )}
    </section>
  );
}