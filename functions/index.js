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
  Timestamp,
} = require("firebase-admin/firestore");

const {
  getAuth,
} = require("firebase-admin/auth");

const {
  defineSecret,
} = require(
    "firebase-functions/params",
);

initializeApp();

const db = getFirestore();

const adminAuth = getAuth();

const REGION = "southamerica-east1";

const GOOGLE_MAPS_ROUTES_API_KEY =
  defineSecret(
      "GOOGLE_MAPS_ROUTES_API_KEY",
  );

/**
 * Obtém e valida o contexto do usuário autenticado.
 *
 * Verifica se existe um usuário autenticado, carrega
 * seu perfil no Firestore e retorna as informações
 * necessárias para validar permissões.
 *
 * @param {Object} request Requisição recebida pela Callable Function.
 * @return {Promise<Object>} Contexto do usuário autenticado.
 */
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

      const setupKey = request.data && request.data.setupKey;

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

            if (
              plan.funcionalidades &&
            plan.funcionalidades.maxFuncionarios !== undefined &&
            plan.funcionalidades.maxFuncionarios !== null
            ) {
              maxEmployees =
              plan.funcionalidades.maxFuncionarios;
            } else {
              maxEmployees = null;
            }
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

        if (
          createdAuthUser &&
          createdAuthUser.uid
        ) {
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
            error && error.message ?
              error.message :
              null,
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

/**
 * Mantém apenas os caracteres numéricos de um valor.
 *
 * @param {*} value Valor que será normalizado.
 * @return {string} Texto contendo apenas números.
 */
function onlyNumbers(value) {
  return String(
      value || "",
  ).replace(/\D/g, "");
}

/**
 * Normaliza um valor para texto sem espaços externos.
 *
 * @param {*} value Valor que será normalizado.
 * @return {string} Texto normalizado.
 */
function normalizeText(value) {
  return String(
      value || "",
  ).trim();
}

/**
 * Cria um slug a partir de um texto.
 *
 * @param {*} value Texto usado para gerar o slug.
 * @return {string} Slug normalizado.
 */
function createSlug(value) {
  return String(
      value || "",
  )
      .normalize("NFD")
      .replace(
          /[\u0300-\u036f]/g,
          "",
      )
      .toLowerCase()
      .trim()
      .replace(
          /[^a-z0-9]+/g,
          "-",
      )
      .replace(
          /^-+|-+$/g,
          "",
      );
}

/**
 * Gera uma senha temporária para um novo usuário.
 *
 * @return {string} Senha temporária gerada.
 */
function generateTemporaryPassword() {
  const randomPart =
    Math.random()
        .toString(36)
        .slice(2, 10);

  const secondPart =
    Math.random()
        .toString(36)
        .slice(2, 6);

  return `Cn10!${randomPart}${secondPart}`;
}

exports.createEstablishmentByAdmin =
  onCall(
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

        const adminUid =
        request.auth.uid;

        const adminSnapshot =
        await db
            .collection("users")
            .doc(adminUid)
            .get();

        if (!adminSnapshot.exists) {
          throw new HttpsError(
              "permission-denied",
              "Perfil administrativo não encontrado.",
          );
        }

        const adminData =
        adminSnapshot.data();

        if (
          adminData.role !==
          "super_admin" ||
        adminData.status !==
          "active"
        ) {
          throw new HttpsError(
              "permission-denied",
              "Acesso permitido somente ao administrador da plataforma.",
          );
        }

        const data =
        request.data || {};

        const nomeEstabelecimento =
        String(
            data.nomeEstabelecimento || "",
        ).trim();

        const nomeResponsavel =
        String(
            data.nomeResponsavel || "",
        ).trim();

        const email =
        String(
            data.email || "",
        )
            .trim()
            .toLowerCase();

        const telefone =
        String(
            data.telefone || "",
        ).replace(/\D/g, "");

        const cpf =
        String(
            data.cpf || "",
        ).replace(/\D/g, "");

        const cnpj =
        String(
            data.cnpj || "",
        ).replace(/\D/g, "");

        const endereco =
        data.endereco || {};

        if (!nomeEstabelecimento) {
          throw new HttpsError(
              "invalid-argument",
              "Informe o nome do estabelecimento.",
          );
        }

        if (!nomeResponsavel) {
          throw new HttpsError(
              "invalid-argument",
              "Informe o nome do responsável.",
          );
        }

        if (!email) {
          throw new HttpsError(
              "invalid-argument",
              "Informe o e-mail do responsável.",
          );
        }

        let createdUser = null;

        try {
        /*
         * 1. Verifica se o e-mail já existe.
         */
          try {
            await adminAuth
                .getUserByEmail(email);

            throw new HttpsError(
                "already-exists",
                "Já existe um usuário cadastrado com este e-mail.",
            );
          } catch (error) {
            if (
              error instanceof
              HttpsError
            ) {
              throw error;
            }

            if (
              error.code !==
            "auth/user-not-found"
            ) {
              throw error;
            }
          }

          /*
         * 2. Cria senha temporária.
         */
          const temporaryPassword =
          generateTemporaryPassword();

          /*
         * 3. Cria o proprietário
         * no Firebase Authentication.
         */
          createdUser =
          await adminAuth.createUser({
            email,
            password:
              temporaryPassword,

            displayName:
              nomeResponsavel,

            disabled: false,
          });

          const ownerUid =
          createdUser.uid;

          /*
         * 4. Cria o ID do estabelecimento.
         */
          const establishmentRef =
          db
              .collection(
                  "establishments",
              )
              .doc();

          const establishmentId =
          establishmentRef.id;

          const subscriptionRef =
          db
              .collection(
                  "subscriptions",
              )
              .doc(
                  establishmentId,
              );

          const userRef =
          db
              .collection("users")
              .doc(ownerUid);

          const settingsRef =
          establishmentRef
              .collection("settings")
              .doc("general");

          /*
         * 5. Teste grátis de 30 dias.
         */
          const trialStart =
          new Date();

          const trialEnd =
          new Date(
              trialStart,
          );

          trialEnd.setDate(
              trialEnd.getDate() +
            30,
          );

          /*
         * 6. Busca o plano básico.
         */
          const basicPlanRef =
          db
              .collection("plans")
              .doc("basic");

          const basicPlanSnapshot =
          await basicPlanRef.get();

          if (
            !basicPlanSnapshot.exists
          ) {
            throw new Error(
                "O plano Básico não foi encontrado.",
            );
          }

          const basicPlan =
          basicPlanSnapshot.data();

          const batch =
          db.batch();

          /*
         * 7. Perfil do usuário.
         */
          batch.set(
              userRef,
              {
                nome:
              nomeResponsavel,

                email,

                cpf,

                telefone,

                role:
              "subscriber",

                status:
              "active",

                estabelecimentoId:
              establishmentId,

                criadoEm:
              FieldValue
                  .serverTimestamp(),

                atualizadoEm:
              FieldValue
                  .serverTimestamp(),

                criadoPorAdmin:
              adminUid,
              },
          );

          /*
         * 8. Estabelecimento.
         */
          batch.set(
              establishmentRef,
              {
                ownerId:
              ownerUid,

                nome:
              nomeEstabelecimento,

                slug:
              createSlug(
                  nomeEstabelecimento,
              ),

                responsavel: {
                  nome:
                nomeResponsavel,
                  cpf,
                },

                documento: {
                  tipo:
                cnpj ?
                  "cnpj" :
                  "cpf",

                  numero:
                cnpj ||
                cpf,
                },

                email,

                telefone,

                endereco: {
                  cep:
                onlyNumbers(
                    endereco.cep,
                ),

                  rua:
                normalizeText(
                    endereco.rua,
                ),

                  numero:
                normalizeText(
                    endereco.numero,
                ),

                  complemento:
                normalizeText(
                    endereco
                        .complemento,
                ),

                  bairro:
                normalizeText(
                    endereco.bairro,
                ),

                  cidade:
                normalizeText(
                    endereco.cidade,
                ),

                  estado:
                normalizeText(
                    endereco.estado,
                )
                    .toUpperCase(),
                },

                planoAtual:
              "basic",

                assinaturaId:
              establishmentId,

                assinaturaStatus:
              "trial",

                status:
              "active",

                criadoEm:
              FieldValue
                  .serverTimestamp(),

                atualizadoEm:
              FieldValue
                  .serverTimestamp(),

                criadoPorAdmin:
              adminUid,
              },
          );

          /*
         * 9. Configurações iniciais.
         */
          batch.set(
              settingsRef,
              {
                nomeExibicao:
              nomeEstabelecimento,

                logoUrl: "",
                logoPath: "",

                corPrincipal:
              "#f97316",

                moeda:
              "BRL",

                idioma:
              "pt-BR",

                fusoHorario:
              "America/Sao_Paulo",

                receberPedidos:
              true,

                receberChamados:
              true,

                permitirChamados:
              true,

                aceitarPedidos:
              true,

                permitirEdicaoPedido:
              true,

                exigirConfirmacaoCancelamento:
              true,

                taxaServicoHabilitada:
              false,

                percentualTaxaServico:
              0,

                tempoMedioPreparo:
              30,

                tema:
              "light",

                criadoEm:
              FieldValue
                  .serverTimestamp(),

                atualizadoEm:
              FieldValue
                  .serverTimestamp(),
              },
          );

          /*
         * 10. Assinatura inicial.
         */
          batch.set(
              subscriptionRef,
              {
                userId:
              ownerUid,

                establishmentId,

                planId:
              "basic",

                planName:
              basicPlan.nome ||
              "Básico",

                status:
              "trial",

                periodoTeste: {
                  habilitado:
                true,

                  dias:
                30,

                  inicio:
                Timestamp
                    .fromDate(
                        trialStart,
                    ),

                  fim:
                Timestamp
                    .fromDate(
                        trialEnd,
                    ),
                },

                valorAtual:
              0,

                proximoValor:
              Number(
                  basicPlan
                      .precoMensal ||
                  0,
              ),

                proximaCobrancaEm:
              Timestamp
                  .fromDate(
                      trialEnd,
                  ),

                renovacaoAutomatica:
              false,

                mercadoPagoPreapprovalId:
              null,

                mercadoPagoCustomerId:
              null,

                criadoEm:
              FieldValue
                  .serverTimestamp(),

                atualizadoEm:
              FieldValue
                  .serverTimestamp(),
              },
          );

          /*
         * 11. Categorias iniciais.
         */
          const initialCategories = [
            {
              id: "bebidas",
              nome: "Bebidas",
              descricao:
              "Sucos, refrigerantes e bebidas",
              icone: "🥤",
              ordem: 1,
            },
            {
              id: "porcoes",
              nome: "Porções",
              descricao:
              "Petiscos e entradas",
              icone: "🍟",
              ordem: 2,
            },
            {
              id: "lanches",
              nome: "Lanches",
              descricao:
              "Hambúrgueres e sanduíches",
              icone: "🍔",
              ordem: 3,
            },
            {
              id: "sobremesas",
              nome: "Sobremesas",
              descricao:
              "Doces e sobremesas",
              icone: "🍰",
              ordem: 4,
            },
          ];

          initialCategories.forEach(
              (category) => {
                const categoryRef =
              establishmentRef
                  .collection(
                      "categories",
                  )
                  .doc(
                      category.id,
                  );

                batch.set(
                    categoryRef,
                    {
                      nome:
                  category.nome,

                      descricao:
                  category.descricao,

                      icone:
                  category.icone,

                      ordem:
                  category.ordem,

                      ativa:
                  true,

                      criadoEm:
                  FieldValue
                      .serverTimestamp(),

                      atualizadoEm:
                  FieldValue
                      .serverTimestamp(),
                    },
                );
              },
          );

          /*
         * 12. Mesas iniciais.
         */
          for (
            let tableNumber = 1;
            tableNumber <= 4;
            tableNumber += 1
          ) {
            const tableRef =
            establishmentRef
                .collection("tables")
                .doc(
                    `mesa-${tableNumber}`,
                );

            batch.set(
                tableRef,
                {
                  numero:
                tableNumber,

                  nome:
                `Mesa ${tableNumber}`,

                  descricao: "",

                  token:
                `${establishmentId}-${tableNumber}`,

                  ativa:
                true,

                  criadoEm:
                FieldValue
                    .serverTimestamp(),

                  atualizadoEm:
                FieldValue
                    .serverTimestamp(),
                },
            );
          }

          /*
         * 13. Incrementa contador do plano.
         */
          batch.update(
              basicPlanRef,
              {
                totalAssinantes:
              FieldValue
                  .increment(1),

                atualizadoEm:
              FieldValue
                  .serverTimestamp(),
              },
          );

          /*
         * 14. Executa tudo.
         */
          await batch.commit();

          /*
         * 15. Retorna senha temporária
         * para o Super Admin.
         *
         * Depois podemos trocar isso por
         * e-mail de definição de senha.
         */
          return {
            success: true,

            establishmentId,

            userId:
            ownerUid,

            email,

            temporaryPassword,

            trialEndsAt:
            trialEnd.toISOString(),

            message:
            "Estabelecimento criado com sucesso.",
          };
        } catch (error) {
          console.error(
              "Erro ao criar estabelecimento pelo Super Admin:",
              error,
          );

          /*
         * Se o usuário foi criado no Auth,
         * mas alguma etapa posterior falhou,
         * removemos para evitar conta órfã.
         */
          if (
            createdUser &&
          createdUser.uid
          ) {
            try {
              await adminAuth
                  .deleteUser(
                      createdUser.uid,
                  );
            } catch (
              rollbackError
            ) {
              console.error(
                  "Erro ao remover usuário durante rollback:",
                  rollbackError,
              );
            }
          }

          if (
            error instanceof
            HttpsError
          ) {
            throw error;
          }

          throw new HttpsError(
              "internal",
          error && error.message ?
            error.message :
            "Não foi possível criar o estabelecimento.",
          );
        }
      },
  );

