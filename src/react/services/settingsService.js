import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebaseConfig.js";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import {
  storage,
} from "../firebase/firebaseConfig.js";

function establishmentReference(
  establishmentId,
) {
  return doc(
    db,
    "establishments",
    establishmentId,
  );
}

function settingsReference(
  establishmentId,
) {
  return doc(
    db,
    "establishments",
    establishmentId,
    "settings",
    "general",
  );
}

function normalizeEstablishmentData(
  establishment = {},
  settings = {},
) {
  const endereco =
    establishment.endereco &&
    typeof establishment.endereco === "object"
      ? establishment.endereco
      : {};

  const localizacao =
    establishment.localizacao &&
    typeof establishment.localizacao ===
      "object"
      ? establishment.localizacao
      : {};

  const responsavel =
    establishment.responsavel &&
    typeof establishment.responsavel === "object"
      ? establishment.responsavel
      : {};

  const documento =
    establishment.documento &&
    typeof establishment.documento === "object"
      ? establishment.documento
      : {};

  return {
    /*
     * Dados gerais.
     */
    nome:
      establishment.nome || "",

    slug:
      establishment.slug || "",

    email:
      establishment.email || "",

    telefone:
      establishment.telefone || "",

    status:
      establishment.status || "active",

    /*
     * Documento do estabelecimento.
     */
    documentoTipo:
      documento.tipo || "cpf",

    documentoNumero:
      documento.numero || "",

    /*
     * Responsável.
     */
    responsavelNome:
      responsavel.nome || "",

    responsavelCpf:
      responsavel.cpf || "",

    /*
     * Endereço.
     */
    cep:
      endereco.cep || "",

    rua:
      endereco.rua || "",

    numero:
      endereco.numero || "",

    complemento:
      endereco.complemento || "",

    bairro:
      endereco.bairro || "",

    cidade:
      endereco.cidade || "",

    estado:
      endereco.estado || "",

    /*
    * Coordenadas geográficas.
    */
    latitude:
      localizacao.latitude ?? "",

    longitude:
      localizacao.longitude ?? "",

    /*
     * Aparência.
     */
    nomeExibicao:
      settings.nomeExibicao ||
      establishment.nome ||
      "",

    corPrincipal:
      settings.corPrincipal ||
      "#f97316",

    logoUrl:
      settings.logoUrl || "",

    logoPath:
      settings.logoPath || "",

    tema:
      settings.tema || "light",

    /*
     * Regionalização.
     */
    moeda:
      settings.moeda || "BRL",

    idioma:
      settings.idioma || "pt-BR",

    fusoHorario:
      settings.fusoHorario ||
      "America/Sao_Paulo",

    /*
     * Pedidos e atendimento.
     */
    receberPedidos:
      settings.receberPedidos ??
      true,

    receberChamados:
      settings.receberChamados ??
      true,

    aceitarPedidos:
      settings.aceitarPedidos ??
      settings.receberPedidos ??
      true,

    permitirChamados:
      settings.permitirChamados ??
      settings.receberChamados ??
      true,

    permitirEdicaoPedido:
      settings.permitirEdicaoPedido ??
      true,

    tempoMedioPreparo:
      Number(
        settings.tempoMedioPreparo,
      ) || 30,

    mensagemPedido:
      settings.mensagemPedido || "",

    /*
     * Taxa de serviço.
     */
    taxaServicoHabilitada:
      settings.taxaServicoHabilitada ??
      false,

    percentualTaxaServico:
      Number(
        settings.percentualTaxaServico,
      ) || 0,

    /*
     * Segurança.
     */
    exigirConfirmacaoCancelamento:
      settings
        .exigirConfirmacaoCancelamento ??
      true,
  };
}

export function observeEstablishmentSettings(
  establishmentId,
  onChange,
  onError,
) {
  if (!establishmentId) {
    onChange({});
    return () => {};
  }

  let establishmentData = {};
  let settingsData = {};

  let establishmentLoaded = false;
  let settingsLoaded = false;

  function emitData() {
    if (
      !establishmentLoaded ||
      !settingsLoaded
    ) {
      return;
    }

    onChange(
      normalizeEstablishmentData(
        establishmentData,
        settingsData,
      ),
    );
  }

  const stopEstablishment =
    onSnapshot(
      establishmentReference(
        establishmentId,
      ),

      (snapshot) => {
        establishmentData =
          snapshot.exists()
            ? snapshot.data()
            : {};

        establishmentLoaded = true;

        emitData();
      },

      (error) => {
        console.error(
          "Erro ao carregar estabelecimento:",
          error,
        );

        onError?.(error);
      },
    );

  const stopSettings =
    onSnapshot(
      settingsReference(
        establishmentId,
      ),

      (snapshot) => {
        settingsData =
          snapshot.exists()
            ? snapshot.data()
            : {};

        settingsLoaded = true;

        emitData();
      },

      (error) => {
        console.error(
          "Erro ao carregar configurações:",
          error,
        );

        onError?.(error);
      },
    );

  return () => {
    stopEstablishment();
    stopSettings();
  };
}

