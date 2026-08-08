import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebaseConfig.js";

const INITIAL_CATEGORIES = [
  {
    id: "bebidas",
    nome: "Bebidas",
    descricao: "Sucos, refrigerantes e drinks",
    icone: "🥤",
    ordem: 1,
  },
  {
    id: "porcoes",
    nome: "Porções",
    descricao: "Petiscos e entradas para compartilhar",
    icone: "🍟",
    ordem: 2,
  },
  {
    id: "lanches",
    nome: "Lanches",
    descricao: "Hambúrgueres e sanduíches",
    icone: "🍔",
    ordem: 3,
  },
  {
    id: "sobremesas",
    nome: "Sobremesas",
    descricao: "Doces e sobremesas",
    icone: "🍰",
    ordem: 4,
  },
];

const INITIAL_TABLES = [
  {
    numero: 1,
    nome: "Mesa 1",
    descricao: "Mesa perto da janela",
  },
  {
    numero: 2,
    nome: "Mesa 2",
    descricao: "Mesa central",
  },
  {
    numero: 3,
    nome: "Mesa 3",
    descricao: "Mesa no terraço",
  },
  {
    numero: 4,
    nome: "Mesa 4",
    descricao: "Mesa reservada",
  },
];

function somenteNumeros(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizarTexto(value) {
  return String(value || "").trim();
}

function normalizarEmail(value) {
  return normalizarTexto(value).toLowerCase();
}

function criarSlug(value) {
  return normalizarTexto(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function validarDados(dados) {
  if (!normalizarTexto(dados.nomeResponsavel)) {
    throw new Error("Informe o nome do responsável.");
  }

  if (somenteNumeros(dados.cpf).length !== 11) {
    throw new Error("Informe um CPF válido.");
  }

  if (!normalizarTexto(dados.nomeEstabelecimento)) {
    throw new Error("Informe o nome do estabelecimento.");
  }

  if (!normalizarEmail(dados.email)) {
    throw new Error("Informe o e-mail do estabelecimento.");
  }

  if (somenteNumeros(dados.telefone).length < 10) {
    throw new Error("Informe um telefone válido.");
  }

  if (somenteNumeros(dados.endereco?.cep).length !== 8) {
    throw new Error("Informe um CEP válido.");
  }

  if (!normalizarTexto(dados.endereco?.rua)) {
    throw new Error("Informe a rua.");
  }

  if (!normalizarTexto(dados.endereco?.numero)) {
    throw new Error("Informe o número do local.");
  }

  if (!normalizarTexto(dados.endereco?.bairro)) {
    throw new Error("Informe o bairro.");
  }

  if (!normalizarTexto(dados.endereco?.cidade)) {
    throw new Error("Informe a cidade.");
  }

  if (normalizarTexto(dados.endereco?.estado).length !== 2) {
    throw new Error("Informe a sigla do estado.");
  }
}

export async function criarEstruturaInicialEstabelecimento(dados) {
  validarDados(dados);

  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error(
      "Você precisa estar autenticado para criar o estabelecimento.",
    );
  }

  const userReference = doc(
    db,
    "users",
    usuario.uid,
  );

  const userSnapshot = await getDoc(userReference);

  if (!userSnapshot.exists()) {
    throw new Error(
      "O perfil do usuário não foi encontrado.",
    );
  }

  const userData = userSnapshot.data();

  if (userData.estabelecimentoId) {
    throw new Error(
      "Este usuário já possui um estabelecimento cadastrado.",
    );
  }

  const establishmentReference = doc(
    collection(db, "establishments"),
  );

  const establishmentId =
    establishmentReference.id;

  /*
   * A assinatura terá o mesmo ID do estabelecimento.
   * Isso impede criar duas assinaturas principais
   * para o mesmo estabelecimento.
   */
  const subscriptionReference = doc(
    db,
    "subscriptions",
    establishmentId,
  );

  const inicioTeste = new Date();
  const fimTeste = new Date(inicioTeste);

  fimTeste.setDate(
    fimTeste.getDate() + 30,
  );

  const batch = writeBatch(db);

  batch.set(establishmentReference, {
    ownerId: usuario.uid,

    nome: normalizarTexto(
      dados.nomeEstabelecimento,
    ),

    slug: criarSlug(
      dados.nomeEstabelecimento,
    ),

    responsavel: {
      nome: normalizarTexto(
        dados.nomeResponsavel,
      ),
      cpf: somenteNumeros(dados.cpf),
    },

    documento: {
      tipo: somenteNumeros(dados.cnpj)
        ? "cnpj"
        : "cpf",

      numero:
        somenteNumeros(dados.cnpj) ||
        somenteNumeros(dados.cpf),
    },

    email: normalizarEmail(dados.email),

    telefone: somenteNumeros(
      dados.telefone,
    ),

    endereco: {
      cep: somenteNumeros(
        dados.endereco.cep,
      ),

      rua: normalizarTexto(
        dados.endereco.rua,
      ),

      numero: normalizarTexto(
        dados.endereco.numero,
      ),

      complemento: normalizarTexto(
        dados.endereco.complemento,
      ),

      bairro: normalizarTexto(
        dados.endereco.bairro,
      ),

      cidade: normalizarTexto(
        dados.endereco.cidade,
      ),

      estado: normalizarTexto(
        dados.endereco.estado,
      ).toUpperCase(),
    },

    planoAtual: "basic",
    assinaturaId: establishmentId,
    assinaturaStatus: "trial",

    status: "active",

    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  INITIAL_CATEGORIES.forEach((category) => {
    const categoryReference = doc(
      db,
      "establishments",
      establishmentId,
      "categories",
      category.id,
    );

    batch.set(categoryReference, {
      nome: category.nome,
      descricao: category.descricao,
      icone: category.icone,
      ordem: category.ordem,

      ativa: true,

      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });

  INITIAL_TABLES.forEach((table) => {
    const tableId = `mesa-${table.numero}`;

    const tableReference = doc(
      db,
      "establishments",
      establishmentId,
      "tables",
      tableId,
    );

    batch.set(tableReference, {
      numero: table.numero,
      nome: table.nome,
      descricao: table.descricao,

      /*
       * Depois criaremos um token aleatório
       * e o QR Code real para cada mesa.
       */
      token: `${establishmentId}-${table.numero}`,

      ativa: true,

      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });

  const settingsReference = doc(
    db,
    "establishments",
    establishmentId,
    "settings",
    "general",
  );

  batch.set(settingsReference, {
    moeda: "BRL",
    idioma: "pt-BR",
    fusoHorario: "America/Sao_Paulo",

    receberPedidos: true,
    receberChamados: true,

    taxaServicoHabilitada: false,
    percentualTaxaServico: 0,

    tema: "light",

    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  batch.set(subscriptionReference, {
    userId: usuario.uid,
    establishmentId,

    planId: "basic",
    planName: "Básico",

    status: "trial",

    periodoTeste: {
      habilitado: true,
      dias: 30,
      inicio: Timestamp.fromDate(
        inicioTeste,
      ),
      fim: Timestamp.fromDate(
        fimTeste,
      ),
    },

    valorAtual: 0,
    proximoValor: 3990,

    proximaCobrancaEm:
      Timestamp.fromDate(fimTeste),

    renovacaoAutomatica: false,

    mercadoPagoPreapprovalId: null,
    mercadoPagoCustomerId: null,

    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  batch.update(userReference, {
    nome: normalizarTexto(
      dados.nomeResponsavel,
    ),

    cpf: somenteNumeros(dados.cpf),

    telefone: somenteNumeros(
      dados.telefone,
    ),

    estabelecimentoId: establishmentId,
    
    status: "active",

    atualizadoEm: serverTimestamp(),
  });

  await batch.commit();

  return {
    establishmentId,
    subscriptionId: establishmentId,
    trialEndsAt: fimTeste,
  };
}

export async function listarEstabelecimentos() {
  const establishmentsQuery = query(
    collection(db, "establishments"),
    orderBy("nome"),
  );

  const snapshot = await getDocs(
    establishmentsQuery,
  );

  return snapshot.docs.map(
    (documentSnapshot) => ({
      id: documentSnapshot.id,
      ...documentSnapshot.data(),
    }),
  );
}

export async function buscarEstabelecimento(id) {
  if (!id) {
    throw new Error(
      "Informe o estabelecimento.",
    );
  }

  const reference = doc(
    db,
    "establishments",
    id,
  );

  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) {
    throw new Error(
      "Estabelecimento não encontrado.",
    );
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function atualizarStatusEstabelecimento(
  id,
  status,
) {
  const allowedStatuses = [
    "active",
    "blocked",
  ];

  if (!id) {
    throw new Error(
      "Informe o estabelecimento.",
    );
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error(
      "Status de estabelecimento inválido.",
    );
  }

  await updateDoc(
    doc(db, "establishments", id),
    {
      status,
      atualizadoEm: serverTimestamp(),
    },
  );
}

export async function atualizarEstabelecimento(
  id,
  dados,
) {
  if (!id) {
    throw new Error(
      "Informe o estabelecimento.",
    );
  }

  if (!dados) {
    throw new Error(
      "Informe os dados do estabelecimento.",
    );
  }

  const nome = String(
    dados.nome || "",
  ).trim();

  const email = String(
    dados.email || "",
  )
    .trim()
    .toLowerCase();

  const telefone = String(
    dados.telefone || "",
  ).trim();

  const responsavelNome = String(
    dados.responsavelNome || "",
  ).trim();

  if (!nome) {
    throw new Error(
      "Informe o nome do estabelecimento.",
    );
  }

  if (!email) {
    throw new Error(
      "Informe o e-mail do estabelecimento.",
    );
  }

  const endereco =
    dados.endereco || {};

  await updateDoc(
    doc(
      db,
      "establishments",
      id,
    ),
    {
      nome,
      email,
      telefone,

      "responsavel.nome":
        responsavelNome,

      "endereco.cep":
        String(
          endereco.cep || "",
        ).trim(),

      "endereco.rua":
        String(
          endereco.rua || "",
        ).trim(),

      "endereco.numero":
        String(
          endereco.numero || "",
        ).trim(),

      "endereco.complemento":
        String(
          endereco.complemento || "",
        ).trim(),

      "endereco.bairro":
        String(
          endereco.bairro || "",
        ).trim(),

      "endereco.cidade":
        String(
          endereco.cidade || "",
        ).trim(),

      "endereco.estado":
        String(
          endereco.estado || "",
        )
          .trim()
          .toUpperCase(),

      atualizadoEm:
        serverTimestamp(),
    },
  );
}