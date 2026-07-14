const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

exports.createInitialPlans = onCall(
  {
    region: "southamerica-east1",
  },
  async (request) => {
    /*
     * Esta chave é temporária.
     * Depois de criar os planos, removeremos esta função.
     */
    const setupKey = request.data?.setupKey;
    

    if (setupKey !== "cardapio-nota10-configuracao-inicial") {
      throw new HttpsError(
        "permission-denied",
        "Chave de configuração inválida.",
      );
    }

    const plans = {
      basic: {
        code: "basic",
        nome: "Básico",
        descricao: "Plano inicial para pequenos estabelecimentos",

        ativo: true,
        ordem: 1,

        teste: {
          habilitado: true,
          dias: 30,
          preco: 0,
        },

        promocao: {
          habilitada: false,
          meses: 0,
          preco: 0,
        },

        precoMensal: 3990,

        cobranca: {
          ciclo: "monthly",
          intervalo: 1,
        },

        funcionalidades: {
          maxMesas: 10,
          maxCategorias: 10,
          maxProdutos: 50,
          maxFuncionarios: 1,

          cardapioQrCode: true,
          controlePedidos: true,
          chamadosAtendimento: true,
          relatoriosVendas: false,
          relatoriosAvancados: false,
          marcaPersonalizada: false,
          suportePrioritario: false,
        },

        mercadoPagoPlanId: null,
      },

      intermediate: {
        code: "intermediate",
        nome: "Intermediário",
        descricao: "Plano para estabelecimentos em crescimento",

        ativo: true,
        ordem: 2,

        teste: {
          habilitado: false,
          dias: 0,
          preco: 0,
        },

        promocao: {
          habilitada: true,
          meses: 1,
          preco: 990,
        },

        precoMensal: 5990,

        cobranca: {
          ciclo: "monthly",
          intervalo: 1,
        },

        funcionalidades: {
          maxMesas: 30,
          maxCategorias: 30,
          maxProdutos: 200,
          maxFuncionarios: 5,

          cardapioQrCode: true,
          controlePedidos: true,
          chamadosAtendimento: true,
          relatoriosVendas: true,
          relatoriosAvancados: false,
          marcaPersonalizada: false,
          suportePrioritario: false,
        },

        mercadoPagoPlanId: null,
      },

      premium: {
        code: "premium",
        nome: "Premium",
        descricao: "Plano completo para grandes estabelecimentos",

        ativo: true,
        ordem: 3,

        teste: {
          habilitado: false,
          dias: 0,
          preco: 0,
        },

        promocao: {
          habilitada: true,
          meses: 1,
          preco: 1990,
        },

        precoMensal: 9990,

        cobranca: {
          ciclo: "monthly",
          intervalo: 1,
        },

        funcionalidades: {
          maxMesas: -1,
          maxCategorias: -1,
          maxProdutos: -1,
          maxFuncionarios: 20,

          cardapioQrCode: true,
          controlePedidos: true,
          chamadosAtendimento: true,
          relatoriosVendas: true,
          relatoriosAvancados: true,
          marcaPersonalizada: true,
          suportePrioritario: true,
        },

        mercadoPagoPlanId: null,
      },
    };

    const batch = db.batch();

    for (const [planId, plan] of Object.entries(plans)) {
      const planReference = db.collection("plans").doc(planId);

      batch.set(
        planReference,
        {
          ...plan,
          criadoEm: FieldValue.serverTimestamp(),
          atualizadoEm: FieldValue.serverTimestamp(),
          atualizadoPor: "initial-setup",
        },
        {
          merge: true,
        },
      );
    }

    await batch.commit();

    return {
      success: true,
      createdPlans: Object.keys(plans),
    };
  },
);