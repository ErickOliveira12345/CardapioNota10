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

const {
  getAuth,
} = require("firebase-admin/auth");

initializeApp();

const db = getFirestore();

const adminAuth = getAuth();

const REGION = "southamerica-east1";

async function getRequesterContext(request) {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "É necessário estar autenticado.",
    );
  }

  const requesterUid = request.auth.uid;

  const requesterSnapshot = await db
    .collection("users")
    .doc(requesterUid)
    .get();

  if (!requesterSnapshot.exists) {
    throw new HttpsError(
      "permission-denied",
      "Perfil do usuário autenticado não encontrado.",
    );
  }

  const requesterProfile =
    requesterSnapshot.data();

  const establishmentId =
    requesterProfile.estabelecimentoId ||
    requesterProfile.establishmentId ||
    null;

  if (!establishmentId) {
    throw new HttpsError(
      "failed-precondition",
      "O usuário não está associado a um estabelecimento.",
    );
  }

  const allowedRoles = [
    "owner",
    "subscriber",
    "admin",
    "manager",
  ];

  if (
    !allowedRoles.includes(
      requesterProfile.role,
    )
  ) {
    throw new HttpsError(
      "permission-denied",
      "Você não possui permissão para gerenciar funcionários.",
    );
  }

  const establishmentReference = db
    .collection("establishments")
    .doc(establishmentId);

  const establishmentSnapshot =
    await establishmentReference.get();

  if (!establishmentSnapshot.exists) {
    throw new HttpsError(
      "not-found",
      "Estabelecimento não encontrado.",
    );
  }

  const establishment =
    establishmentSnapshot.data();

  const isOwner =
    establishment.ownerId === requesterUid;

  const canManage =
    isOwner ||
    ["admin", "manager"].includes(
      requesterProfile.role,
    );

  if (!canManage) {
    throw new HttpsError(
      "permission-denied",
      "Você não possui permissão para gerenciar este estabelecimento.",
    );
  }

  return {
    requesterUid,
    requesterProfile,
    establishmentId,
    establishment,
  };
}

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