export async function saveEstablishmentSettings({
  establishmentId,
  form,
}) {
  if (!establishmentId) {
    throw new Error(
      "Estabelecimento não identificado.",
    );
  }

  const establishmentData = {
    nome: String(
      form.nome || "",
    ).trim(),

    email: String(
      form.email || "",
    )
      .trim()
      .toLowerCase(),

    telefone: String(
      form.telefone || "",
    ).replace(/\D/g, ""),

    documento: {
      tipo:
        form.documentoTipo === "cnpj"
          ? "cnpj"
          : "cpf",

      numero: String(
        form.documentoNumero || "",
      ).replace(/\D/g, ""),
    },

    responsavel: {
      nome: String(
        form.responsavelNome || "",
      ).trim(),

      cpf: String(
        form.responsavelCpf || "",
      ).replace(/\D/g, ""),
    },

    endereco: {
      cep: String(
        form.cep || "",
      ).replace(/\D/g, ""),

      rua: String(
        form.rua || "",
      ).trim(),

      numero: String(
        form.numero || "",
      ).trim(),

      complemento: String(
        form.complemento || "",
      ).trim(),

      bairro: String(
        form.bairro || "",
      ).trim(),

      cidade: String(
        form.cidade || "",
      ).trim(),

      estado: String(
        form.estado || "",
      )
        .trim()
        .toUpperCase(),
    },

    localizacao: {
      latitude:
        form.latitude !== ""
          ? Number(form.latitude)
          : null,

      longitude:
        form.longitude !== ""
          ? Number(form.longitude)
          : null,
    },

    atualizadoEm:
      serverTimestamp(),
  };

  const settingsData = {
    nomeExibicao: String(
      form.nomeExibicao || "",
    ).trim(),

    corPrincipal:
      form.corPrincipal ||
      "#f97316",

    logoUrl: String(
      form.logoUrl || "",
    ).trim(),

    logoPath: String(
      form.logoPath || "",
    ).trim(),

    tema:
      form.tema === "dark"
        ? "dark"
        : "light",

    moeda:
      form.moeda || "BRL",

    idioma:
      form.idioma || "pt-BR",

    fusoHorario:
      form.fusoHorario ||
      "America/Sao_Paulo",

    receberPedidos:
      Boolean(
        form.receberPedidos,
      ),

    receberChamados:
      Boolean(
        form.receberChamados,
      ),

    aceitarPedidos:
      Boolean(
        form.aceitarPedidos,
      ),

    permitirChamados:
      Boolean(
        form.permitirChamados,
      ),

    permitirEdicaoPedido:
      Boolean(
        form.permitirEdicaoPedido,
      ),

    tempoMedioPreparo:
      Math.max(
        1,
        Number(
          form.tempoMedioPreparo,
        ) || 30,
      ),

    mensagemPedido: String(
      form.mensagemPedido || "",
    ).trim(),

    taxaServicoHabilitada:
      Boolean(
        form.taxaServicoHabilitada,
      ),

    percentualTaxaServico:
      Math.max(
        0,
        Number(
          form.percentualTaxaServico,
        ) || 0,
      ),

    exigirConfirmacaoCancelamento:
      Boolean(
        form
          .exigirConfirmacaoCancelamento,
      ),

    atualizadoEm:
      serverTimestamp(),
  };

  await updateDoc(
    establishmentReference(
      establishmentId,
    ),
    establishmentData,
  );

  await setDoc(
    settingsReference(
      establishmentId,
    ),
    settingsData,
    {
      merge: true,
    },
  );

  return true;
}

export async function uploadEstablishmentLogo({
  establishmentId,
  file,
  previousLogoPath = null,
}) {
  if (!establishmentId) {
    throw new Error(
      "Estabelecimento não identificado.",
    );
  }

  if (!file) {
    throw new Error(
      "Nenhuma imagem selecionada.",
    );
  }

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Selecione uma imagem PNG, JPG ou WEBP.",
    );
  }

  const maxFileSize = 2 * 1024 * 1024;

  if (file.size > maxFileSize) {
    throw new Error(
      "A imagem deve possuir no máximo 2 MB.",
    );
  }

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

  const logoPath =
    `establishments/${establishmentId}/branding/logo.${extension}`;

  const logoReference = ref(
    storage,
    logoPath,
  );

  await uploadBytes(
    logoReference,
    file,
    {
      contentType: file.type,
    },
  );

  const logoUrl =
    await getDownloadURL(
      logoReference,
    );

  if (
    previousLogoPath &&
    previousLogoPath !== logoPath
  ) {
    try {
      await deleteObject(
        ref(
          storage,
          previousLogoPath,
        ),
      );
    } catch (error) {
      console.warn(
        "Não foi possível apagar o logotipo anterior:",
        error,
      );
    }
  }

  return {
    logoUrl,
    logoPath,
  };
}