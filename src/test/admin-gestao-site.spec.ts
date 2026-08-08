/**
 * Aceite do módulo de Gestão do Site (spec `modulo-gestao-site`, FR09/FR10).
 *
 * Prova, navegando no app real:
 *   1. só o ADMIN global vê e abre o módulo — nenhum outro perfil, nem o
 *      PROPRIETARIO, que tem todas as permissões RBAC;
 *   2. o gestor enxerga a **base inteira** (todas as empresas, todos os usuários),
 *      com dono e equipe de cada empresa;
 *   3. as ações de gestão funcionam — e a que quebraria a R09 (desvincular o
 *      dono) é recusada;
 *   4. a identidade visual do módulo é o escopo neutro, e só dentro dele.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { montarAppComo, entrarComo, aguardar, prepararAmbiente } from './app-harness'
import { type ServidorFalso } from './servidor-falso'
import type { VinculoEmpresa } from '@/types'
import { useAdminStore } from '@/stores/admin'
import { mockUsuarios, mockEmpresas } from '@/test/fixtures'

const GESTOR = 'admin@markup.com.br'
const ROTAS_ADMIN = ['/admin', '/admin/empresas', '/admin/usuarios']

/**
 * As ações do gestor mutam o "banco" mock, que é módulo compartilhado entre os
 * testes deste arquivo. Sem restaurar, um teste de desvínculo estragaria a
 * contagem de equipe do teste seguinte.
 */
type Snapshot = { ativo: boolean; empresas: VinculoEmpresa[] }[]

function tirarSnapshot(): Snapshot {
  return mockUsuarios.map(u => ({
    ativo: u.ativo,
    // O `perfil` entra no snapshot: o perfil efetivo da sessão vem do vínculo
    // (REQ-09), então restaurar só o `perfilId` deixaria o usuário sem permissão
    // nenhuma nos testes seguintes.
    empresas: u.empresas.map(v => ({ ...v })),
  }))
}

let snapshot: Snapshot
let servidor: ServidorFalso

beforeEach(() => {
  vi.useFakeTimers()
  servidor = prepararAmbiente()
  snapshot = tirarSnapshot()
})

afterEach(() => {
  mockUsuarios.forEach((u, i) => {
    u.ativo = snapshot[i].ativo
    u.empresas = snapshot[i].empresas.map(v => ({ ...v }))
  })
  document.documentElement.classList.remove('theme-admin')
  servidor.restaurar()
  vi.useRealTimers()
})

// ─── Acesso ao módulo ────────────────────────────────────────────────────────

describe('acesso ao módulo (REQ-01)', () => {
  it('o gestor vê o grupo "Gestão do Site" no menu e abre as três telas', async () => {
    const app = await montarAppComo(GESTOR)

    for (const rota of ROTAS_ADMIN) {
      expect(app.rotasNoMenu(), `menu deveria oferecer ${rota}`).toContain(rota)
      expect(await app.irPara(rota)).not.toBe('dashboard')
    }
    expect(await app.irPara('/admin/empresas/2')).toBe('admin-empresa-detalhe')
    app.desmontar()
  })

  it.each([
    ['Ana (PROPRIETARIO, todas as permissões)', 'ana@docesdaana.com.br'],
    ['Marcos (GERENTE)', 'marcos@docesdaana.com.br'],
    ['Carla (VENDEDOR)', 'carla@docesdaana.com.br'],
  ])('%s não vê o módulo e é barrada nas rotas', async (_nome, email) => {
    const app = await montarAppComo(email)

    for (const rota of [...ROTAS_ADMIN, '/admin/empresas/1']) {
      expect(app.rotasNoMenu(), `menu não deveria oferecer ${rota}`).not.toContain(rota)
      expect(await app.irPara(rota), `${rota} deveria cair no dashboard`).toBe('dashboard')
    }
    expect(app.texto()).not.toContain('Gestão do Site')
    app.desmontar()
  })

  it('a store administrativa fica vazia para quem não é gestor', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const store = useAdminStore()

    await aguardar(store.fetchTudo())

    expect(store.souGestor).toBe(false)
    expect(store.empresas).toEqual([])
    expect(store.usuarios).toEqual([])
    // Sem escopo global o front nem pede metricasDaBase — null, não zero
    // inventado: zero seria afirmar "a base tem zero empresas", que é falso.
    expect(store.metricas).toBeNull()
  })

  it('as ações de gestão são recusadas para quem não é gestor', async () => {
    await entrarComo('roberto@metalforte.com.br')
    const store = useAdminStore()
    await aguardar(store.fetchTudo())

    expect(await aguardar(store.definirUsuarioAtivo('4', false))).toBeNull()
    expect(await aguardar(store.vincularUsuario('4', '2', '4'))).toBe(false)
    expect(await aguardar(store.desvincularUsuario('4', '1'))).toBe(false)
    // e o mock permanece intacto
    expect(mockUsuarios.find(u => u.id === '4')!.empresas).toHaveLength(1)
  })
})

