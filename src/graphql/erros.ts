/**
 * Tradução de erro da API para algo que a UI possa dizer ao usuário.
 *
 * O backend classifica todo erro de domínio em `extensions.classification`
 * (`ErrosDeDominioResolver`), e responde **HTTP 200** mesmo quando recusa — o
 * erro vem no corpo. Por isso nada aqui olha status HTTP.
 *
 * A distinção que mais importa: **erro de rede não é lista vazia**. Sem esta
 * camada, um backend fora do ar vira "nenhum registro encontrado" na tela, e o
 * usuário conclui que perdeu os dados.
 */

export type TipoDeErro =
  | 'CREDENCIAL'            // e-mail/senha recusados, ou usuário inativo
  | 'SESSAO_EXPIRADA'       // token ausente/expirado/inválido
  | 'SEM_AUTORIZACAO'       // autenticado, mas sem alcance sobre a operação
  | 'NAO_ENCONTRADO'
  | 'ENTRADA_INVALIDA'      // o domínio recusou o dado enviado
  | 'SERVIDOR_INACESSIVEL'  // não houve resposta: rede, CORS, backend parado
  | 'DESCONHECIDO'

export interface ErroDeApi {
  tipo: TipoDeErro
  /** Texto pronto para exibir — nunca stack trace nem jargão de servidor */
  mensagem: string
}

/** Formato mínimo de um erro GraphQL, sem acoplar aos tipos do Apollo. */
interface ErroGraphQLBruto {
  message?: string
  extensions?: { classification?: string }
}

interface ErroApolloBruto {
  graphQLErrors?: ReadonlyArray<ErroGraphQLBruto>
  networkError?: unknown
  message?: string
}

const MENSAGEM: Record<TipoDeErro, string> = {
  CREDENCIAL: 'E-mail ou senha inválidos.',
  SESSAO_EXPIRADA: 'Sua sessão expirou. Entre novamente.',
  SEM_AUTORIZACAO: 'Você não tem autorização para esta operação.',
  NAO_ENCONTRADO: 'Registro não encontrado.',
  ENTRADA_INVALIDA: 'Não foi possível salvar: verifique os dados informados.',
  SERVIDOR_INACESSIVEL: 'Não foi possível falar com o servidor. Verifique sua conexão.',
  DESCONHECIDO: 'Algo deu errado. Tente novamente.',
}

/**
 * `UNAUTHORIZED` cobre dois casos que o usuário vive de formas opostas: senha
 * errada e sessão expirada. Quem desempata é a operação — em `login`, só pode
 * ser credencial; em qualquer outra, o token é que caiu.
 */
function tipoDeUnauthorized(operacao?: string): TipoDeErro {
  return operacao === 'login' ? 'CREDENCIAL' : 'SESSAO_EXPIRADA'
}

function tipoDaClassificacao(classificacao: string | undefined, operacao?: string): TipoDeErro {
  switch (classificacao) {
    case 'UNAUTHORIZED': return tipoDeUnauthorized(operacao)
    case 'FORBIDDEN': return 'SEM_AUTORIZACAO'
    case 'NOT_FOUND': return 'NAO_ENCONTRADO'
    case 'BAD_REQUEST': return 'ENTRADA_INVALIDA'
    default: return 'DESCONHECIDO'
  }
}

/**
 * @param operacao nome da operação GraphQL, quando conhecido — desempata
 *                 credencial de sessão expirada.
 */
export function classificarErro(erro: unknown, operacao?: string): ErroDeApi {
  const bruto = (erro ?? {}) as ErroApolloBruto

  // Sem resposta do servidor: rede, CORS ou backend parado.
  if (bruto.networkError && !bruto.graphQLErrors?.length) {
    return { tipo: 'SERVIDOR_INACESSIVEL', mensagem: MENSAGEM.SERVIDOR_INACESSIVEL }
  }

  const primeiro = bruto.graphQLErrors?.[0]
  if (primeiro) {
    const tipo = tipoDaClassificacao(primeiro.extensions?.classification, operacao)
    // Em `BAD_REQUEST` a mensagem do domínio é escrita para quem chamou e diz
    // mais que o genérico ("Alíquota deve ser positiva"); nos demais casos ela
    // pode vazar detalhe interno, então prevalece o texto padrão.
    const mensagem =
      tipo === 'ENTRADA_INVALIDA' && primeiro.message ? primeiro.message : MENSAGEM[tipo]
    return { tipo, mensagem }
  }

  return { tipo: 'DESCONHECIDO', mensagem: MENSAGEM.DESCONHECIDO }
}

/** Atalho para quando a tela só precisa do texto. */
export function mensagemDeErro(erro: unknown, operacao?: string): string {
  return classificarErro(erro, operacao).mensagem
}

/** A resposta traz erro de sessão expirada? Usado pelo link de renovação. */
export function ehSessaoExpirada(erros: ReadonlyArray<ErroGraphQLBruto> | undefined): boolean {
  return !!erros?.some(e => e.extensions?.classification === 'UNAUTHORIZED')
}
