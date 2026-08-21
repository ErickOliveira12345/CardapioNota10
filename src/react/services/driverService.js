import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebaseConfig.js";

function driverReference(uid) {
  return doc(
    db,
    "deliveryDrivers",
    uid,
  );
}

export async function createDriverAccount({
  nome,
  telefone,
  email,
  cpf,
  veiculo,
  senha,
}) {
  const normalizedName =
    String(nome || "").trim();

  const normalizedPhone =
    String(telefone || "")
      .replace(/\D/g, "");

  const normalizedEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  const normalizedCpf =
    String(cpf || "")
      .replace(/\D/g, "");

  if (!normalizedName) {
    throw new Error(
      "Informe o nome do entregador.",
    );
  }

  if (
    normalizedPhone.length < 10
  ) {
    throw new Error(
      "Informe um telefone válido.",
    );
  }

  if (!normalizedEmail) {
    throw new Error(
      "Informe o e-mail.",
    );
  }

  if (
    normalizedCpf.length !== 11
  ) {
    throw new Error(
      "Informe um CPF válido.",
    );
  }

  if (
    String(senha || "").length < 6
  ) {
    throw new Error(
      "A senha deve possuir pelo menos 6 caracteres.",
    );
  }

  const credential =
    await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      senha,
    );

  const user =
    credential.user;

  const driverData = {
    uid:
      user.uid,

    nome:
      normalizedName,

    telefone:
      normalizedPhone,

    email:
      normalizedEmail,

    cpf:
      normalizedCpf,

    veiculo: {
      tipo:
        String(
          veiculo?.tipo || "moto",
        ),

      placa:
        String(
          veiculo?.placa || "",
        )
          .trim()
          .toUpperCase(),
    },

    /*
     * Precisa ser aprovado antes
     * de receber entregas.
     */
    status:
      "pending",

    disponivel:
      false,

    localizacao: {
      latitude:
        null,

      longitude:
        null,
    },

    criadoEm:
      serverTimestamp(),

    atualizadoEm:
      serverTimestamp(),
  };

  try {
    await setDoc(
      driverReference(
        user.uid,
      ),
      driverData,
    );
  } catch (error) {
    /*
     * Se o Auth foi criado mas
     * o Firestore falhar, não
     * escondemos o problema.
     */
    console.error(
      "Erro ao salvar entregador:",
      error,
    );

    throw new Error(
      "A conta foi criada, mas não foi possível salvar os dados do entregador.",
    );
  }

  return {
    uid:
      user.uid,

    ...driverData,
  };
}

export async function loginDriver({
  email,
  senha,
}) {
  const credential =
    await signInWithEmailAndPassword(
      auth,
      String(email || "")
        .trim()
        .toLowerCase(),
      senha,
    );

  const user =
    credential.user;

  const snapshot =
    await getDoc(
      driverReference(
        user.uid,
      ),
    );

  if (!snapshot.exists()) {
    await signOut(auth);

    throw new Error(
      "Esta conta não possui cadastro de entregador.",
    );
  }

  return {
    uid:
      user.uid,

    ...snapshot.data(),
  };
}

export async function getDriverByUid(
  uid,
) {
  if (!uid) {
    return null;
  }

  const snapshot =
    await getDoc(
      driverReference(uid),
    );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id:
      snapshot.id,

    ...snapshot.data(),
  };
}

export async function updateDriverAvailability({
  uid,
  disponivel,
}) {
  if (!uid) {
    throw new Error(
      "Entregador não identificado.",
    );
  }

  await updateDoc(
    driverReference(uid),
    {
      disponivel:
        Boolean(disponivel),

      atualizadoEm:
        serverTimestamp(),
    },
  );
}

export async function logoutDriver() {
  await signOut(auth);
}