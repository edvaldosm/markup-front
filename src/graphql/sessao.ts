/**
 * Cofre da sessão — onde os tokens moram.
 *
 * **Fora do Pinia de propósito.** Os links do Apollo rodam antes de qualquer
 * componente montar e precisam do token sem depender de uma store ativa; e o
 * access token em estado reativo só ganharia visibilidade nas devtools, sem
 * nenhum benefício.
 *
 * A divisão entre os dois tokens é a política de segurança da sessão (ADR-0008):
 *
 * - **access** (15 min) fica **só em memória**. Token autocontido não se revoga —
 *   a janela de um token roubado é a própria validade dele. Fechar a aba encerra.
 * - **refresh** (7 dias) vai para o `localStorage`, porque é o que faz o F5 não
 *   pedir senha de novo. Ele é revogável no servidor, então persistir custa menos.
 */

const CHAVE_REFRESH = 'markup.refreshToken'

/** Só em memória: morre com a aba, por decisão, não por esquecimento. */
let accessToken: string | null = null

/**
 * `localStorage` pode lançar (modo privado do Safari, storage desabilitado).
 * Perder a persistência do refresh degrada a experiência — o usuário reautentica
 * — mas não pode derrubar o app.
 */
function lerArmazenado(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

function gravarArmazenado(chave: string, valor: string | null): void {
  try {
    if (valor === null) localStorage.removeItem(chave)
    else localStorage.setItem(chave, valor)
  } catch {
    /* sessão sem persistência: o app segue, o F5 pedirá senha */
  }
}

export function tokenDeAcesso(): string | null {
  return accessToken
}

export function tokenDeRenovacao(): string | null {
  return lerArmazenado(CHAVE_REFRESH)
}

/** Grava o par devolvido por `login` ou `renovarSessao`. */
export function guardarSessao(token: string, refreshToken: string): void {
  accessToken = token
  gravarArmazenado(CHAVE_REFRESH, refreshToken)
}

/**
 * Há de onde restaurar uma sessão? Serve ao boot: com refresh guardado, o app
 * tenta renovar antes de montar, em vez de mandar ao login quem tinha sessão.
 */
export function haSessaoRestauravel(): boolean {
  return tokenDeRenovacao() !== null
}

/** Apaga tudo. Chamado no logout e quando a renovação falha. */
export function limparSessao(): void {
  accessToken = null
  gravarArmazenado(CHAVE_REFRESH, null)
}
