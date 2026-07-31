const {
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");

const {
  initializeApp,
} = require("firebase-admin/app");

const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

const REGION = "southamerica-east1";

const INITIAL_SETUP_KEY =
  "cardapio-nota10-configuracao-inicial";

/**
 * Cria ou atualiza os planos iniciais do sistema.
 *
 * Esta função é temporária e deve ser removida
 * depois da configuração inicial.
 */
exports.createInitialPlans = onCall(
  {
    region: REGION,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "É necessário estar autenticado.",
      );
    }

    const setupKey = request.data?.setupKey;

    if (setupKey !== INITIAL_SETUP_KEY) {
      throw new HttpsError(
        "permission-denied",
        "Chave de configuração inválida.",
      );
    }

    const plans = {
      basic: {
        code: "basic",
        nome: "Básico",
        descricao:
          "Plano inicial para pequenos estabelecimentos",

        ativo: true,
        ordem: 1,

        moeda: "BRL",
        precoMensal: 3990,

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

        mercadoPago: {
          preapprovalPlanId: null,
          status: "not_configured",
          sincronizadoEm: null,
        },
      },

      intermediate: {
        code: "intermediate",
        nome: "Intermediário",
        descricao:
          "Plano para estabelecimentos em crescimento",

        ativo: true,
        ordem: 2,

        moeda: "BRL",
        precoMensal: 5990,

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

        mercadoPago: {
          preapprovalPlanId: null,
          status: "not_configured",
          sincronizadoEm: null,
        },
      },

      premium: {
        code: "premium",
        nome: "Premium",
        descricao:
          "Plano completo para grandes estabelecimentos",

        ativo: true,
        ordem: 3,

        moeda: "BRL",
        precoMensal: 9990,

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

        mercadoPago: {
          preapprovalPlanId: null,
          status: "not_configured",
          sincronizadoEm: null,
        },
      },
    };

    try {
      const planEntries = Object.entries(plans);

      const snapshots = await Promise.all(
        planEntries.map(([planId]) => {
          return db
            .collection("plans")
            .doc(planId)
            .get();
        }),
      );

      const batch = db.batch();

      const createdPlans = [];
      const updatedPlans = [];

      planEntries.forEach(
        ([planId, plan], index) => {
          const planReference = db
            .collection("plans")
            .doc(planId);

          const existingSnapshot =
            snapshots[index];

          const planData = {
            ...plan,

            atualizadoEm:
              FieldValue.serverTimestamp(),

            atualizadoPor: request.auth.uid,

            /*
             * Remove o campo antigo caso ele ainda
             * exista nos documentos do Firestore.
             */
            mercadoPagoPlanId:
              FieldValue.delete(),
          };

          if (!existingSnapshot.exists) {
            planData.criadoEm =
              FieldValue.serverTimestamp();

            planData.criadoPor =
              request.auth.uid;

            createdPlans.push(planId);
          } else {
            updatedPlans.push(planId);
          }

          batch.set(
            planReference,
            planData,
            {
              merge: true,
            },
          );
        },
      );

      await batch.commit();

      return {
        success: true,

        message:
          "Planos iniciais configurados com sucesso.",

        createdPlans,
        updatedPlans,

        plans: Object.keys(plans),
      };
    } catch (error) {
      console.error(
        "Erro ao criar os planos iniciais:",
        error,
      );

      throw new HttpsError(
        "internal",
        "Não foi possível configurar os planos.",
        {
          originalMessage: error.message,
        },
      );
    }
  },
);