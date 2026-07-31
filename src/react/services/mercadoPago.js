const {
  MercadoPagoConfig,
  PreApproval,
  PreApprovalPlan,
  Payment,
} = require("mercadopago");

let mercadoPagoClient = null;

/**
 * Retorna o Access Token do Mercado Pago.
 *
 * Por enquanto, você pode deixar a credencial sem configurar.
 * Quando a integração real começar, utilizaremos variável secreta
 * das Firebase Functions.
 */
function getAccessToken() {
  const accessToken =
    process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "MERCADO_PAGO_ACCESS_TOKEN não foi configurado.",
    );
  }

  return accessToken;
}

/**
 * Cria o cliente do Mercado Pago apenas quando necessário.
 */
function getMercadoPagoClient() {
  if (!mercadoPagoClient) {
    mercadoPagoClient = new MercadoPagoConfig({
      accessToken: getAccessToken(),
      options: {
        timeout: 10000,
      },
    });
  }

  return mercadoPagoClient;
}

/**
 * Retorna o cliente responsável pelas assinaturas.
 */
function getPreApprovalClient() {
  return new PreApproval(
    getMercadoPagoClient(),
  );
}

/**
 * Retorna o cliente responsável pelos planos
 * de assinatura do Mercado Pago.
 */
function getPreApprovalPlanClient() {
  return new PreApprovalPlan(
    getMercadoPagoClient(),
  );
}

/**
 * Retorna o cliente responsável pelos pagamentos.
 */
function getPaymentClient() {
  return new Payment(
    getMercadoPagoClient(),
  );
}

/**
 * Cria uma assinatura recorrente.
 *
 * O campo cardTokenId será utilizado somente quando
 * implementarmos o formulário de cartão.
 */
async function createMercadoPagoSubscription({
  reason,
  payerEmail,
  amount,
  cardTokenId,
  externalReference,
  backUrl,
  notificationUrl,
  frequency = 1,
  frequencyType = "months",
  currencyId = "BRL",
}) {
  if (!reason) {
    throw new Error(
      "O motivo da assinatura é obrigatório.",
    );
  }

  if (!payerEmail) {
    throw new Error(
      "O e-mail do assinante é obrigatório.",
    );
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error(
      "O valor da assinatura deve ser maior que zero.",
    );
  }

  const body = {
    reason,
    payer_email: payerEmail,

    auto_recurring: {
      frequency,
      frequency_type: frequencyType,
      transaction_amount: Number(amount),
      currency_id: currencyId,
    },

    status: cardTokenId
      ? "authorized"
      : "pending",
  };

  if (cardTokenId) {
    body.card_token_id = cardTokenId;
  }

  if (externalReference) {
    body.external_reference =
      externalReference;
  }

  if (backUrl) {
    body.back_url = backUrl;
  }

  if (notificationUrl) {
    body.notification_url =
      notificationUrl;
  }

  const preApprovalClient =
    getPreApprovalClient();

  return preApprovalClient.create({
    body,
  });
}

/**
 * Cria um plano de assinatura no Mercado Pago.
 *
 * Isso poderá ser usado posteriormente para sincronizar
 * os planos Básico, Intermediário e Premium.
 */
async function createMercadoPagoPlan({
  reason,
  amount,
  backUrl,
  frequency = 1,
  frequencyType = "months",
  currencyId = "BRL",
  repetitions,
  freeTrialDays,
}) {
  if (!reason) {
    throw new Error(
      "O nome do plano é obrigatório.",
    );
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error(
      "O valor do plano deve ser maior que zero.",
    );
  }

  const autoRecurring = {
    frequency,
    frequency_type: frequencyType,
    transaction_amount: Number(amount),
    currency_id: currencyId,
  };

  if (repetitions) {
    autoRecurring.repetitions =
      Number(repetitions);
  }

  if (
    freeTrialDays &&
    Number(freeTrialDays) > 0
  ) {
    autoRecurring.free_trial = {
      frequency: Number(freeTrialDays),
      frequency_type: "days",
    };
  }

  const body = {
    reason,
    auto_recurring: autoRecurring,
  };

  if (backUrl) {
    body.back_url = backUrl;
  }

  const planClient =
    getPreApprovalPlanClient();

  return planClient.create({
    body,
  });
}

/**
 * Consulta uma assinatura pelo ID do Mercado Pago.
 */
async function getMercadoPagoSubscription(
  subscriptionId,
) {
  if (!subscriptionId) {
    throw new Error(
      "O ID da assinatura é obrigatório.",
    );
  }

  const preApprovalClient =
    getPreApprovalClient();

  return preApprovalClient.get({
    id: subscriptionId,
  });
}

/**
 * Atualiza uma assinatura.
 *
 * Exemplos de status:
 * authorized
 * paused
 * cancelled
 */
async function updateMercadoPagoSubscription(
  subscriptionId,
  data,
) {
  if (!subscriptionId) {
    throw new Error(
      "O ID da assinatura é obrigatório.",
    );
  }

  const preApprovalClient =
    getPreApprovalClient();

  return preApprovalClient.update({
    id: subscriptionId,
    body: data,
  });
}

/**
 * Cancela uma assinatura no Mercado Pago.
 */
async function cancelMercadoPagoSubscription(
  subscriptionId,
) {
  return updateMercadoPagoSubscription(
    subscriptionId,
    {
      status: "cancelled",
    },
  );
}

/**
 * Pausa temporariamente uma assinatura.
 */
async function pauseMercadoPagoSubscription(
  subscriptionId,
) {
  return updateMercadoPagoSubscription(
    subscriptionId,
    {
      status: "paused",
    },
  );
}

/**
 * Reativa uma assinatura pausada.
 */
async function activateMercadoPagoSubscription(
  subscriptionId,
) {
  return updateMercadoPagoSubscription(
    subscriptionId,
    {
      status: "authorized",
    },
  );
}

/**
 * Consulta um pagamento pelo ID.
 */
async function getMercadoPagoPayment(
  paymentId,
) {
  if (!paymentId) {
    throw new Error(
      "O ID do pagamento é obrigatório.",
    );
  }

  const paymentClient =
    getPaymentClient();

  return paymentClient.get({
    id: paymentId,
  });
}

module.exports = {
  getMercadoPagoClient,
  getPreApprovalClient,
  getPreApprovalPlanClient,
  getPaymentClient,

  createMercadoPagoSubscription,
  createMercadoPagoPlan,
  getMercadoPagoSubscription,
  updateMercadoPagoSubscription,
  cancelMercadoPagoSubscription,
  pauseMercadoPagoSubscription,
  activateMercadoPagoSubscription,
  getMercadoPagoPayment,
};