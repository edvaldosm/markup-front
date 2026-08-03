/**
 * Cliente GraphQL — a única porta de saída do front para o backend (FR06).
 *
 * A cadeia de links concentra as três responsabilidades transversais da sessão,
 * para que nenhuma tela precise conhecê-las:
 *
 * ```
 * errorLink  →  authLink  →  httpLink
 *  renova e     anexa o      envia
 *  repete       Bearer
 * ```
 *
 * A ordem importa: quando o `errorLink` reencaminha uma operação depois de
 * renovar, ela passa de novo pelo `authLink`, que lê o token **já atualizado**.
 * Fosse o contrário, a repetição sairia com o token velho.
 */
import { ApolloClient, InMemoryCache, createHttpLink, from, fromPromise } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { print } from 'graphql'
import { RENOVAR_SESSAO } from './operations/acesso'
import { ehSessaoExpirada } from './erros'
import { guardarSessao, limparSessao, tokenDeAcesso, tokenDeRenovacao } from './sessao'

export const GQL_ENDPOINT = import.meta.env.VITE_GQL_ENDPOINT ?? 'http://localhost:8080/graphql'

// ─── Sessão perdida ───────────────────────────────────────────────────────────

type AoPerderSessao = () => void
let aoPerderSessao: AoPerderSessao = () => {}

/**
 * Quem leva o usuário de volta ao login é o router, e o router não pode ser
 * importado aqui — ele importa as stores, que importam este módulo. Em vez do
 * ciclo, `main.ts` pluga o comportamento.
 */
export function definirAoPerderSessao(callback: AoPerderSessao): void {
  aoPerderSessao = callback
}

function perderSessao(): void {
  limparSessao()
  aoPerderSessao()
}

// ─── Renovação (single-flight) ────────────────────────────────────────────────

let renovacaoEmCurso: Promise<string | null> | null = null

/**
 * Renova por `fetch` cru, não pelo próprio cliente: a renovação não pode passar
 * pela cadeia de links que a dispara, nem sujar o cache com o payload de auth.
 */
async function renovar(): Promise<string | null> {
  const refreshToken = tokenDeRenovacao()
  if (!refreshToken) return null

  try {
    const resposta = await fetch(GQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'renovarSessao',
        query: print(RENOVAR_SESSAO),
        variables: { refreshToken },
      }),
    })
    const corpo = await resposta.json()
    const payload = corpo?.data?.renovarSessao
    if (!payload?.token) return null

    guardarSessao(payload.token, payload.refreshToken)
    return payload.token as string
  } catch {
    return null            // rede caiu no meio da renovação
  }
}

/**
 * Uma renovação por vez. Sem isto, N operações que expiram juntas disparam N
 * rotações do refresh token — e como cada rotação invalida a anterior, todas
 * menos uma falhariam, derrubando a sessão de um usuário legítimo.
 */
export function renovarSessaoUmaVezSo(): Promise<string | null> {
  if (!renovacaoEmCurso) {
    renovacaoEmCurso = renovar().finally(() => {
      renovacaoEmCurso = null
    })
  }
  return renovacaoEmCurso
}

// ─── Links ────────────────────────────────────────────────────────────────────

const httpLink = createHttpLink({ uri: GQL_ENDPOINT })

const authLink = setContext((_, { headers }) => {
  const token = tokenDeAcesso()
  return { headers: token ? { ...headers, authorization: `Bearer ${token}` } : headers }
})

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  // `login` e `renovarSessao` também respondem UNAUTHORIZED — para senha errada e
  // refresh inválido. Renovar aí seria mascarar a mensagem correta com uma
  // tentativa que não pode dar certo.
  const nome = operation.operationName
  if (nome === 'login' || nome === 'renovarSessao') return
  if (!ehSessaoExpirada(graphQLErrors)) return

  // Uma repetição só: se a operação já voltou com token novo e ainda foi
  // recusada, o problema não é o token.
  if (operation.getContext().jaRenovou) {
    perderSessao()
    return
  }

  if (!tokenDeRenovacao()) {
    perderSessao()
    return
  }

  return fromPromise(renovarSessaoUmaVezSo()).flatMap(novoToken => {
    operation.setContext({ jaRenovou: true })
    if (!novoToken) perderSessao()
    // Mesmo sem token novo a operação segue adiante: o erro original chega a
    // quem chamou (e `jaRenovou` impede reentrar neste bloco).
    return forward(operation)
  })
})

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    // Dado de precificação muda por ação do usuário e é multi-empresa: servir
    // valor de cache por padrão mostraria número de outra empresa após a troca.
    query: { fetchPolicy: 'network-only', errorPolicy: 'none' },
    watchQuery: { fetchPolicy: 'network-only', errorPolicy: 'none' },
  },
})

// ─── Resíduo do protótipo (fatias 2 e 3) ──────────────────────────────────────

/**
 * @deprecated Só as telas ainda não migradas (catálogo, precificação, Gestão do
 * Site, relatórios) dependem disto. Não é um modo de operação alternativo do
 * caminho novo — sessão e empresas já falam com o backend de verdade. Sai por
 * completo na fatia 3, junto com `src/mock/`.
 */
export const MOCK_MODE = true

export type QueryResult<T> = Promise<{ data: T; loading: false; error: null }>

/** @deprecated ver `MOCK_MODE`. Simula latência de rede no que ainda é mock. */
export async function mockQuery<T>(data: T, delayMs = 300): QueryResult<T> {
  await new Promise(r => setTimeout(r, delayMs))
  return { data, loading: false, error: null }
}
