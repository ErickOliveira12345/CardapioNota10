import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  reload,
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

    // VERIFICAÇÃO DO E-MAIL: Envia automaticamente o link de verificação
    await sendEmailVerification(usuarioCriado);

    await setDoc(doc(db, "users", usuarioCriado.uid),{
        nome: String(nome).trim(),
        email: emailNormalizado,

        role: "subscriber",
        status: "onboarding",

        estabelecimentoId: null,

        // VERIFICAÇÃO DO E-MAIL: No momento do cadastro o e-mail ainda não foi confirmado pelo usuário.
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

// ======================================================
// VERIFICAÇÃO DO E-MAIL
// Reenvia o link de verificação para o e-mail do usuário
// que está atualmente autenticado no Firebase.
// ======================================================
export async function reenviarEmailVerificacao() {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error(
      "Nenhum usuário autenticado para reenviar o e-mail de verificação."
    );
  }

  // ======================================================
  // VERIFICAÇÃO DO E-MAIL
  // Evita o reenvio caso o e-mail já tenha sido verificado.
  // ======================================================
  await reload(usuario);

  if (usuario.emailVerified) {
    return {
      verificado: true,
      mensagem: "O e-mail já está verificado.",
    };
  }

  // ======================================================
  // VERIFICAÇÃO DO E-MAIL
  // Solicita ao Firebase o envio de um novo link de
  // verificação para o endereço de e-mail do usuário.
  // ======================================================
  await sendEmailVerification(usuario);

  return {
    verificado: false,
    mensagem: "E-mail de verificação reenviado com sucesso.",
  };
}


// ======================================================
// VERIFICAÇÃO DO E-MAIL
// Atualiza os dados do usuário autenticado usando reload()
// e retorna o estado mais recente de emailVerified.
// ======================================================
export async function atualizarStatusVerificacaoEmail() {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error(
      "Nenhum usuário autenticado para verificar o e-mail."
    );
  }

  // ======================================================
  // VERIFICAÇÃO DO E-MAIL
  // Busca novamente no Firebase Authentication os dados
  // atualizados do usuário.
  // ======================================================
  await reload(usuario);

  return {
    verificado: usuario.emailVerified,
    email: usuario.email,
  };
}

/**
 * Faz login e retorna também o perfil do Firestore.
 */
/**
 * Faz login e retorna também o perfil do Firestore.
 */
export async function entrar({
  email,
  senha,
}) {
  const emailNormalizado =
    normalizarEmail(email);

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

    // ======================================================
    // VERIFICAÇÃO DO E-MAIL
    // Atualiza os dados do usuário diretamente no Firebase
    // Authentication para obter o estado mais recente de
    // emailVerified após o login.
    // ======================================================
    await reload(credencial.user);

    // ======================================================
    // VERIFICAÇÃO DO E-MAIL
    // O valor abaixo vem diretamente do Firebase Auth e
    // será usado pelo LoginPage para decidir se o usuário
    // pode continuar para o sistema.
    // ======================================================
    const emailVerificado =
      credencial.user.emailVerified;

    const perfilSnapshot = await getDoc(
      doc(
        db,
        "users",
        credencial.user.uid,
      ),
    );

    return {
      usuario: credencial.user,

      // ======================================================
      // VERIFICAÇÃO DO E-MAIL
      // Retorna para o LoginPage o estado real da
      // verificação do e-mail no Firebase Authentication.
      // ======================================================
      emailVerificado,

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
    await auth.authStateReady();

    /*
     * Se já existe um proprietário autenticado,
     * não substitui essa sessão por uma anônima.
     */
    
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
  };

  return (
    mensagens[error?.code] ||
    error?.message ||
    "Não foi possível concluir a operação."
  );
}