exports.calculateDeliveryRoute =
  onCall(
      {
        region: REGION,

        secrets: [
          GOOGLE_MAPS_ROUTES_API_KEY,
        ],
      },

      async (request) => {
        if (!request.auth) {
          throw new HttpsError(
              "unauthenticated",
              "É necessário estar autenticado.",
          );
        }

        const {
          origin,
          destination,
        } = request.data || {};

        const originLatitude =
        Number(
            origin &&
          origin.latitude,
        );

        const originLongitude =
        Number(
            origin &&
          origin.longitude,
        );

        const destinationLatitude =
        Number(
            destination &&
          destination.latitude,
        );

        const destinationLongitude =
        Number(
            destination &&
          destination.longitude,
        );

        if (
          !Number.isFinite(
              originLatitude,
          ) ||
        !Number.isFinite(
            originLongitude,
        )
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Localização de origem inválida.",
          );
        }

        if (
          !Number.isFinite(
              destinationLatitude,
          ) ||
        !Number.isFinite(
            destinationLongitude,
        )
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Localização de destino inválida.",
          );
        }

        const response =
        await fetch(
            "https://routes.googleapis.com/directions/v2:computeRoutes",
            {
              method: "POST",

              headers: {
                "Content-Type":
                "application/json",

                "X-Goog-Api-Key":
                GOOGLE_MAPS_ROUTES_API_KEY
                    .value(),

                "X-Goog-FieldMask":
                [
                  "routes.distanceMeters",
                  "routes.duration",
                  "routes.polyline.encodedPolyline",
                ].join(","),
              },

              body: JSON.stringify({
                origin: {
                  location: {
                    latLng: {
                      latitude:
                      originLatitude,

                      longitude:
                      originLongitude,
                    },
                  },
                },

                destination: {
                  location: {
                    latLng: {
                      latitude:
                      destinationLatitude,

                      longitude:
                      destinationLongitude,
                    },
                  },
                },

                travelMode: "DRIVE",

                routingPreference:
                "TRAFFIC_AWARE",
              }),
            },
        );

        if (!response.ok) {
          const errorBody =
          await response.text();

          console.error(
              "Erro Routes API:",
              response.status,
              errorBody,
          );

          throw new HttpsError(
              "internal",
              "Não foi possível calcular a rota.",
          );
        }

        const data =
        await response.json();

        const route =
        data.routes &&
        data.routes[0] ?
          data.routes[0] :
          null;

        if (!route) {
          throw new HttpsError(
              "not-found",
              "Nenhuma rota encontrada.",
          );
        }

        const durationSeconds =
        Number(
            String(
                route.duration || "0s",
            ).replace("s", ""),
        );

        return {
          distanceMeters:
          route.distanceMeters || 0,

          distanceKm:
          Number(
              (
                Number(
                    route.distanceMeters ||
                  0,
                ) / 1000
              ).toFixed(1),
          ),

          durationSeconds,

          durationMinutes:
          Math.ceil(
              durationSeconds / 60,
          ),

          encodedPolyline:
          route.polyline &&
          route.polyline.encodedPolyline ?
            route.polyline.encodedPolyline :
            "",
        };
      },
  );
