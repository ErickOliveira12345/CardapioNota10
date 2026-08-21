import {
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebaseConfig.js";

export function observeAvailableDriverOrders(
  onChange,
  onError,
) {
  console.log(
    "INICIANDO CONSULTA DE ENTREGAS",
  );
  const availableOrdersQuery =
    query(
      collectionGroup(
        db,
        "orders",
      ),

      where(
        "tipoPedido",
        "==",
        "entrega",
      ),

      where(
        "entregaPremium",
        "==",
        true,
      ),

      where(
        "entregaDisponivel",
        "==",
        true,
      ),

      where(
        "statusEntrega",
        "==",
        "aguardando_entregador",
      ),
    );

    console.log(
  "INICIANDO CONSULTA DE PEDIDOS PARA ENTREGADORES",
);

  return onSnapshot(
    availableOrdersQuery,

   async (snapshot) => {
      try {
        const orders =
          await Promise.all(
            snapshot.docs.map(
              async (documentSnapshot) => {
                const data =
                  documentSnapshot.data();

                /*
                * establishments/{id}/orders/{id}
                */
                const establishmentId =
                  documentSnapshot.ref
                    .parent
                    .parent?.id ||
                  "";

                let establishmentData =
                  null;

                /*
                * Carrega os dados do
                * estabelecimento.
                */
                if (establishmentId) {
                  try {
                    const establishmentReference =
                      doc(
                        db,
                        "establishments",
                        establishmentId,
                      );

                    const establishmentSnapshot =
                      await getDoc(
                        establishmentReference,
                      );

                    if (
                      establishmentSnapshot.exists()
                    ) {
                      establishmentData = {
                        id:
                          establishmentSnapshot.id,

                        ...establishmentSnapshot.data(),
                      };
                    }
                  } catch (
                    establishmentError
                  ) {
                    console.error(
                      "Erro ao carregar estabelecimento da entrega:",
                      establishmentError,
                    );
                  }
                }

                return {
                  id:
                    documentSnapshot.id,

                  establishmentId,

                  estabelecimento:
                    establishmentData,

                  ...data,
                };
              },
            ),
          );

        orders.sort(
          (
            firstOrder,
            secondOrder,
          ) =>
            Number(
              secondOrder
                .criadoEmMs ||
              0,
            ) -
            Number(
              firstOrder
                .criadoEmMs ||
              0,
            ),
        );

        console.log(
          "PEDIDOS PARA ENTREGADOR:",
          orders,
        );

        onChange(
          orders,
        );
      } catch (error) {
        console.error(
          "Erro ao preparar pedidos para entregador:",
          error,
        );

        onError?.(
          error,
        );
      }
    },

    (error) => {
      console.error(
        "Erro ao carregar entregas disponíveis:",
        error,
      );

      console.error(
        "Código:",
        error?.code,
      );

      console.error(
        "Mensagem:",
        error?.message,
      );

      onError?.(
        error,
      );
    },
  );
}

export async function publishOrderForDrivers({
  establishmentId,
  orderId,
}) {
  if (!establishmentId) {
    throw new Error(
      "Estabelecimento não identificado.",
    );
  }

  if (!orderId) {
    throw new Error(
      "Pedido não identificado.",
    );
  }

  // =====================================================
  // CARREGA O ESTABELECIMENTO
  // =====================================================

  const establishmentReference =
    doc(
      db,
      "establishments",
      establishmentId,
    );

  const establishmentSnapshot =
    await getDoc(
      establishmentReference,
    );

  if (!establishmentSnapshot.exists()) {
    throw new Error(
      "Estabelecimento não encontrado.",
    );
  }

  const establishment =
    establishmentSnapshot.data();

  // =====================================================
  // CARREGA A ASSINATURA
  // =====================================================

  const subscriptionReference =
    doc(
      db,
      "subscriptions",
      establishmentId,
    );

  const subscriptionSnapshot =
    await getDoc(
      subscriptionReference,
    );

  const subscription =
    subscriptionSnapshot.exists()
      ? subscriptionSnapshot.data()
      : null;

  console.log(
    "DADOS DA ASSINATURA PARA ENTREGA:",
    {
      establishmentId,

      planoEstabelecimento:
        establishment?.planoAtual,

      planoAssinatura:
        subscription?.planId,

      statusAssinatura:
        subscription?.status,
    },
  );

  // =====================================================
  // IDENTIFICA O PLANO
  // =====================================================

  const plan = String(
    subscription?.planId ||
      establishment?.planoAtual ||
      establishment?.plano ||
      establishment?.plan ||
      "",
  )
    .trim()
    .toLowerCase();

  console.log(
    "PLANO IDENTIFICADO PARA ENTREGA:",
    plan,
  );

  if (plan !== "premium") {
    throw new Error(
      `O recurso de entregadores está disponível somente no plano Premium. Plano atual: ${
        plan || "não identificado"
      }.`,
    );
  }

  // =====================================================
  // CARREGA O PEDIDO
  // =====================================================

  const orderReference =
    doc(
      db,
      "establishments",
      establishmentId,
      "orders",
      orderId,
    );

  const orderSnapshot =
    await getDoc(
      orderReference,
    );

  if (!orderSnapshot.exists()) {
    throw new Error(
      "Pedido não encontrado.",
    );
  }

  const order =
    orderSnapshot.data();

  console.log(
    "PEDIDO ANTES DE PUBLICAR:",
    {
      id: orderId,

      tipoPedido:
        order.tipoPedido,

      status:
        order.status,

      statusEntrega:
        order.statusEntrega,

      entregaPremium:
        order.entregaPremium,

      entregaDisponivel:
        order.entregaDisponivel,

      entregadorUid:
        order.entregadorUid,
    },
  );

  // =====================================================
  // VALIDAÇÕES
  // =====================================================

  if (
    order.tipoPedido !==
    "entrega"
  ) {
    throw new Error(
      "Somente pedidos de entrega podem ser enviados para entregadores.",
    );
  }

  if (order.entregadorUid) {
    throw new Error(
      "Este pedido já possui um entregador.",
    );
  }

  // =====================================================
  // PUBLICA PARA OS ENTREGADORES
  // =====================================================

  await updateDoc(
    orderReference,
    {
      entregaPremium: true,

      entregaDisponivel: true,

      statusEntrega:
        "aguardando_entregador",

      entregadorUid: null,

      disponibilizadoEm:
        serverTimestamp(),

      atualizadoEm:
        serverTimestamp(),

      atualizadoEmMs:
        Date.now(),
    },
  );

  console.log(
    "ENTREGA PUBLICADA COM SUCESSO:",
    {
      establishmentId,
      orderId,
      entregaPremium: true,
      entregaDisponivel: true,
      statusEntrega:
        "aguardando_entregador",
    },
  );

  return true;
}

export async function acceptDeliveryOrder({
  establishmentId,
  orderId,
  driverUid,
}) {
  if (!establishmentId) {
    throw new Error(
      "Estabelecimento não identificado.",
    );
  }

  if (!orderId) {
    throw new Error(
      "Pedido não identificado.",
    );
  }

  if (!driverUid) {
    throw new Error(
      "Entregador não identificado.",
    );
  }

  const orderReference =
    doc(
      db,
      "establishments",
      establishmentId,
      "orders",
      orderId,
    );

  const orderSnapshot =
    await getDoc(
      orderReference,
    );

  if (!orderSnapshot.exists()) {
    throw new Error(
      "Pedido não encontrado.",
    );
  }

  const order =
    orderSnapshot.data();

  if (
    order.tipoPedido !==
    "entrega"
  ) {
    throw new Error(
      "Este pedido não é de entrega.",
    );
  }

  if (
    order.entregaDisponivel !==
    true
  ) {
    throw new Error(
      "Esta entrega não está mais disponível.",
    );
  }

  if (
    order.entregadorUid
  ) {
    throw new Error(
      "Esta entrega já foi aceita por outro entregador.",
    );
  }

  await updateDoc(
    orderReference,
    {
      entregadorUid:
        driverUid,

      entregaDisponivel:
        false,

      statusEntrega:
        "aceita",

      aceitoEm:
        serverTimestamp(),

      atualizadoEm:
        serverTimestamp(),

      atualizadoEmMs:
        Date.now(),
    },
  );
}