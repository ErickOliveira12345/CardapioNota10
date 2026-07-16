import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebaseConfig.js";

function normalizarEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function validarCadastro({
  nome,
  email,
  senha,
  confirmarSenha,
}) {
  if (!String(nome || "").trim()) {
    throw new Error("Informe seu nome.");
  }

  if (!normalizarEmail(email)) {
    throw new Error("Informe seu e-mail.");
  }

  if (String(senha || "").length < 6) {
    throw new Error(
      "A senha precisa ter pelo menos 6 caracteres.",
    );
  }

  if (senha !== confirmarSenha) {
    throw new Error("As senhas não são iguais.");
  }
}

/**
 * Cria a conta no Authentication e o perfil em users/{uid}.
 */
export async function cadastrarProprietario({
  nome,
  email,
  senha,
  confirmarSenha,
}) {
  validarCadastro({
    nome,
    email,
    senha,
    confirmarSenha,
  });

  const emailNormalizado = normalizarEmail(email);

  let usuarioCriado = null;

  try {
    const credencial =
      await createUserWithEmailAndPassword(
        auth,
        emailNormalizado,
        senha,
      );

    usuarioCriado = credencial.user;

    await updateProfile(usuarioCriado, {
      displayName: String(nome).trim(),
    });

    await setDoc(
      doc(db, "users", usuarioCriado.uid),
      {
        nome: String(nome).trim(),
        email: emailNormalizado,

        role: "subscriber",
        status: "onboarding",

        estabelecimentoId: null,

        emailVerificado:
          usuarioCriado.emailVerified,

        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      },
    );

    return {
      uid: usuarioCriado.uid,
      nome: String(nome).trim(),
      email: emailNormalizado,
      role: "subscriber",
      status: "onboarding",
    };
  } catch (error) {
    /*
     * Caso a conta seja criada no Authentication,
     * mas o documento no Firestore falhe, tenta
     * remover a conta incompleta.
     */
    if (usuarioCriado) {
      try {
        await deleteUser(usuarioCriado);
      } catch (rollbackError) {
        console.error(
          "Não foi possível desfazer o cadastro:",
          rollbackError,
        );
      }
    }

    throw new Error(
      traduzirErroAuth(error),
    );
  }
}

/**
 * Faz login e retorna também o perfil do Firestore.
 */
export async function entrar({
  email,
  senha,
}) {
  const emailNormalizado = normalizarEmail(email);

  if (!emailNormalizado || !senha) {
    throw new Error(
      "Informe o e-mail e a senha.",
    );
  }

  try {
    const credencial =
      await signInWithEmailAndPassword(
        auth,
        emailNormalizado,
        senha,
      );

    const perfilSnapshot = await getDoc(
      doc(db, "users", credencial.user.uid),
    );

    return {
      usuario: credencial.user,

      perfil: perfilSnapshot.exists()
        ? {
            id: perfilSnapshot.id,
            ...perfilSnapshot.data(),
          }
        : null,
    };
  } catch (error) {
    throw new Error(
      traduzirErroAuth(error),
    );
  }
}

export async function autenticarClienteAnonimo() {
  try {
    if (auth.currentUser) {
      return auth.currentUser;
    }

    const credencial =
      await signInAnonymously(auth);

    return credencial.user;
  } catch (error) {
    throw new Error(
      traduzirErroAuth(error),
    );
  }
}

/**
 * Encerra a sessão atual.
 */
export async function sair() {
  await signOut(auth);
}

/**
 * Envia o e-mail de recuperação de senha.
 */
export async function recuperarSenha(email) {
  const emailNormalizado = normalizarEmail(email);

  if (!emailNormalizado) {
    throw new Error("Informe seu e-mail.");
  }

  try {
    await sendPasswordResetEmail(
      auth,
      emailNormalizado,
    );

    return true;
  } catch (error) {
    throw new Error(
      traduzirErroAuth(error),
    );
  }
}

/**
 * Observa login e logout em tempo real.
 *
 * Retorna a função que cancela o listener.
 */
export function observarAutenticacao(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Busca o perfil do usuário autenticado.
 */
export async function buscarPerfilUsuario(uid) {
  if (!uid) return null;

  const snapshot = await getDoc(
    doc(db, "users", uid),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

function traduzirErroAuth(error) {
  const mensagens = {
    "auth/email-already-in-use":
      "Este e-mail já está cadastrado.",

    "auth/invalid-email":
      "O e-mail informado é inválido.",

    "auth/weak-password":
      "A senha é muito fraca.",

    "auth/invalid-credential":
      "E-mail ou senha incorretos.",

    "auth/user-disabled":
      "Este usuário está desativado.",

    "auth/too-many-requests":
      "Muitas tentativas. Aguarde alguns minutos.",

    "auth/network-request-failed":
      "Falha de conexão. Verifique sua internet.",

    "auth/operation-not-allowed":
      "Este método de autenticação não está ativado no Firebase.",

    "auth/admin-restricted-operation":
      "A autenticação anônima não está ativada.",

    "auth/operation-not-allowed":
      "Este método de autenticação não está ativado.",
  };

  return (
    mensagens[error?.code] ||
    error?.message ||
    "Não foi possível concluir a operação."
  );
}