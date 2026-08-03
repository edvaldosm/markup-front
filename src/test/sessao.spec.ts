/**
 * Ciclo de vida da sessão — o que o usuário sente quando o token curto vence.
 *
 * Estes testes exercitam a **cadeia real de links** do Apollo contra o servidor
 * falso: o access token expira de verdade, a renovação sai de verdade e a
 * operação é repetida de verdade. É a única forma de provar REQ-03 e REQ-04 sem
 * alguém abrir o navegador e esperar quinze minutos.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import { useEmpresaStore } from '@/stores/empresa'
import { useProdutosStore } from '@/stores/produtos'
import { apolloClient, definirAoPerderSessao } from '@/graphql/client'
import { ME } from '@/graphql/operations/acesso'
import { tokenDeAcesso, tokenDeRenovacao } from '@/graphql/sessao'
import { prepararAmbiente, entrarComo } from './app-harness'
import { type ServidorFalso } from './servidor-falso'

let servidor: ServidorFalso

beforeEach(() => {
  servidor = prepararAmbiente()
  definirAoPerderSessao(() => {})
})

afterEach(() => {
  servidor.restaurar()
  definirAoPerderSessao(() => {})
})

describe('renovação automática (REQ-03)', () => {
  it('token expirado é renovado e a operação conclui sem erro visível', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const empresa = useEmpresaStore()

    servidor.expirarAccessToken()
    await empresa.fetchEmpresas()

    // O usuário não viu nada: os dados chegaram e não houve erro na tela.
    expect(empresa.erro).toBeNull()
    expect(empresa.empresas.map(e => e.id).sort()).toEqual(['1', '3'])
    expect(servidor.chamadas.renovarSessao).toBe(1)
    // e a operação foi de fato repetida (a primeira tentativa falhou)
    expect(servidor.chamadas.minhasEmpresas).toBe(2)
  })

  it('a renovação troca os dois tokens', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const accessAntigo = tokenDeAcesso()
    const refreshAntigo = tokenDeRenovacao()

    servidor.expirarAccessToken()
    await useEmpresaStore().fetchEmpresas()

    expect(tokenDeAcesso()).not.toBe(accessAntigo)
    // O refresh também roda: um refresh reutilizável é um refresh eterno.
    expect(tokenDeRenovacao()).not.toBe(refreshAntigo)
  })

  it('operações concorrentes compartilham uma única renovação (single-flight)', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const empresa = useEmpresaStore()

    servidor.expirarAccessToken()
    await Promise.all([
      empresa.fetchEmpresas(),
      apolloClient.query({ query: ME }),
    ])

    // Duas renovações rodariam o refresh duas vezes; a segunda usaria um token
    // já invalidado pela primeira e derrubaria a sessão de quem está legítimo.
    expect(servidor.chamadas.renovarSessao).toBe(1)
    expect(empresa.erro).toBeNull()
  })

  it('senha errada não dispara renovação — a mensagem correta chega ao usuário', async () => {
    // **Com sessão válida em curso**, que é onde o filtro por operação importa:
    // sem sessão não há refresh, e a renovação nem seria tentada — o teste
    // passaria sozinho, provando nada.
    const auth = await entrarComo('ana@docesdaana.com.br')
    expect(tokenDeRenovacao()).not.toBeNull()

    expect(await auth.login('ana@docesdaana.com.br', 'errada')).toBe(false)

    // `login` também responde UNAUTHORIZED; renovar aí gastaria o refresh e
    // devolveria ao usuário uma mensagem de sessão no lugar de "senha inválida".
    expect(servidor.chamadas.renovarSessao).toBeUndefined()
    expect(servidor.chamadas.login).toBe(2)   // a tentativa não foi repetida
    expect(auth.erro).toMatch(/senha/i)
  })

  it('refresh inválido encerra a sessão e avisa quem navega', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const empresa = useEmpresaStore()

    let perdeuSessao = false
    definirAoPerderSessao(() => { perdeuSessao = true })

    servidor.expirarAccessToken()
    servidor.invalidarRefreshToken()
    await empresa.fetchEmpresas()

    expect(perdeuSessao).toBe(true)
    expect(tokenDeAcesso()).toBeNull()
    expect(tokenDeRenovacao()).toBeNull()
    // e a tela recebe erro de sessão, não uma lista vazia silenciosa
    expect(empresa.empresas).toEqual([])
    expect(empresa.erro).toMatch(/sess/i)
  })

  it('não insiste: uma repetição por operação', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const empresa = useEmpresaStore()

    servidor.expirarAccessToken()
    servidor.invalidarRefreshToken()
    await empresa.fetchEmpresas()

    // Sem o limite, uma sessão morta viraria um laço de requisições.
    expect(servidor.chamadas.minhasEmpresas).toBeLessThanOrEqual(2)
  })
})

describe('logout não deixa resíduo (REQ-04)', () => {
  it('encerra no servidor e esvazia todos os stores de domínio', async () => {
    vi.useFakeTimers()
    try {
      const auth = await entrarComo('ana@docesdaana.com.br')
      const empresa = useEmpresaStore()
      const produtos = useProdutosStore()

      await empresa.fetchEmpresas()
      const carregando = produtos.fetchProdutos()
      await vi.runAllTimersAsync()
      await carregando

      expect(empresa.empresas.length).toBeGreaterThan(0)
      expect(produtos.produtos.length).toBeGreaterThan(0)

      const saindo = auth.logout()
      await vi.runAllTimersAsync()
      await saindo

      expect(servidor.chamadas.encerrarSessao).toBe(1)
      expect(auth.user).toBeNull()
      expect(tokenDeAcesso()).toBeNull()
      expect(tokenDeRenovacao()).toBeNull()
      // O ponto do teste: **nenhum** store de domínio guarda dado do anterior.
      expect(empresa.empresas).toEqual([])
      expect(empresa.empresaAtivaId).toBe('')
      expect(produtos.produtos).toEqual([])
    } finally {
      vi.useRealTimers()
    }
  })

  it('logout com o servidor fora do ar ainda limpa a sessão local', async () => {
    const auth = await entrarComo('ana@docesdaana.com.br')
    await useEmpresaStore().fetchEmpresas()

    servidor.derrubar()
    await auth.logout()

    // Manter o usuário logado porque a rede caiu seria o pior dos dois mundos.
    expect(auth.user).toBeNull()
    expect(tokenDeRenovacao()).toBeNull()
  })

  it('o próximo usuário não vê nada do anterior', async () => {
    const auth = await entrarComo('ana@docesdaana.com.br')
    const empresa = useEmpresaStore()
    await empresa.fetchEmpresas()
    expect(empresa.empresas.map(e => e.id)).toContain('1')

    await auth.logout()
    await entrarComo('roberto@metalforte.com.br')
    await empresa.fetchEmpresas()

    expect(empresa.empresas.map(e => e.id)).toEqual(['2'])
  })
})
