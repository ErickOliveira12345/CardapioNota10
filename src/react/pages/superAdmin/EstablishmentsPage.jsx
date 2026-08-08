import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../../styles/superAdminCommon.css";
import "../../styles/EstablishmentsPage.css";
import {
  listarEstabelecimentos,
  atualizarStatusEstabelecimento,
  atualizarEstabelecimento,
} from "../../services/establishmentService";

import {
  CreateEstablishmentModal,
} from "../../components/superAdmin/establishments/CreateEstablishmentModal.jsx";

import {
  createEstablishmentByAdmin,
} from "../../services/superAdminEstablishmentService.js";

import {
  EstablishmentDetailsModal,
} from "../../components/superAdmin/establishments/EstablishmentDetailsModal.jsx";

import {
  EditEstablishmentModal,
} from "../../components/superAdmin/establishments/EditEstablishmentModal.jsx";

function getStatusLabel(status) {
  return status === "active"
    ? "Ativo"
    : "Bloqueado";
}


export default function EstablishmentsPage() {
    
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [
    createModalOpen,
    setCreateModalOpen,
  ] = useState(false);

  const [
    creatingEstablishment,
    setCreatingEstablishment,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    selectedEstablishment,
    setSelectedEstablishment,
  ] = useState(null);

  const [
    establishmentToEdit,
    setEstablishmentToEdit,
  ] = useState(null);

  const [
    updatingEstablishment,
    setUpdatingEstablishment,
  ] = useState(false);

  async function carregarEstabelecimentos() {
    try {
      setLoading(true);
      setError("");

      const dados =
        await listarEstabelecimentos();
        console.log("Estabelecimentos:", dados);

      setEstablishments(dados);
    } catch (error) {
      console.error("Erro completo:", error);
    console.error("Código:", error.code);
    console.error("Mensagem:", error.message);
      console.error(
        "Erro ao carregar estabelecimentos:",
        error,
      );

      setError(
        "Não foi possível carregar os estabelecimentos.",
      );
    } finally {
      setLoading(false);
    }
  }

    
  useEffect(() => {
      carregarEstabelecimentos();
  }, []);

  const filteredEstablishments = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return establishments.filter(
      (establishment) => {
        const matchesSearch =
          !normalizedSearch ||
          establishment.nome
            .toLowerCase()
            .includes(normalizedSearch) ||
          establishment.responsavel?.nome
            .toLowerCase()
            .includes(normalizedSearch) ||
          establishment.email
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "all" ||
          establishment.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      },
    );
  }, [
    establishments,
    search,
    statusFilter,
  ]);

  if (loading) {
    return (
      <div className="super-admin-loading">
        Carregando estabelecimentos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="super-admin-error">
        {error}
      </div>
    );
  }

  async function handleToggleStatus(establishment) {
    try {
      setUpdatingId(establishment.id);

      const novoStatus =
        establishment.status === "active"
          ? "blocked"
          : "active";

      await atualizarStatusEstabelecimento(
        establishment.id,
        novoStatus,
      );

      setEstablishments((current) =>
        current.map((item) =>
          item.id === establishment.id
            ? {
                ...item,
                status: novoStatus,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error(error);
      setError(
        "Não foi possível atualizar o status do estabelecimento.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function getPlanLabel(planId) {
    switch (planId) {
      case "basic":
        return "Básico";

      case "intermediate":
        return "Intermediário";

      case "premium":
        return "Premium";

      default:
        return "-";
    }
  }

  async function handleCreateEstablishment(
    form,
  ) {
    try {
      setCreatingEstablishment(true);
      setError("");
      setSuccessMessage("");

      const result =
        await createEstablishmentByAdmin(
          form,
        );

      console.log(
        "Estabelecimento criado:",
        result,
      );

      setSuccessMessage(
        `O estabelecimento "${form.nomeEstabelecimento}" foi criado com sucesso.`,
      );

      setCreateModalOpen(false);

      await carregarEstabelecimentos();

      return result;
    } catch (createError) {
      console.error(
        "Erro ao criar estabelecimento:",
        createError,
      );

      throw new Error(
        createError?.message ||
          "Não foi possível criar o estabelecimento.",
      );
    } finally {
      setCreatingEstablishment(false);
    }
  }

  async function handleUpdateEstablishment(
    establishment,
    form,
  ) {
    try {
      setUpdatingEstablishment(true);
      setError("");
      setSuccessMessage("");

      await atualizarEstabelecimento(
        establishment.id,
        form,
      );

      setEstablishments(
        (current) =>
          current.map((item) =>
            item.id ===
            establishment.id
              ? {
                  ...item,

                  nome: form.nome,
                  email: form.email,
                  telefone:
                    form.telefone,

                  responsavel: {
                    ...item.responsavel,
                    nome:
                      form.responsavelNome,
                  },

                  endereco: {
                    ...item.endereco,
                    ...form.endereco,
                  },
                }
              : item,
          ),
      );

      setEstablishmentToEdit(null);

      setSuccessMessage(
        "Estabelecimento atualizado com sucesso.",
      );
    } catch (updateError) {
      console.error(
        "Erro ao atualizar estabelecimento:",
        updateError,
      );

      setError(
        "Não foi possível atualizar o estabelecimento.",
      );
    } finally {
      setUpdatingEstablishment(false);
    }
  }

  return (
    <section className="super-admin-page establishments-page">
      <header className="super-admin-page__header">
        <div>
          <span className="super-admin-page__eyebrow">
            Administração da plataforma
          </span>

          <h1>Estabelecimentos</h1>

          <p>
            Gerencie os estabelecimentos
            cadastrados no Cardápio Nota10.
          </p>
        </div>

        <button
          type="button"
          className="super-admin-button"
          onClick={() =>
            setCreateModalOpen(true)
          }
        >
          + Novo estabelecimento
        </button>
      </header>

      {successMessage && (
        <div className="super-admin-alert super-admin-alert--success">
          {successMessage}
        </div>
      )}

      <div className="super-admin-filters">
        <input
          type="search"
          placeholder="Buscar estabelecimento..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value,
            )
          }
        >
          <option value="all">
            Todos os status
          </option>

          <option value="active">
            Ativos
          </option>

          <option value="blocked">
            Bloqueados
          </option>
        </select>
      </div>

      <div className="super-admin-table-wrapper">
        <table className="super-admin-table">
          <thead>
            <tr>
              <th>Estabelecimento</th>
              <th>Responsável</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredEstablishments.map(
              (establishment) => (
                <tr key={establishment.id}>
                  <td>
                    <strong>
                      {establishment.nome}
                    </strong>

                    <span>
                      {establishment.email}
                    </span>
                  </td>

                  <td>
                    {
                      establishment.responsavel?.nome
                    }
                  </td>

                  <td>
                    {getPlanLabel(establishment.planoAtual)}
                  </td>

                  <td>
                    <span
                      className={`super-admin-status super-admin-status--${establishment.status}`}
                    >
                      {getStatusLabel(
                        establishment.status,
                      )}
                    </span>
                  </td>

                  <td>
                    <div className="super-admin-actions">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedEstablishment(
                            establishment,
                          )
                        }
                      >
                        Ver
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEstablishmentToEdit(
                            establishment,
                          )
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(establishment)
                        }
                      >
                        {establishment.status ===
                        "active"
                          ? "Bloquear"
                          : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>

        {filteredEstablishments.length ===
          0 && (
          <div className="super-admin-empty">
            Nenhum estabelecimento
            encontrado.
          </div>
        )}
      </div>
      <CreateEstablishmentModal
        open={createModalOpen}
        creating={creatingEstablishment}
        onClose={() =>
          setCreateModalOpen(false)
        }
        onSubmit={
          handleCreateEstablishment
        }
      />

      <EstablishmentDetailsModal
        establishment={
          selectedEstablishment
        }
        getPlanLabel={getPlanLabel}
        getStatusLabel={getStatusLabel}
        onClose={() =>
          setSelectedEstablishment(null)
        }
        onEdit={(establishment) => {
          setSelectedEstablishment(null);

          setEstablishmentToEdit(
            establishment,
          );
        }}
      />

      <EditEstablishmentModal
        establishment={
          establishmentToEdit
        }
        updating={
          updatingEstablishment
        }
        onClose={() =>
          setEstablishmentToEdit(null)
        }
        onSubmit={
          handleUpdateEstablishment
        }
      />
    </section>
  );
}