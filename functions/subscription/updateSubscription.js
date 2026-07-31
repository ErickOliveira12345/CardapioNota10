const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Atualiza o plano de assinatura de um estabelecimento.
 *
 * Recebe:
 * request.data.establishmentId
 * request.data.planId
 */
module.exports = async function updateSubscription(request) {
  try {
    const { establishmentId, planId } =
      request.data || {};

    if (!request.auth) {
      throw new Error(
        "Usuário não autenticado.",
      );
    }

    if (!establishmentId) {
      throw new Error(
        "Estabelecimento não informado.",
      );
    }

    if (!planId) {
      throw new Error(
        "Novo plano não informado.",
      );
    }

    const planRef = db
      .collection("plans")
      .doc(planId);

    const subscriptionRef = db
      .collection("subscriptions")
      .doc(establishmentId);

    const result = await db.runTransaction(
      async (transaction) => {
        const [planSnapshot, subscriptionSnapshot] =
          await Promise.all([
            transaction.get(planRef),
            transaction.get(subscriptionRef),
          ]);

        if (!planSnapshot.exists) {
          throw new Error(
            "O plano selecionado não foi encontrado.",
          );
        }

        if (!subscriptionSnapshot.exists) {
          throw new Error(
            "A assinatura do estabelecimento não foi encontrada.",
          );
        }

        const plan = planSnapshot.data();
        const currentSubscription =
          subscriptionSnapshot.data();

        if (currentSubscription.planId === planId) {
          throw new Error(
            "Este plano já está ativo na assinatura.",
          );
        }

        const previousPlanId =
          currentSubscription.planId || null;

        const previousPlanName =
          currentSubscription.planName || null;

        const newAmount = Number(
          plan.preco || 0,
        );

        if (newAmount <= 0) {
          throw new Error(
            "O plano selecionado possui um valor inválido.",
          );
        }

        const updateData = {
          planId,
          planName:
            plan.nome || plan.name || planId,
          amount: newAmount,

          previousPlanId,
          previousPlanName,

          updatedAt:
            admin.firestore.FieldValue.serverTimestamp(),

          lastPlanChangeAt:
            admin.firestore.FieldValue.serverTimestamp(),

          mercadoPagoSyncStatus: "pending",
        };

        /*
         * Integração futura com o Mercado Pago:
         *
         * const mercadoPagoResult =
         *   await updateMercadoPagoSubscription(
         *     currentSubscription.mercadoPagoId,
         *     {
         *       auto_recurring: {
         *         transaction_amount: newAmount,
         *         currency_id: "BRL",
         *       },
         *       reason: plan.nome,
         *     },
         *   );
         *
         * updateData.mercadoPagoSyncStatus = "synced";
         * updateData.mercadoPagoStatus =
         *   mercadoPagoResult.status;
         */

        transaction.update(
          subscriptionRef,
          updateData,
        );

        return {
          previousPlanId,
          previousPlanName,
          planId,
          planName:
            plan.nome || plan.name || planId,
          amount: newAmount,
          status:
            currentSubscription.status,
        };
      },
    );

    return {
      success: true,
      message:
        "Plano da assinatura atualizado com sucesso.",
      subscription: result,
    };
  } catch (error) {
    console.error(
      "Erro ao atualizar assinatura:",
      error,
    );

    return {
      success: false,
      message:
        error.message ||
        "Não foi possível atualizar a assinatura.",
    };
  }
};