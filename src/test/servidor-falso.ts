/**
 * Servidor GraphQL falso — o backend, do ponto de vista dos testes.
 *
 * Substitui `globalThis.fetch`, então **a cadeia real de links roda**: header de
 * autorização, renovação, repetição da operação, classificação de erro. Um mock
 * colocado acima disso (no store ou no cliente) testaria o teste, não o código
 * que vai para produção.
 *
 * Sem dependência nova (msw): o contrato exercitado aqui são cinco operações e
 * um cabeçalho — a superfície não paga uma biblioteca.
 *
 * As regras que ele aplica são as do backend de verdade, de propósito:
 * - só usuário **ativo** autentica;
 * - `minhasEmpresas` devolve o conjunto autorizado (dono ∪ vínculos; ADMIN ⇒
 *   todas) — a filtragem que **saiu do front** (B9) mora aqui;
 * - token ausente, expirado ou desconhecido ⇒ `UNAUTHORIZED` com **HTTP 200**,
 *   igual ao Spring for GraphQL.
 */
import { vi } from 'vitest'
import type { Empresa, Perfil, Usuario } from '@/types'
import { mockEmpresas, mockUsuarios } from '@/mock/data'

/** Senha única das contas de teste — o seed de desenvolvimento usa a mesma. */
export const SENHA_PADRAO = 'markup123'

interface CorpoRequisicao {
  operationName?: string
  query?: string
  variables?: Record<string, unknown>
}

interface Sessao {
  usuarioId: string
  accessToken: string
  refreshToken: string
  /** Access marcado como vencido por `expirarAccessToken()` */
  accessExpirado: boolean
  encerrada: boolean
}

export interface ServidorFalso {
  /** Faz o próximo access token ser recusado, como se tivesse expirado. */
  expirarAccessToken(): void
  /** Invalida o refresh: a renovação passa a falhar (sessão perdida). */
  invalidarRefreshToken(): void
  /** Backend fora do ar: `fetch` passa a rejeitar. */
  derrubar(): void
  /** Volta a responder. */
  levantar(): void
  /** Quantas vezes cada operação foi chamada — prova de repetição/single-flight. */
  chamadas: Record<string, number>
  restaurar(): void
}

/**
 * `Response` de verdade, não um objeto com `json()`: o `HttpLink` do Apollo lê o
 * corpo por `text()`. Um dublê incompleto faria toda resposta virar erro de
 * rede — inclusive as bem-sucedidas.
 */
