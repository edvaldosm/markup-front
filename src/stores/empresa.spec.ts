/**
 * Store de empresa contra o servidor falso.
 *
 * A diferença em relação à versão do protótipo: o conjunto autorizado **não é
 * mais calculado aqui**. Estes testes provam que o front reflete o que o
 * servidor devolveu — e que não inventa nada quando o servidor não responde.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useEmpresaStore } from './empresa'
import { useAuthStore } from './auth'
import { mockEmpresas } from '@/test/fixtures'
import { prepararAmbiente, entrarComo } from '@/test/app-harness'
import { SENHA_PADRAO, type ServidorFalso } from '@/test/servidor-falso'

let servidor: ServidorFalso

describe('store empresa — minhasEmpresas (R09)', () => {
  beforeEach(() => {
    servidor = prepararAmbiente()
  })

  afterEach(() => {
    servidor.restaurar()
  })

  it('carrega apenas as empresas autorizadas ao usuário logado', async () => {
    await entrarComo('roberto@metalforte.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    expect(store.empresas.map(e => e.id)).toEqual(['2'])
    expect(store.empresas.length).toBeLessThan(mockEmpresas.length)
  })

  it('dono com empresa compartilhada recebe as duas', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    expect(store.empresas.map(e => e.id).sort()).toEqual(['1', '3'])
  })

  it('ADMIN global recebe todas', async () => {
    await entrarComo('admin@markup.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    expect(store.empresas).toHaveLength(mockEmpresas.length)
  })

  it('seleciona automaticamente a primeira empresa autorizada', async () => {
    await entrarComo('juliana@nexatech.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    expect(store.empresaAtivaId).toBe('3')
    expect(store.empresa?.razaoSocial).toContain('NexaTech')
  })

  it('recusa selecionar empresa fora do conjunto devolvido pelo servidor', async () => {
    await entrarComo('roberto@metalforte.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    const aceitou = store.selecionarEmpresa('1') // empresa da Ana
    expect(aceitou).toBe(false)
    expect(store.empresaAtivaId).toBe('2') // permanece na dele
  })

  it('aceita selecionar empresa autorizada', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    expect(store.selecionarEmpresa('3')).toBe(true)
    expect(store.empresaAtivaId).toBe('3')
  })

  it('sem login, o servidor recusa e nada é carregado', async () => {
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    expect(store.empresas).toEqual([])
    expect(store.empresa).toBeNull()
    expect(store.erro).toMatch(/sess/i)
  })

  it('empresa criada tem como dono o usuário logado — decidido pelo servidor', async () => {
    const auth = await entrarComo('juliana@nexatech.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    const nova = await store.criarEmpresa({
      razaoSocial: 'Nova Empresa Teste',
      cnpj: '99.999.999/0001-99',
      segmento: 'SERVICOS',
      regimeTributario: 'SIMPLES_NACIONAL',
      faturamentoMedioMensal: 10000,
    })

    expect(nova).not.toBeNull()
    expect(nova!.donoUsuarioId).toBe(auth.user!.id)
    expect(store.empresaAtivaId).toBe(nova!.id)
    // e continua visível para ela num novo fetch
    await store.fetchEmpresas()
    expect(store.empresas.map(e => e.id)).toContain(nova!.id)

    // limpa o "banco" do servidor falso para não vazar entre testes
    mockEmpresas.splice(mockEmpresas.findIndex(e => e.id === nova!.id), 1)
  })

  it('reset limpa o contexto ao trocar de usuário', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()
    expect(store.empresas.length).toBeGreaterThan(0)

    store.reset()
    expect(store.empresas).toEqual([])
    expect(store.empresaAtivaId).toBe('')
  })

  it('trocar de usuário troca o conjunto — nada da sessão anterior vaza', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()
    expect(store.empresas.map(e => e.id)).toContain('1')

    const auth = useAuthStore()
    await auth.logout()
    // o logout já esvazia os stores registrados: nada de `store.reset()` manual
    expect(store.empresas).toEqual([])

    await entrarComo('roberto@metalforte.com.br')
    await store.fetchEmpresas()

    expect(store.empresas.map(e => e.id)).toEqual(['2'])
    expect(store.empresaAtivaId).toBe('2')
  })
})

describe('empresa ativa — persistência e falha de servidor', () => {
  beforeEach(() => {
    servidor = prepararAmbiente()
  })

  afterEach(() => {
    servidor.restaurar()
  })

  it('empresa ativa guardada sobrevive ao recarregamento (REQ-07)', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()
    store.selecionarEmpresa('3')

    // simula o F5: Pinia novo, mesmo navegador (localStorage preservado)
    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())
    await entrarComo('ana@docesdaana.com.br')
    const novoStore = useEmpresaStore()
    await novoStore.fetchEmpresas()

    expect(novoStore.empresaAtivaId).toBe('3')
  })

  it('empresa guardada que deixou de ser autorizada cai na primeira (REQ-07)', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()
    store.selecionarEmpresa('3')

    // outro usuário na mesma aba: a empresa guardada não é dele
    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())
    await entrarComo('roberto@metalforte.com.br')
    const outro = useEmpresaStore()
    await outro.fetchEmpresas()

    expect(outro.empresaAtivaId).toBe('2')
  })

  it('servidor fora do ar não vira "você não tem empresas" (REQ-13)', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const store = useEmpresaStore()
    servidor.derrubar()

    await store.fetchEmpresas()

    expect(store.empresas).toEqual([])
    expect(store.erro).toMatch(/servidor/i)
  })

  it('senha errada não autentica', async () => {
    const auth = useAuthStore()
    expect(await auth.login('ana@docesdaana.com.br', 'senha-errada')).toBe(false)
    expect(auth.user).toBeNull()
    expect(auth.erro).toMatch(/senha/i)
  })

  it('usuário inativo não entra nem com a senha certa (REQ-05)', async () => {
    const auth = useAuthStore()
    expect(await auth.login('contador@contabilidade.com.br', SENHA_PADRAO)).toBe(false)
    expect(auth.user).toBeNull()
  })
})
