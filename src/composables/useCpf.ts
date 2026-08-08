/**
 * CPF — máscara e validação de dígito verificador (REQ-05/11).
 *
 * Duplica o mesmo cálculo simples do backend (`Cpf` value object, markup-back)
 * de propósito — não vale a pena compartilhar pacote entre repos por isto
 * (ver plano da feature). O front valida só para dar feedback antes da viagem
 * de rede; a autoridade continua sendo o servidor (Artigo III — validação de
 * formato, não cálculo de domínio).
 */

/** Máscara `000.000.000-00`, aplicada enquanto o usuário digita. */
export function formatarCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (digitos.length > 9) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
  }
  if (digitos.length > 6) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`
  }
  if (digitos.length > 3) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3)}`
  }
  return digitos
}

/** Um dos dois dígitos verificadores do CPF — módulo 11 sobre a base informada. */
function digitoVerificador(base: string, pesoInicial: number): number {
  let soma = 0
  for (let i = 0; i < base.length; i++) {
    soma += Number(base[i]) * (pesoInicial - i)
  }
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

/**
 * Dígito verificador válido, 11 dígitos, e **não** uma sequência repetida
 * (`11111111111` etc.) — sequências repetidas passam no cálculo do dígito mas
 * não são CPF real; o backend rejeita o mesmo caso.
 */
export function validarCpf(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '')
  if (digitos.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digitos)) return false

  const d1 = digitoVerificador(digitos.slice(0, 9), 10)
  if (d1 !== Number(digitos[9])) return false

  const d2 = digitoVerificador(digitos.slice(0, 10), 11)
  if (d2 !== Number(digitos[10])) return false

  return true
}

export function useCpf() {
  return { formatarCpf, validarCpf }
}
