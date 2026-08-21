import React,{ useEffect, useMemo, useState } from "react";
import {
  collectionGroup,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import "../styles/driver/minhasEntregasPage.css"

import { auth, db } from "../firebase/firebaseConfig";

export default function MinhasEntregasPage({ onNavigate }) {
  const [entregador, setEntregador] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // =====================================================
  // VERIFICA O ENTREGADOR LOGADO
  // =====================================================

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setEntregador(user || null);

      if (!user) {
        setCarregando(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // =====================================================
  // BUSCA SOMENTE PEDIDOS ACEITOS PELO ENTREGADOR
  // =====================================================

  useEffect(() => {
    if (!entregador?.uid) {
      setPedidos([]);
      setCarregando(false);
      return undefined;
    }

    setCarregando(true);
    setErro("");

    console.log(
      "Buscando entregas do UID:",
      entregador.uid,
    );

    /*
     * Os pedidos ficam em:
     * establishments/{establishmentId}/orders/{orderId}
     *
     * Como o entregador pode aceitar pedidos de vários
     * estabelecimentos, usamos collectionGroup("orders").
     */
    const pedidosRef = collectionGroup(
      db,
      "orders",
    );

    const q = query(
      pedidosRef,

      where(
        "tipoPedido",
        "==",
        "entrega",
      ),

      where(
        "entregadorUid",
        "==",
        entregador.uid,
      ),
    );

    const unsubscribe = onSnapshot(
      q,

      (snapshot) => {
        const lista = snapshot.docs.map(
          (document) => ({
            id: document.id,
            idPedido: document.id,

            /*
             * orders é subcoleção direta de establishments/{id}.
             */
            establishmentId:
              document.ref.parent.parent?.id ||
              document.data()?.establishmentId ||
              null,

            ...document.data(),
          }),
        );

        lista.sort((a, b) => {
          const dataA = Number(
            a.atualizadoEmMs ||
              a.aceitoEmMs ||
              a.criadoEmMs ||
              a.atualizadoEm?.toMillis?.() ||
              a.criadoEm?.toMillis?.() ||
              0,
          );

          const dataB = Number(
            b.atualizadoEmMs ||
              b.aceitoEmMs ||
              b.criadoEmMs ||
              b.atualizadoEm?.toMillis?.() ||
              b.criadoEm?.toMillis?.() ||
              0,
          );

          return dataB - dataA;
        });

        console.log(
          "MINHAS ENTREGAS:",
          lista,
        );

        setPedidos(lista);
        setCarregando(false);
      },

      (error) => {
        console.error(
          "Erro ao carregar minhas entregas:",
          error,
        );

        setErro(
          error?.message ||
            "Não foi possível carregar suas entregas.",
        );

        setCarregando(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [entregador?.uid]);

  // =====================================================
  // SEPARAÇÃO DAS ENTREGAS
  // =====================================================

  const entregasAtivas = useMemo(() => {
    return pedidos.filter((pedido) => {
      const status = pedido.statusEntrega;

      return ![
        "entregue",
        "finalizado",
        "cancelado",
      ].includes(status);
    });
  }, [pedidos]);

  const entregasFinalizadas = useMemo(() => {
    return pedidos.filter((pedido) => {
      return [
        "entregue",
        "finalizado",
      ].includes(pedido.statusEntrega);
    });
  }, [pedidos]);

  // =====================================================
  // FORMATADORES
  // =====================================================

  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function obterStatus(status) {
    const statusMap = {
      aceito: {
        label: "Pedido aceito",
        emoji: "✅",
      },

      aceita: {
        label: "Pedido aceito",
        emoji: "✅",
      },

      aguardando_retirada: {
        label: "Aguardando retirada",
        emoji: "📦",
      },

      retirado: {
        label: "Pedido retirado",
        emoji: "🛍️",
      },

      em_rota: {
        label: "Em rota",
        emoji: "🛵",
      },

      saiu_para_entrega: {
        label: "Saiu para entrega",
        emoji: "🛵",
      },

      entregue: {
        label: "Entregue",
        emoji: "🏁",
      },

      finalizado: {
        label: "Finalizado",
        emoji: "🏁",
      },

      cancelado: {
        label: "Cancelado",
        emoji: "❌",
      },
    };

    return (
      statusMap[status] || {
        label: status || "Em andamento",
        emoji: "📦",
      }
    );
  }

  function obterNomeCliente(pedido) {
    return (
      pedido.cliente?.nome ||
      pedido.nomeCliente ||
      pedido.clienteNome ||
      "Cliente"
    );
  }

  function obterEndereco(pedido) {
    const endereco =
      pedido.entrega?.endereco ||
      pedido.enderecoEntrega ||
      pedido.cliente?.endereco;

    if (!endereco) {
      return "Endereço não informado";
    }

    if (typeof endereco === "string") {
      return endereco;
    }

    const partes = [
      endereco.rua || endereco.logradouro,
      endereco.numero,
      endereco.bairro,
      endereco.cidade,
      endereco.estado,
    ].filter(Boolean);

    return partes.join(", ") || "Endereço não informado";
  }

  async function atualizarStatusEntrega(
      pedido,
      novoStatus,
    ) {
      if (
        !pedido?.establishmentId ||
        !pedido?.id
      ) {
        setErro(
          "Não foi possível identificar o pedido.",
        );
        return;
      }

      try {
        setErro("");

        const pedidoRef = doc(
          db,
          "establishments",
          pedido.establishmentId,
          "orders",
          pedido.id,
        );

        const agora = Date.now();

        const dadosAtualizacao = {
          statusEntrega: novoStatus,
          atualizadoEm: serverTimestamp(),
          atualizadoEmMs: agora,
        };

        if (novoStatus === "entregue") {
          dadosAtualizacao.status =
            "finalizado";

          dadosAtualizacao.entregaDisponivel =
            false;

          dadosAtualizacao.entregueEm =
            serverTimestamp();

          dadosAtualizacao.entregueEmMs =
            agora;

          dadosAtualizacao.finalizadoEm =
            serverTimestamp();

          dadosAtualizacao.finalizadoEmMs =
            agora;
        }

        await updateDoc(
          pedidoRef,
          dadosAtualizacao,
        );

        console.log(
          "ENTREGA ATUALIZADA:",
          {
            pedidoId: pedido.id,
            novoStatus,
            statusPedido:
              novoStatus === "entregue"
                ? "finalizado"
                : pedido.status,
          },
        );
      } catch (error) {
        console.error(
          "Erro ao atualizar entrega:",
          error,
        );

        setErro(
          error?.message ||
            "Não foi possível atualizar a entrega.",
        );
      }
    }

  // =====================================================
  // CARD DA ENTREGA
  // =====================================================

  function CardEntrega({ pedido }) {
    const status = obterStatus(pedido.statusEntrega);

    return (
      <article className="entrega-card">
        <div className="entrega-card__top">
          <div>
            <span className="entrega-card__pedido">
              Pedido #{String(pedido.id || pedido.idPedido || "").slice(0, 8)}
            </span>

            <h3>{obterNomeCliente(pedido)}</h3>
          </div>

          <span
            className={`entrega-status entrega-status--${pedido.statusEntrega || "padrao"}`}
          >
            {status.emoji} {status.label}
          </span>
        </div>

        <div className="entrega-card__info">
          <div className="entrega-info">
            <span className="entrega-info__icone">
              📍
            </span>

            <div>
              <strong>Endereço</strong>
              <p>{obterEndereco(pedido)}</p>
            </div>
          </div>

          {pedido.entrega?.referencia && (
            <div className="entrega-info">
              <span className="entrega-info__icone">
                🏠
              </span>

              <div>
                <strong>Referência</strong>
                <p>{pedido.entrega.referencia}</p>
              </div>
            </div>
          )}

          {pedido.cliente?.telefone && (
            <div className="entrega-info">
              <span className="entrega-info__icone">
                📞
              </span>

              <div>
                <strong>Telefone</strong>
                <p>{pedido.cliente.telefone}</p>
              </div>
            </div>
          )}
        </div>

        <div className="entrega-card__footer">
          <div>
            <span>Total do pedido</span>

            <strong>
              {formatarValor(pedido.total)}
            </strong>
          </div>

          {/* <button
            type="button"
            className="btn-detalhes-entrega"
            onClick={() =>
              onNavigate?.(
                `/entregador/entrega-detalhes?id=${pedido.id}${
                  pedido.establishmentId
                    ? `&est=${pedido.establishmentId}`
                    : ""
                }`
              )
            }
          >
            Ver detalhes
          </button> */}

          {pedido.statusEntrega === "aceita" && (
            <button
              type="button"
              className="btn-status-entrega"
              onClick={() =>
                atualizarStatusEntrega(
                  pedido,
                  "retirado",
                )
              }
            >
              📦 Retirei o pedido
            </button>
          )}

          {pedido.statusEntrega === "retirado" && (
            <button
              type="button"
              className="btn-status-entrega"
              onClick={() =>
                atualizarStatusEntrega(
                  pedido,
                  "em_rota",
                )
              }
            >
              🛵 Iniciar entrega
            </button>
          )}

          {pedido.statusEntrega === "em_rota" && (
            <button
              type="button"
              className="btn-status-entrega btn-status-entrega--finalizar"
              onClick={() =>
                atualizarStatusEntrega(
                  pedido,
                  "entregue",
                )
              }
            >
              ✓ Finalizar entrega
            </button>
          )}
        </div>
      </article>
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (carregando) {
    return (
      <main className="minhas-entregas-page">
        <div className="entregas-loading">
          <span>🛵</span>
          <p>Carregando suas entregas...</p>
        </div>
      </main>
    );
  }

  // =====================================================
  // SEM LOGIN
  // =====================================================

  if (!entregador) {
    return (
      <main className="minhas-entregas-page">
        <div className="entregas-vazio">
          <span>🔒</span>

          <h2>Entregador não autenticado</h2>

          <p>
            Faça login para visualizar suas entregas.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="minhas-entregas-page">
      <header className="entregas-header">
        <div>
          <span className="entregas-header__subtitulo">
            Painel do entregador
          </span>

          <h1>Minhas Entregas</h1>

          <p>
            Acompanhe os pedidos que você aceitou.
          </p>
        </div>

        <button
          type="button"
          className="btn-voltar-entregador"
          onClick={() => onNavigate?.("/entregador")}
        >
          ← Pedidos disponíveis
        </button>
      </header>

      <section className="entregas-resumo">
        <div className="entregas-resumo__card">
          <span>🛵</span>

          <div>
            <strong>{entregasAtivas.length}</strong>
            <p>Em andamento</p>
          </div>
        </div>

        <div className="entregas-resumo__card">
          <span>🏁</span>

          <div>
            <strong>{entregasFinalizadas.length}</strong>
            <p>Finalizadas</p>
          </div>
        </div>

        <div className="entregas-resumo__card">
          <span>📦</span>

          <div>
            <strong>{pedidos.length}</strong>
            <p>Total aceitas</p>
          </div>
        </div>
      </section>

      {erro && (
        <div className="entregas-erro">
          {erro}
        </div>
      )}

      <section className="entregas-secao">
        <div className="entregas-secao__titulo">
          <div>
            <h2>Entregas em andamento</h2>

            <p>
              Pedidos atualmente atribuídos a você.
            </p>
          </div>

          <span>{entregasAtivas.length}</span>
        </div>

        {entregasAtivas.length === 0 ? (
          <div className="entregas-vazio">
            <span>🛵</span>

            <h3>Nenhuma entrega em andamento</h3>

            <p>
              Quando você aceitar um pedido, ele aparecerá aqui.
            </p>

            <button
              type="button"
              onClick={() =>
                onNavigate?.("/entregador")
              }
            >
              Ver pedidos disponíveis
            </button>
          </div>
        ) : (
          <div className="entregas-lista">
            {entregasAtivas.map((pedido) => (
              <CardEntrega
                key={pedido.id}
                pedido={pedido}
              />
            ))}
          </div>
        )}
      </section>

      {entregasFinalizadas.length > 0 && (
        <section className="entregas-secao entregas-secao--finalizadas">
          <div className="entregas-secao__titulo">
            <div>
              <h2>Entregas finalizadas</h2>

              <p>
                Histórico recente das suas entregas.
              </p>
            </div>

            <span>{entregasFinalizadas.length}</span>
          </div>

          <div className="entregas-lista">
            {entregasFinalizadas.map((pedido) => (
              <CardEntrega
                key={pedido.id}
                pedido={pedido}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}