function resposta(corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

/** Erro de domínio: o backend responde **HTTP 200** com o erro no corpo. */
function erroGraphQL(mensagem: string, classification: string): Response {
  return resposta({ errors: [{ message: mensagem, extensions: { classification } }], data: null })
}

function dados(payload: unknown): Response {
  return resposta({ data: payload })
}

/**
 * O Apollo pede `__typename` em toda seleção e normaliza o cache por ele; sem o
 * campo, os objetos voltam mutilados do cache (o sintoma é `id: undefined`).
 * O backend real responde com ele, então o servidor falso também responde.
 */
function perfilGql(perfil: Perfil | undefined) {
  if (!perfil) return null
  return {
    __typename: 'Perfil',
    ...perfil,
    permissoes: perfil.permissoes.map(p => ({ __typename: 'Permissao', ...p })),
  }
}

/**
 * O `Usuario` do contrato traz o **vínculo** (empresaId + perfil), não a empresa
 * inteira nem o `perfilId` solto que o mock carrega.
 */
function usuarioGql(usuario: Usuario) {
  return {
    __typename: 'Usuario',
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    ativo: usuario.ativo,
    empresas: usuario.empresas.map(v => ({
      __typename: 'UsuarioEmpresa',
      empresaId: v.empresaId,
      perfil: perfilGql(v.perfil),
    })),
    perfilGlobal: perfilGql(usuario.perfilGlobal),
  }
}

/**
 * Campo nulável ausente **não** é a mesma coisa que nulo: o GraphQL devolve
 * `null` explícito, e o Apollo trata campo faltando como resposta incompleta —
 * o objeto inteiro volta indefinido do cache. Por isso cada campo do fragmento
 * aparece aqui, mesmo vazio.
 */
function empresaGql(empresa: Empresa) {
  return {
    __typename: 'Empresa',
    id: empresa.id,
    razaoSocial: empresa.razaoSocial,
    cnpj: empresa.cnpj ?? null,
    segmento: empresa.segmento,
    regimeTributario: empresa.regimeTributario,
    anexoCadastrado: empresa.anexoCadastrado ?? null,
    faturamentoMedioMensal: empresa.faturamentoMedioMensal,
    folhaPagamentoMensal: empresa.folhaPagamentoMensal ?? null,
    percentualDespesasFixas: empresa.percentualDespesasFixas ?? 0,
    donoUsuarioId: empresa.donoUsuarioId,
  }
}

/**
 * Conjunto autorizado — a regra do R09 aplicada **no servidor**.
 * ADMIN (escopo global) vê todas; os demais veem as próprias mais as
 * compartilhadas por vínculo explícito.
 */
function empresasDoUsuario(usuario: Usuario): Empresa[] {
  if (usuario.perfilGlobal?.escopoGlobal) return [...mockEmpresas]
  return mockEmpresas.filter(
    emp =>
      emp.donoUsuarioId === usuario.id ||
      usuario.empresas.some(v => v.empresaId === emp.id),
  )
}

export function instalarServidorFalso(): ServidorFalso {
  const sessoes = new Map<string, Sessao>()   // accessToken → sessão
  const porRefresh = new Map<string, Sessao>()
  let sequencia = 0
  let noAr = true

  const chamadas: Record<string, number> = {}

  function abrirSessao(usuarioId: string): Sessao {
    sequencia += 1
    const sessao: Sessao = {
      usuarioId,
      accessToken: `access-${usuarioId}-${sequencia}`,
      refreshToken: `refresh-${usuarioId}-${sequencia}`,
      accessExpirado: false,
      encerrada: false,
    }
    sessoes.set(sessao.accessToken, sessao)
    porRefresh.set(sessao.refreshToken, sessao)
    return sessao
  }

  /** Última sessão aberta — a que os controles do teste manipulam. */
  function sessaoCorrente(): Sessao | undefined {
    const abertas = [...sessoes.values()]
    return abertas[abertas.length - 1]
  }

  function usuarioDoToken(cabecalhos: Headers | undefined): Usuario | null {
    const autorizacao = cabecalhos?.get('authorization') ?? ''
    const token = autorizacao.replace(/^Bearer\s+/i, '')
    const sessao = sessoes.get(token)
    if (!sessao || sessao.accessExpirado || sessao.encerrada) return null
    return mockUsuarios.find(u => u.id === sessao.usuarioId) ?? null
  }

  function payloadDeAutenticacao(sessao: Sessao, usuario: Usuario) {
    return {
      __typename: 'AuthPayload',
      token: sessao.accessToken,
      refreshToken: sessao.refreshToken,
      expiraEmSegundos: 900,
      usuario: usuarioGql(usuario),
    }
  }

  const original = globalThis.fetch

  globalThis.fetch = vi.fn(async (_entrada: unknown, init?: RequestInit) => {
    if (!noAr) throw new TypeError('Failed to fetch')

    const corpo: CorpoRequisicao = JSON.parse(String(init?.body ?? '{}'))
    const operacao = corpo.operationName ?? ''
    const variaveis = corpo.variables ?? {}
    chamadas[operacao] = (chamadas[operacao] ?? 0) + 1

    const cabecalhos = new Headers(init?.headers as HeadersInit)

    switch (operacao) {
      case 'login': {
        const usuario = mockUsuarios.find(u => u.email === variaveis.email)
        // Usuário inativo é recusado com a mesma mensagem de credencial: dizer
        // "sua conta está desativada" confirmaria a existência do e-mail.
        if (!usuario || !usuario.ativo || variaveis.senha !== SENHA_PADRAO) {
          return erroGraphQL('Credenciais inválidas', 'UNAUTHORIZED')
        }
        return dados({ login: payloadDeAutenticacao(abrirSessao(usuario.id), usuario) })
      }

      case 'renovarSessao': {
        const anterior = porRefresh.get(String(variaveis.refreshToken))
        if (!anterior || anterior.encerrada) {
          return erroGraphQL('Sessão inválida', 'UNAUTHORIZED')
        }
        // Rotação: o refresh usado não vale mais, como no backend.
        porRefresh.delete(anterior.refreshToken)
        sessoes.delete(anterior.accessToken)
        const usuario = mockUsuarios.find(u => u.id === anterior.usuarioId)!
        return dados({ renovarSessao: payloadDeAutenticacao(abrirSessao(usuario.id), usuario) })
      }

      case 'encerrarSessao': {
        const sessao = sessaoCorrente()
        if (sessao) sessao.encerrada = true
        return dados({ encerrarSessao: true })
      }
    }

    // Daqui para baixo, tudo exige autenticação.
    const usuario = usuarioDoToken(cabecalhos)
    if (!usuario) return erroGraphQL('Unauthorized', 'UNAUTHORIZED')

    switch (operacao) {
      case 'me':
        return dados({ me: usuarioGql(usuario) })

      case 'minhasEmpresas':
        return dados({ minhasEmpresas: empresasDoUsuario(usuario).map(empresaGql) })

      case 'salvarEmpresa': {
        const entrada = variaveis.input as Partial<Empresa> & { id?: string | null }
        if (entrada.id) {
          const existente = mockEmpresas.find(e => e.id === entrada.id)
          if (!existente) return erroGraphQL('Empresa não encontrada', 'NOT_FOUND')
          Object.assign(existente, entrada)
          return dados({ salvarEmpresa: empresaGql(existente) })
        }
        const nova: Empresa = {
          ...(entrada as Omit<Empresa, 'id' | 'donoUsuarioId' | 'percentualDespesasFixas'>),
          id: `emp-nova-${sequencia}`,
          // Empresa nova ainda não tem despesa fixa: o rateio (C2) nasce zero
          percentualDespesasFixas: 0,
          // Quem cria vira dono — decidido pelo servidor a partir do token (R09)
          donoUsuarioId: usuario.id,
        }
        mockEmpresas.push(nova)
        return dados({ salvarEmpresa: empresaGql(nova) })
      }
    }

    return erroGraphQL(`Operação não suportada no servidor falso: ${operacao}`, 'BAD_REQUEST')
  }) as typeof fetch

  return {
    chamadas,
    expirarAccessToken() {
      const sessao = sessaoCorrente()
      if (sessao) sessao.accessExpirado = true
    },
    invalidarRefreshToken() {
      porRefresh.clear()
    },
    derrubar() {
      noAr = false
    },
    levantar() {
      noAr = true
    },
    restaurar() {
      globalThis.fetch = original
    },
  }
}
