const { initializeApp, cert } = require("firebase-admin/app");
const {
  FieldValue,
  getFirestore,
} = require("firebase-admin/firestore");

const serviceAccount = require("../serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const plans = {
  basic: {
    codigo: "basic",
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
    codigo: "intermediate",
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
    codigo: "premium",
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

async function seedPlans() {
  const batch = db.batch();

  for (const [planId, plan] of Object.entries(plans)) {
    const planReference = db.collection("plans").doc(planId);

    batch.set(
      planReference,
      {
        ...plan,
        atualizadoEm: FieldValue.serverTimestamp(),
        atualizadoPor: "seed-inicial",
      },
      { merge: true },
    );
  }

  await batch.commit();

  console.log("Planos criados ou atualizados com sucesso:");
  console.log("- basic");
  console.log("- intermediate");
  console.log("- premium");
}

seedPlans()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro ao criar os planos:", error);
    process.exit(1);
  });