exports.createEstablishmentUser = onCall(
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

    const requesterUid = request.auth.uid;

    const {
      nome,
      email,
      senha,
      telefone = "",
      role,
      permissoes = {},
    } = request.data || {};

    const normalizedName = String(
      nome || "",
    ).trim();

    const normalizedEmail = String(
      email || "",
    )
      .trim()
      .toLowerCase();

    const normalizedPhone = String(
      telefone || "",
    ).trim();

    if (!normalizedName) {
      throw new HttpsError(
        "invalid-argument",
        "Informe o nome do funcionário.",
      );
    }

    if (!normalizedEmail) {
      throw new HttpsError(
        "invalid-argument",
        "Informe o e-mail do funcionário.",
      );
    }

    if (!senha || senha.length < 6) {
      throw new HttpsError(
        "invalid-argument",
        "A senha deve possuir pelo menos 6 caracteres.",
      );
    }

    const allowedRoles = [
      "admin",
      "manager",
      "waiter",
      "kitchen",
      "cashier",
    ];

    if (!allowedRoles.includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        "Cargo inválido.",
      );
    }

    const requesterSnapshot = await db
      .collection("users")
      .doc(requesterUid)
      .get();

    if (!requesterSnapshot.exists) {
      throw new HttpsError(
        "permission-denied",
        "Perfil do usuário responsável não encontrado.",
      );
    }

    const requesterProfile =
      requesterSnapshot.data();

    const establishmentId =
      requesterProfile.estabelecimentoId ||
      requesterProfile.establishmentId ||
      null;

    if (!establishmentId) {
      throw new HttpsError(
        "failed-precondition",
        "O usuário autenticado não está associado a um estabelecimento.",
      );
    }

    const allowedCreatorRoles = [
      "owner",
      "subscriber",
      "admin",
      "manager",
    ];

    if (
      !allowedCreatorRoles.includes(
        requesterProfile.role,
      )
    ) {
      throw new HttpsError(
        "permission-denied",
        "Você não possui permissão para cadastrar funcionários.",
      );
    }

    const establishmentSnapshot = await db
      .collection("establishments")
      .doc(establishmentId)
      .get();

    if (!establishmentSnapshot.exists) {
      throw new HttpsError(
        "not-found",
        "Estabelecimento não encontrado.",
      );
    }

    const establishmentData =
      establishmentSnapshot.data();

    if (
      establishmentData.ownerId !== requesterUid &&
      !["admin", "manager"].includes(
        requesterProfile.role,
      )
    ) {
      throw new HttpsError(
        "permission-denied",
        "Você não possui permissão para gerenciar este estabelecimento.",
      );
    }

    const employeesReference = db
      .collection("establishments")
      .doc(establishmentId)
      .collection("employees");

    const employeesSnapshot =
      await employeesReference.get();

    const activeEmployees =
      employeesSnapshot.docs.filter(
        (employeeDocument) => {
          const employee =
            employeeDocument.data();

          return employee.status !== "blocked";
        },
      ).length;

    let maxEmployees = null;

    const subscriptionId =
      establishmentData.subscriptionId ||
      establishmentData.assinaturaId ||
      establishmentId;

    const subscriptionSnapshot = await db
      .collection("subscriptions")
      .doc(subscriptionId)
      .get();

    if (subscriptionSnapshot.exists) {
      const subscription =
        subscriptionSnapshot.data();

      const planId =
        subscription.planId ||
        subscription.planoId;

      if (planId) {
        const planSnapshot = await db
          .collection("plans")
          .doc(planId)
          .get();

        if (planSnapshot.exists) {
          const plan = planSnapshot.data();

          maxEmployees =
            plan.funcionalidades
              ?.maxFuncionarios ?? null;
        }
      }
    }

    if (
      Number.isFinite(maxEmployees) &&
      maxEmployees !== -1 &&
      activeEmployees >= maxEmployees
    ) {
      throw new HttpsError(
        "resource-exhausted",
        `O limite de ${maxEmployees} funcionário(s) do plano foi atingido.`,
      );
    }

    let createdAuthUser = null;

    try {
      createdAuthUser =
        await adminAuth.createUser({
          displayName: normalizedName,
          email: normalizedEmail,
          password: senha,
          disabled: false,
        });

      const now =
        FieldValue.serverTimestamp();

      const globalUserData = {
        uid: createdAuthUser.uid,
        nome: normalizedName,
        email: normalizedEmail,
        telefone: normalizedPhone,

        role,
        status: "active",

        estabelecimentoId:
          establishmentId,

        permissoes,

        criadoEm: now,
        atualizadoEm: now,
        criadoPor: requesterUid,
        ultimoAcesso: null,
      };

      const employeeData = {
        ...globalUserData,
        authUid: createdAuthUser.uid,
      };

      const batch = db.batch();

      const globalUserReference = db
        .collection("users")
        .doc(createdAuthUser.uid);

      const employeeReference =
        employeesReference.doc(
          createdAuthUser.uid,
        );

      batch.set(
        globalUserReference,
        globalUserData,
      );

      batch.set(
        employeeReference,
        employeeData,
      );

      await batch.commit();

      return {
        success: true,
        userId: createdAuthUser.uid,
        establishmentId,
      };
    } catch (error) {
      console.error(
        "Erro ao cadastrar funcionário:",
        error,
      );

      if (createdAuthUser?.uid) {
        try {
          await adminAuth.deleteUser(
            createdAuthUser.uid,
          );
        } catch (rollbackError) {
          console.error(
            "Erro ao desfazer criação no Authentication:",
            rollbackError,
          );
        }
      }

      if (
        error.code ===
        "auth/email-already-exists"
      ) {
        throw new HttpsError(
          "already-exists",
          "Este e-mail já está cadastrado.",
        );
      }

      if (
        error instanceof HttpsError
      ) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "Não foi possível cadastrar o funcionário.",
        {
          originalMessage:
            error?.message || null,
        },
      );
    }
  },
);

exports.updateEstablishmentUser = onCall(
  {
    region: REGION,
  },
  async (request) => {
    const {
      requesterUid,
      establishmentId,
    } = await getRequesterContext(request);

    const {
      employeeId,
      nome,
      telefone = "",
      role,
    } = request.data || {};

    if (!employeeId) {
      throw new HttpsError(
        "invalid-argument",
        "Funcionário não informado.",
      );
    }

    if (employeeId === requesterUid) {
      throw new HttpsError(
        "failed-precondition",
        "Você não pode alterar o próprio cargo por esta tela.",
      );
    }

    const normalizedName = String(
      nome || "",
    ).trim();

    const normalizedPhone = String(
      telefone || "",
    ).trim();

    if (!normalizedName) {
      throw new HttpsError(
        "invalid-argument",
        "Informe o nome do funcionário.",
      );
    }

    const allowedRoles = [
      "admin",
      "manager",
      "waiter",
      "kitchen",
      "cashier",
    ];

    if (!allowedRoles.includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        "Cargo inválido.",
      );
    }

    const employeeReference = db
      .collection("establishments")
      .doc(establishmentId)
      .collection("employees")
      .doc(employeeId);

    const employeeSnapshot =
      await employeeReference.get();

    if (!employeeSnapshot.exists) {
      throw new HttpsError(
        "not-found",
        "Funcionário não encontrado.",
      );
    }

    const employee = employeeSnapshot.data();

    if (
      employee.role === "owner" ||
      employee.role === "subscriber"
    ) {
      throw new HttpsError(
        "permission-denied",
        "O proprietário não pode ser alterado por esta tela.",
      );
    }

    const globalUserReference = db
      .collection("users")
      .doc(employeeId);

    const updateData = {
      nome: normalizedName,
      telefone: normalizedPhone,
      role,
      atualizadoEm:
        FieldValue.serverTimestamp(),
      atualizadoPor: requesterUid,
    };

    const batch = db.batch();

    batch.update(
      employeeReference,
      updateData,
    );

    batch.update(
      globalUserReference,
      updateData,
    );

    await batch.commit();

    await adminAuth.updateUser(
      employeeId,
      {
        displayName: normalizedName,
      },
    );

    return {
      success: true,
      employeeId,
    };
  },
);

