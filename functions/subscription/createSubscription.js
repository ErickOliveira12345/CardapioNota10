const admin = require("firebase-admin");

// const {
//   createMercadoPagoSubscription,
// } = require("../services/mercadoPago");

const db = admin.firestore();

/**
 * Cria uma assinatura.
 *
 * @param {Object} request Requisição da Callable Function.
 * @return {Promise<Object>} Resultado da criação da assinatura.
 */
module.exports = async (request) => {
  try {
    const {
      establishmentId,
      planId,
      // customerEmail,
    } = request.data || {};

    if (!establishmentId) {
      throw new Error("Estabelecimento não informado.");
    }

    if (!planId) {
      throw new Error("Plano não informado.");
    }

    // Busca o plano verdadeiro no Firestore
    const planRef = db.collection("plans").doc(planId);

    const planSnapshot = await planRef.get();

    if (!planSnapshot.exists) {
      throw new Error("Plano não encontrado.");
    }

    const plan = planSnapshot.data();

    const subscriptionRef = db
        .collection("subscriptions")
        .doc(establishmentId);

    const subscription = {
      establishmentId,

      planId,

      status: "trial",

      planName: plan.nome,

      amount: Number(plan.preco),

      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),

      updatedAt:
        admin.firestore.FieldValue.serverTimestamp(),

      trialEndsAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
      ),

      mercadoPagoId: null,

      nextBillingDate: null,
    };

    /*
     * Integração futura
     *
     * const mercadoPago =
     * await createMercadoPagoSubscription({
     *     reason: plan.nome,
     *     payerEmail: customerEmail,
     *     amount: plan.preco,
     *     externalReference: establishmentId
     * });
     *
     * subscription.mercadoPagoId = mercadoPago.id;
     * subscription.status = mercadoPago.status;
     */

    await subscriptionRef.set(subscription);

    return {
      success: true,

      message: "Assinatura criada com sucesso.",

      subscription,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,

      message: error.message,
    };
  }
};