// ─── Visão da base inteira ───────────────────────────────────────────────────

describe('visão global do gestor (REQ-02..REQ-05)', () => {
  it('lista todas as empresas da base, com dono e tamanho da equipe', async () => {
    const app = await montarAppComo(GESTOR)
    await app.irPara('/admin/empresas')
    const texto = app.texto()

    for (const emp of mockEmpresas) {
      expect(texto, `deveria listar ${emp.razaoSocial}`).toContain(emp.razaoSocial)
    }
    // dono de cada empresa aparece na linha
    expect(texto).toContain('Ana Paula Santos')
    expect(texto).toContain('Roberto Menezes')
    expect(texto).toContain('Juliana Ferraz')
    expect(texto).toContain('Diego Prado')
    app.desmontar()
  })

  it('lista todos os usuários da base, inclusive o inativo', async () => {
    const app = await montarAppComo(GESTOR)
    await app.irPara('/admin/usuarios')
    const texto = app.texto()

    for (const u of mockUsuarios) {
      expect(texto, `deveria listar ${u.email}`).toContain(u.email)
    }
    expect(texto).toContain('Inativo')  // Ricardo, `ativo: false`
    app.desmontar()
  })

  it('o detalhe da empresa mostra a equipe com acesso e marca o dono', async () => {
    const app = await montarAppComo(GESTOR)
    expect(await app.irPara('/admin/empresas/1')).toBe('admin-empresa-detalhe')

    expect(app.texto()).toContain('Doces da Ana')

    // Asserta nas linhas da tabela de equipe, não no texto da página: o nome de
    // um usuário de outra empresa aparece (legitimamente) no seletor de convite.
    const equipe = app.wrapper.findAll('tbody .usuario__info').map(el => el.text())
    // Fernando (PROPRIETARIO vinculado, não dono — fixture da feature
    // `cadastro-manutencao-usuario`, REQ-03/04) também é membro da equipe.
    expect(equipe).toHaveLength(5)
    for (const nome of ['Ana Paula Santos', 'Marcos Souza', 'Carla Lima', 'Ricardo Alves', 'Fernando Costa']) {
      expect(equipe.some(l => l.includes(nome)), `equipe deveria conter ${nome}`).toBe(true)
    }
    expect(equipe.some(l => l.includes('Roberto Menezes'))).toBe(false)
    // e o dono está marcado como tal
    expect(equipe.find(l => l.includes('Ana Paula Santos'))).toContain('Dono')
    app.desmontar()
  })

  it('as métricas somam a base inteira', async () => {
    await entrarComo(GESTOR)
    const store = useAdminStore()
    await aguardar(store.fetchTudo())

    expect(store.metricas).not.toBeNull()
    expect(store.metricas!.totalEmpresas).toBe(mockEmpresas.length)
    expect(store.metricas!.totalUsuarios).toBe(mockUsuarios.length)
    // `usuariosInativos` não existe em MetricasBase (pendência de contrato,
    // REQ-05) — não há o que testar aqui até o backend expor o campo.
    expect(store.metricas!.totalVinculos).toBe(
      mockUsuarios.reduce((acc, u) => acc + u.empresas.length, 0)
    )
    // Ana aparece nas duas empresas em que tem vínculo
    const ana = store.usuariosAdmin.find(u => u.usuario.id === '2')!
    expect(ana.acessos.map(a => a.empresa.id).sort()).toEqual(['1', '3'])
    expect(ana.acessos.find(a => a.empresa.id === '1')!.dono).toBe(true)
  })

  it('empresas vêm compostas pelo servidor (EmpresaAdmin), não de junção local', async () => {
    await entrarComo(GESTOR)
    const store = useAdminStore()
    await aguardar(store.fetchTudo())

    // `totalUsuarios` só existe se a resposta veio de `todasEmpresas` — uma
    // junção local (Empresa[] + Usuario[]) não teria esse campo pronto.
    const doces = store.empresaAdminPorId('1')!
    expect(doces.totalUsuarios).toBe(doces.equipe.length)
    expect(doces.dono?.nome).toBe('Ana Paula Santos')
  })
})

// ─── Ações de gestão ─────────────────────────────────────────────────────────

