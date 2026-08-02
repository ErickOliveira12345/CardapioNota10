export const USER_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  WAITER: "waiter",
  KITCHEN: "kitchen",
  CASHIER: "cashier",
};

export const USER_ROLE_LABELS = {
  owner: "Proprietário",
  admin: "Administrador",
  manager: "Gerente",
  waiter: "Garçom",
  kitchen: "Cozinha",
  cashier: "Caixa",
};

export const USER_ROLE_OPTIONS = [
  {
    value: USER_ROLES.ADMIN,
    label: "Administrador",
  },
  {
    value: USER_ROLES.MANAGER,
    label: "Gerente",
  },
  {
    value: USER_ROLES.WAITER,
    label: "Garçom",
  },
  {
    value: USER_ROLES.KITCHEN,
    label: "Cozinha",
  },
  {
    value: USER_ROLES.CASHIER,
    label: "Caixa",
  },
];


export const DEFAULT_ROLE_PERMISSIONS = {
  owner: {
    pedidos: true,
    cozinha: true,
    produtos: true,
    categorias: true,
    mesas: true,
    mapaMesas: true,
    funcionarios: true,
    assinatura: true,
    configuracoes: true,
  },

  admin: {
    pedidos: true,
    cozinha: true,
    produtos: true,
    categorias: true,
    mesas: true,
    mapaMesas: true,
    funcionarios: true,
    assinatura: false,
    configuracoes: true,
  },

  manager: {
    pedidos: true,
    cozinha: true,
    produtos: true,
    categorias: true,
    mesas: true,
    mapaMesas: true,
    funcionarios: true,
    assinatura: false,
    configuracoes: false,
  },

  waiter: {
    pedidos: true,
    cozinha: false,
    produtos: false,
    categorias: false,
    mesas: true,
    mapaMesas: true,
    funcionarios: false,
    assinatura: false,
    configuracoes: false,
  },

  kitchen: {
    pedidos: true,
    cozinha: true,
    produtos: false,
    categorias: false,
    mesas: false,
    mapaMesas: false,
    funcionarios: false,
    assinatura: false,
    configuracoes: false,
  },

  cashier: {
    pedidos: true,
    cozinha: false,
    produtos: false,
    categorias: false,
    mesas: true,
    mapaMesas: true,
    funcionarios: false,
    assinatura: false,
    configuracoes: false,
  },
};