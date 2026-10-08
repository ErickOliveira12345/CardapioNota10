// ======================================================
// VALIDAÇÃO DE CPF
// Verifica se o CPF informado possui 11 dígitos,
// rejeita sequências repetidas e valida os dois
// dígitos verificadores.
// ======================================================
export function validarCPF(cpf) {
  const cpfLimpo = String(cpf || "").replace(
    /\D/g,
    ""
  );

  // CPF precisa possuir exatamente 11 números.
  if (cpfLimpo.length !== 11) {
    return false;
  }

  // CPFs formados pelo mesmo número são inválidos.
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }

  // ======================================================
  // VALIDAÇÃO DE CPF
  // Calcula o primeiro dígito verificador.
  // ======================================================
  let soma = 0;

  for (let i = 0; i < 9; i += 1) {
    soma +=
      Number(cpfLimpo.charAt(i)) *
      (10 - i);
  }

  let primeiroDigito =
    (soma * 10) % 11;

  if (primeiroDigito === 10) {
    primeiroDigito = 0;
  }

  if (
    primeiroDigito !==
    Number(cpfLimpo.charAt(9))
  ) {
    return false;
  }

  // ======================================================
  // VALIDAÇÃO DE CPF
  // Calcula o segundo dígito verificador.
  // ======================================================
  soma = 0;

  for (let i = 0; i < 10; i += 1) {
    soma +=
      Number(cpfLimpo.charAt(i)) *
      (11 - i);
  }

  let segundoDigito =
    (soma * 10) % 11;

  if (segundoDigito === 10) {
    segundoDigito = 0;
  }

  if (
    segundoDigito !==
    Number(cpfLimpo.charAt(10))
  ) {
    return false;
  }

  return true;
}