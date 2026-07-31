import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

const AUDIT_COLLECTION = "auditLogs";

export function listenAuditLogs({
  onData,
  onError,
  maxResults = 200,
}) {
  const auditCollection = collection(
    db,
    AUDIT_COLLECTION,
  );

  const auditQuery = query(
    auditCollection,
    orderBy("criadoEm", "desc"),
    limit(maxResults),
  );

  console.log(
    "Caminho consultado:",
    auditCollection.path,
  );

  console.log(
    "Projeto usado pelo frontend:",
    db.app.options.projectId,
  );

  return onSnapshot(
    auditQuery,
    (snapshot) => {
      const logs = snapshot.docs.map(
        (documentSnapshot) => ({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        }),
      );

      console.log(
        "Registros de auditoria recebidos:",
        logs.length,
      );

      onData?.(logs);
    },
    (error) => {
      console.error(
        "Erro ao acompanhar registros de auditoria:",
        {
          code: error.code,
          message: error.message,
        },
      );

      onError?.(error);
    },
  );
}

export async function createAuditLog({
  usuarioId = null,
  usuario = "Sistema",
  usuarioEmail = null,
  acao,
  recurso,
  tipo = "update",
  estabelecimentoId = null,
  detalhes = null,
}) {
  if (!acao?.trim()) {
    throw new Error(
      "A ação do registro de auditoria é obrigatória.",
    );
  }

  if (!recurso?.trim()) {
    throw new Error(
      "O recurso do registro de auditoria é obrigatório.",
    );
  }

  const auditData = {
    usuarioId,
    usuario: usuario?.trim() || "Sistema",
    usuarioEmail,
    acao: acao.trim(),
    recurso: recurso.trim(),
    tipo,
    estabelecimentoId,
    criadoEm: serverTimestamp(),
  };

  if (detalhes) {
    auditData.detalhes = detalhes;
  }

  const documentReference = await addDoc(
    collection(db, AUDIT_COLLECTION),
    auditData,
  );

  return documentReference.id;
}