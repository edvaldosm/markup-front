import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEmpresaStore } from './empresa'
import { useAuthStore } from './auth'
import { mockEmpresas } from '@/mock/data'

/** Faz login pelo store real (mock resolve em ~600ms) */
async function entrarComo(email: string) {
  const auth = useAuthStore()
  const ok = await auth.login(email, '123456')
  expect(ok).toBe(true)
  return auth
}

describe('store empresa — minhasEmpresas (R09)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('carrega apenas as empresas autorizadas ao usuário logado', async () => {
    await entrarComo('roberto@metalforte.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    expect(store.empresas.map(e => e.id)).toEqual(['emp-002'])
    expect(store.empresas.length).toBeLessThan(mockEmpresas.length)
  })

  it('dono com empresa compartilhada recebe as duas', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    expect(store.empresas.map(e => e.id).sort()).toEqual(['emp-001', 'emp-003'])
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

    expect(store.empresaAtivaId).toBe('emp-003')
    expect(store.empresa?.razaoSocial).toContain('NexaTech')
  })

  it('recusa selecionar empresa fora do conjunto autorizado', async () => {
    await entrarComo('roberto@metalforte.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    const aceitou = store.selecionarEmpresa('emp-001') // empresa da Ana
    expect(aceitou).toBe(false)
    expect(store.empresaAtivaId).toBe('emp-002') // permanece na dele
  })

  it('aceita selecionar empresa autorizada', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    expect(store.selecionarEmpresa('emp-003')).toBe(true)
    expect(store.empresaAtivaId).toBe('emp-003')
  })

  it('sem login, nenhuma empresa é carregada', async () => {
    const store = useEmpresaStore()
    await store.fetchEmpresas()

    expect(store.empresas).toEqual([])
    expect(store.empresaAtivaId).toBe('')
    expect(store.empresa).toBeNull()
  })

  it('empresa criada tem como dono o usuário logado', async () => {
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

    expect(nova.donoUsuarioId).toBe(auth.user!.id)
    expect(store.empresaAtivaId).toBe(nova.id)
    // e continua visível para ela num novo fetch
    await store.fetchEmpresas()
    expect(store.empresas.map(e => e.id)).toContain(nova.id)

    // limpa o "banco" mock para não vazar entre testes
    mockEmpresas.splice(mockEmpresas.findIndex(e => e.id === nova.id), 1)
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
    expect(store.empresas.map(e => e.id)).toContain('emp-001')

    // logout + login como outro dono
    const auth = useAuthStore()
    auth.logout()
    store.reset()
    await entrarComo('roberto@metalforte.com.br')
    await store.fetchEmpresas()

    expect(store.empresas.map(e => e.id)).toEqual(['emp-002'])
    expect(store.empresaAtivaId).toBe('emp-002')
  })
})