describe('poderes do gestor (REQ-06/REQ-07)', () => {
  beforeEach(async () => {
    await entrarComo(GESTOR)
    const store = useAdminStore()
    await aguardar(store.fetchTudo())
  })

  it('ativa e desativa o acesso de um usuário', async () => {
    const store = useAdminStore()

    expect(await aguardar(store.definirUsuarioAtivo('4', false))).toBe(false)
    expect(store.usuarioPorId('4')!.ativo).toBe(false)

    expect(await aguardar(store.definirUsuarioAtivo('4', true))).toBe(true)
    expect(store.usuarioPorId('4')!.ativo).toBe(true)
  })

  it('troca o perfil de um usuário dentro de uma empresa', async () => {
    const store = useAdminStore()

    expect(await aguardar(store.definirPerfilNoVinculo('4', '1', '3'))).toBe(true)

    const carla = store.empresaAdminPorId('1')!.equipe.find(m => m.usuario.id === '4')!
    expect(carla.perfil?.nome).toBe('GERENTE')
    // o vínculo dela na outra empresa não existe — nada foi criado por engano
    expect(store.usuarioPorId('4')!.empresas).toHaveLength(1)
  })

  it('vincula um usuário existente a outra empresa e recusa vínculo repetido', async () => {
    const store = useAdminStore()

    expect(await aguardar(store.vincularUsuario('3', '2', '4'))).toBe(true)
    expect(store.empresaAdminPorId('2')!.equipe.map(m => m.usuario.id)).toContain('3')

    expect(await aguardar(store.vincularUsuario('3', '2', '3'))).toBe(false)
    expect(store.usuarioPorId('3')!.empresas.filter(v => v.empresaId === '2')).toHaveLength(1)
  })

  it('desvincula um usuário comum', async () => {
    const store = useAdminStore()

    expect(await aguardar(store.desvincularUsuario('4', '1'))).toBe(true)
    expect(store.empresaAdminPorId('1')!.equipe.map(m => m.usuario.id)).not.toContain('4')
  })

  it('RECUSA desvincular o dono da própria empresa (REQ-07 / B9)', async () => {
    const store = useAdminStore()

    expect(await aguardar(store.desvincularUsuario('2', '1'))).toBe(false)

    const equipe = store.empresaAdminPorId('1')!.equipe
    expect(equipe.map(m => m.usuario.id)).toContain('2')
    expect(equipe.find(m => m.dono)!.usuario.id).toBe('2')
  })

  it('a mesma pessoa continua podendo perder acesso a uma empresa que não é dela', async () => {
    const store = useAdminStore()

    // Ana é dona da emp-001, mas apenas convidada na emp-003
    expect(await aguardar(store.desvincularUsuario('2', '3'))).toBe(true)
    expect(store.usuarioPorId('2')!.empresas.map(v => v.empresaId)).toEqual(['1'])
  })
})

// ─── Relatório da base (integracao-backend-relatorios, REQ-11/F9) ────────────

describe('relatório GESTAO_EMPRESAS_USUARIOS — só para o ADMIN global', () => {
  it('o gestor vê a ação de exportar a base na Visão Geral', async () => {
    const app = await montarAppComo(GESTOR)
    await app.irPara('/admin')

    expect(app.wrapper.find('.admin-relatorio').exists()).toBe(true)
    expect(app.texto()).toContain('Visualizar PDF')
    expect(app.texto()).toContain('Baixar XLSX')
    app.desmontar()
  })

  it.each([
    ['Ana (PROPRIETARIO, todas as permissões)', 'ana@docesdaana.com.br'],
    ['Marcos (GERENTE)', 'marcos@docesdaana.com.br'],
  ])('%s nunca chega na Visão Geral para ver a ação (rota barrada)', async (_nome, email) => {
    const app = await montarAppComo(email)
    await app.irPara('/admin')

    expect(app.wrapper.find('.admin-relatorio').exists()).toBe(false)
    app.desmontar()
  })
})

// ─── Identidade visual (REQ-08/REQ-09) ───────────────────────────────────────

describe('escopo de tema neutro (FR10)', () => {
  it('o layout entra no escopo neutro em /admin e sai fora dele', async () => {
    const app = await montarAppComo(GESTOR)

    await app.irPara('/admin/empresas')
    expect(app.wrapper.find('.app-layout').classes()).toContain('theme-admin')
    expect(document.documentElement.classList.contains('theme-admin')).toBe(true)

    await app.irPara('/produtos')
    expect(app.wrapper.find('.app-layout').classes()).not.toContain('theme-admin')
    expect(document.documentElement.classList.contains('theme-admin')).toBe(false)

    app.desmontar()
  })

  it('o header troca o seletor de empresa pelo selo de modo gestor', async () => {
    const app = await montarAppComo(GESTOR)

    await app.irPara('/admin')
    expect(app.wrapper.find('.switcher__trigger').exists()).toBe(false)
    expect(app.wrapper.find('.modo-gestor').exists()).toBe(true)

    await app.irPara('/dashboard')
    expect(app.wrapper.find('.switcher__trigger').exists()).toBe(true)
    expect(app.wrapper.find('.modo-gestor').exists()).toBe(false)

    app.desmontar()
  })

  it('quem não é gestor nunca entra no escopo administrativo', async () => {
    const app = await montarAppComo('ana@docesdaana.com.br')

    await app.irPara('/admin/empresas')  // barrada, cai no dashboard
    expect(app.wrapper.find('.app-layout').classes()).not.toContain('theme-admin')
    expect(document.documentElement.classList.contains('theme-admin')).toBe(false)

    app.desmontar()
  })
})