exports.updateEstablishmentUserPermissions = onCall(
  {
    region: REGION,
  },
  async (request) => {
    const {
      requesterUid,
      requesterProfile,
      establishmentId,
    } = await getRequesterContext(request);

    const {
      employeeId,
      permissoes,
    } = request.data || {};

    if (!employeeId) {
      throw new HttpsError(
        "invalid-argument",
        "Funcionário não informado.",
      );
    }

    if (
      !permissoes ||
      typeof permissoes !== "object" ||
      Array.isArray(permissoes)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Permissões inválidas.",
      );
    }

    const allowedPermissions = [
      "pedidos",
      "cozinha",
      "produtos",
      "categorias",
      "mesas",
      "mapaMesas",
      "funcionarios",
      "assinatura",
      "configuracoes",
    ];

    const normalizedPermissions = {};

    allowedPermissions.forEach(
      (permission) => {
        normalizedPermissions[permission] =
          permissoes[permission] === true;
      },
    );

    /*
     * Somente proprietário ou administrador
     * pode liberar gestão de funcionários e
     * configurações.
     */
    if (
      requesterProfile.role === "manager"
    ) {
      normalizedPermissions.funcionarios =
        false;

      normalizedPermissions.configuracoes =
        false;

      normalizedPermissions.assinatura =
        false;
    }

    const employeeReference = db
      .collection("establishments")
      .doc(establishmentId)
      .collection("employees")
      .doc(employeeId);

    const employeeSnapshot =
      await employeeReference.get();

    if (!employeeSnapshot.exists) {
      throw new HttpsError(
        "not-found",
        "Funcionário não encontrado.",
      );
    }

    const employee = employeeSnapshot.data();

    if (
      employee.role === "owner" ||
      employee.role === "subscriber"
    ) {
      throw new HttpsError(
        "permission-denied",
        "As permissões do proprietário não podem ser alteradas.",
      );
    }

    const updateData = {
      permissoes: normalizedPermissions,
      atualizadoEm:
        FieldValue.serverTimestamp(),
      atualizadoPor: requesterUid,
    };

    const batch = db.batch();

    batch.update(
      employeeReference,
      updateData,
    );

    batch.update(
      db.collection("users").doc(employeeId),
      updateData,
    );

    await batch.commit();

    return {
      success: true,
      employeeId,
      permissoes: normalizedPermissions,
    };
  },
);

exports.updateEstablishmentUserStatus = onCall(
  {
    region: REGION,
  },
  async (request) => {
    const {
      requesterUid,
      establishmentId,
    } = await getRequesterContext(request);

    const {
      employeeId,
      status,
    } = request.data || {};

    if (!employeeId) {
      throw new HttpsError(
        "invalid-argument",
        "Funcionário não informado.",
      );
    }

    if (
      !["active", "blocked"].includes(
        status,
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Status inválido.",
      );
    }

    if (employeeId === requesterUid) {
      throw new HttpsError(
        "failed-precondition",
        "Você não pode bloquear o próprio usuário.",
      );
    }

    const employeeReference = db
      .collection("establishments")
      .doc(establishmentId)
      .collection("employees")
      .doc(employeeId);

    const employeeSnapshot =
      await employeeReference.get();

    if (!employeeSnapshot.exists) {
      throw new HttpsError(
        "not-found",
        "Funcionário não encontrado.",
      );
    }

    const employee = employeeSnapshot.data();

    if (
      employee.role === "owner" ||
      employee.role === "subscriber"
    ) {
      throw new HttpsError(
        "permission-denied",
        "O proprietário não pode ser bloqueado.",
      );
    }

    const updateData = {
      status,
      atualizadoEm:
        FieldValue.serverTimestamp(),
      atualizadoPor: requesterUid,
    };

    const batch = db.batch();

    batch.update(
      employeeReference,
      updateData,
    );

    batch.update(
      db.collection("users").doc(employeeId),
      updateData,
    );

    await batch.commit();

    await adminAuth.updateUser(
      employeeId,
      {
        disabled: status === "blocked",
      },
    );

    return {
      success: true,
      employeeId,
      status,
    };
  },
);