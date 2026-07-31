import { describe, it, expect } from 'vitest'
import type { AuthUser, Empresa } from '@/types'
import {
  empresasAutorizadas,
  podeAcessarEmpresa,
  isAdminGlobal,
  isDono,
  isCompartilhada,
  temPermissao,
} from './autorizacao'
import {
  mockEmpresas,
  perfilAdminGlobal,
  perfilProprietario,
  perfilVendedor,
  perfilContador,
} from '@/mock/data'

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Ana: dona da emp-001 e convidada (compartilhada) na emp-003 */
const ana: AuthUser = {
  id: 'usr-001',
  nome: 'Ana Paula Santos',
  email: 'ana@docesdaana.com.br',
  perfil: perfilProprietario,
  vinculos: [
    { empresaId: 'emp-001', perfilId: perfilProprietario.id },
    { empresaId: 'emp-003', perfilId: perfilContador.id },
  ],
}

/** Roberto: dono apenas da emp-002 */
const roberto: AuthUser = {
  id: 'usr-005',
  nome: 'Roberto Menezes',
  email: 'roberto@metalforte.com.br',
  perfil: perfilProprietario,
  vinculos: [{ empresaId: 'emp-002', perfilId: perfilProprietario.id }],
}

/** Carla: sem empresa própria, só compartilhada na emp-001 */
const carla: AuthUser = {
  id: 'usr-003',
  nome: 'Carla Lima',
  email: 'carla@docesdaana.com.br',
  perfil: perfilVendedor,
  vinculos: [{ empresaId: 'emp-001', perfilId: perfilVendedor.id }],
}

/** ADMIN global: nenhum vínculo, mas escopo global */
const admin: AuthUser = {
  id: 'usr-000',
  nome: 'Edvaldo Santiago',
  email: 'admin@markup.com.br',
  perfil: perfilAdminGlobal,
  vinculos: [],
}

const ids = (emps: Empresa[]) => emps.map(e => e.id).sort()

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('R09 — ownership multi-empresa', () => {
  it('dono enxerga a empresa que cadastrou', () => {
    expect(isDono(roberto, mockEmpresas.find(e => e.id === 'emp-002')!)).toBe(true)
    expect(isDono(roberto, mockEmpresas.find(e => e.id === 'emp-001')!)).toBe(false)
  })

  it('empresa compartilhada entra pelo vínculo, não pela propriedade', () => {
    const nexatech = mockEmpresas.find(e => e.id === 'emp-003')!
    expect(isDono(ana, nexatech)).toBe(false)
    expect(isCompartilhada(ana, nexatech)).toBe(true)
  })

  it('usuário vê a união de próprias ∪ compartilhadas', () => {
    expect(ids(empresasAutorizadas(ana, mockEmpresas))).toEqual(['emp-001', 'emp-003'])
  })

  it('cada dono vê só a sua — um não enxerga a empresa do outro', () => {
    expect(ids(empresasAutorizadas(roberto, mockEmpresas))).toEqual(['emp-002'])
    expect(empresasAutorizadas(roberto, mockEmpresas)).not.toContainEqual(
      expect.objectContaining({ id: 'emp-001' })
    )
  })

  it('usuário só compartilhado vê apenas a empresa em que foi convidado', () => {
    expect(ids(empresasAutorizadas(carla, mockEmpresas))).toEqual(['emp-001'])
  })

  it('ADMIN global vê todas as empresas mesmo sem nenhum vínculo', () => {
    expect(admin.vinculos).toHaveLength(0)
    expect(isAdminGlobal(admin)).toBe(true)
    expect(ids(empresasAutorizadas(admin, mockEmpresas))).toEqual(ids(mockEmpresas))
  })

  it('proprietário não é ADMIN global — o perfil de dono não vaza escopo', () => {
    expect(isAdminGlobal(ana)).toBe(false)
    expect(empresasAutorizadas(ana, mockEmpresas).length).toBeLessThan(mockEmpresas.length)
  })

  it('usuário deslogado não vê nada', () => {
    expect(empresasAutorizadas(null, mockEmpresas)).toEqual([])
    expect(podeAcessarEmpresa(null, 'emp-001', mockEmpresas)).toBe(false)
  })

  it('nega acesso a empresaId de outro dono (R09: não confiar no id do cliente)', () => {
    expect(podeAcessarEmpresa(roberto, 'emp-002', mockEmpresas)).toBe(true)
    expect(podeAcessarEmpresa(roberto, 'emp-001', mockEmpresas)).toBe(false)
    expect(podeAcessarEmpresa(roberto, 'emp-inexistente', mockEmpresas)).toBe(false)
  })

  it('ADMIN acessa empresa de qualquer dono', () => {
    for (const emp of mockEmpresas) {
      expect(podeAcessarEmpresa(admin, emp.id, mockEmpresas)).toBe(true)
    }
  })
})

describe('RBAC — permissões do perfil', () => {
  it('vendedor só lê produtos e relatórios', () => {
    expect(temPermissao(carla, 'PRODUTO_READ')).toBe(true)
    expect(temPermissao(carla, 'RELATORIO_READ')).toBe(true)
    expect(temPermissao(carla, 'PRODUTO_WRITE')).toBe(false)
    expect(temPermissao(carla, 'USUARIO_READ')).toBe(false)
  })

  it('proprietário e ADMIN têm todas as permissões', () => {
    for (const u of [ana, admin]) {
      expect(temPermissao(u, 'USUARIO_WRITE')).toBe(true)
      expect(temPermissao(u, 'PERFIL_WRITE')).toBe(true)
    }
  })

  it('deslogado não tem permissão alguma', () => {
    expect(temPermissao(null, 'PRODUTO_READ')).toBe(false)
  })
})
