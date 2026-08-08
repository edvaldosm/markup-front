/**
 * O que sobrou para o front decidir: **qual perfil vale agora** e o que ele
 * permite. *Quais empresas* o usuário vê saiu daqui — é resposta do servidor
 * (`minhasEmpresas`, B9), e está coberto em `src/stores/empresa.spec.ts`.
 */
import { describe, it, expect } from 'vitest'
import type { Empresa, Usuario } from '@/types'
import { perfilEfetivo, isAdminGlobal, podeAcessarModuloAdmin, temPermissao, souDonoDaEmpresa } from './autorizacao'
import {
  perfilAdminGlobal,
  perfilProprietario,
  perfilVendedor,
  perfilContador,
  mockEmpresa,
} from '@/test/fixtures'

// ─── Fixtures ────────────────────────────────────────────────────────────────

/**
 * Ana tem **perfis diferentes por empresa**: dona da emp-001, convidada como
 * contadora na emp-003. É o caso que o protótipo errava — e existe no seed real.
 */
const ana: Usuario = {
  id: '2',
  nome: 'Ana Paula Santos',
  email: 'ana@docesdaana.com.br',
  cpf: '529.982.247-25',
  dataNascimento: '1988-04-12',
  ativo: true,
  empresas: [
    { empresaId: '1', perfil: perfilProprietario },
    { empresaId: '3', perfil: perfilContador },
  ],
}

const carla: Usuario = {
  id: '4',
  nome: 'Carla Lima',
  email: 'carla@docesdaana.com.br',
  cpf: '111.444.777-35',
  dataNascimento: '1995-09-03',
  ativo: true,
  empresas: [{ empresaId: '1', perfil: perfilVendedor }],
}

/** ADMIN global: nenhum vínculo, mas escopo global */
const admin: Usuario = {
  id: '1',
  nome: 'Edvaldo Santiago',
  email: 'admin@markup.com.br',
  cpf: '123.456.789-09',
  dataNascimento: '1980-01-20',
  ativo: true,
  empresas: [],
  perfilGlobal: perfilAdminGlobal,
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('perfil efetivo — o perfil é do vínculo, não do usuário (REQ-09)', () => {
  it('mesmo usuário, perfis diferentes conforme a empresa ativa', () => {
    expect(perfilEfetivo(ana, '1')?.nome).toBe('PROPRIETARIO')
    expect(perfilEfetivo(ana, '3')?.nome).toBe('CONTADOR')
  })

  it('trocar de empresa troca o que o usuário pode fazer', () => {
    // Como dona, escreve usuários; como contadora na outra empresa, não.
    expect(temPermissao(perfilEfetivo(ana, '1'), 'USUARIO_WRITE')).toBe(true)
    expect(temPermissao(perfilEfetivo(ana, '3'), 'USUARIO_WRITE')).toBe(false)
    // e ganha o que o perfil de contadora permite
    expect(temPermissao(perfilEfetivo(ana, '3'), 'IMPOSTO_WRITE')).toBe(true)
  })

  it('empresa sem vínculo não concede perfil nenhum', () => {
    // Sem isto, um id de empresa não autorizado herdaria o perfil de outra.
    expect(perfilEfetivo(ana, '2')).toBeNull()
    expect(perfilEfetivo(ana, '')).toBeNull()
  })

  it('escopo global prevalece e não depende de empresa ativa', () => {
    expect(admin.empresas).toHaveLength(0)
    expect(perfilEfetivo(admin, '')?.nome).toBe('ADMIN')
    expect(perfilEfetivo(admin, '2')?.nome).toBe('ADMIN')
  })

  it('deslogado não tem perfil', () => {
    expect(perfilEfetivo(null, '1')).toBeNull()
  })
})

describe('escopo global (R09 + FR10)', () => {
  it('só o ADMIN entra na Gestão do Site', () => {
    expect(isAdminGlobal(perfilEfetivo(admin, ''))).toBe(true)
    expect(podeAcessarModuloAdmin(perfilEfetivo(admin, ''))).toBe(true)
  })

  it('proprietário tem todas as permissões e ainda assim não administra o site', () => {
    const perfil = perfilEfetivo(ana, '1')
    expect(temPermissao(perfil, 'PERFIL_WRITE')).toBe(true)
    expect(podeAcessarModuloAdmin(perfil)).toBe(false)
  })

  it('sem perfil não há escopo global', () => {
    expect(isAdminGlobal(null)).toBe(false)
    expect(podeAcessarModuloAdmin(null)).toBe(false)
  })
})

describe('RBAC — permissões do perfil', () => {
  it('vendedor só lê produtos e relatórios', () => {
    const perfil = perfilEfetivo(carla, '1')
    expect(temPermissao(perfil, 'PRODUTO_READ')).toBe(true)
    expect(temPermissao(perfil, 'RELATORIO_READ')).toBe(true)
    expect(temPermissao(perfil, 'PRODUTO_WRITE')).toBe(false)
    expect(temPermissao(perfil, 'USUARIO_READ')).toBe(false)
  })

  it('proprietário e ADMIN têm todas as permissões', () => {
    for (const perfil of [perfilEfetivo(ana, '1'), perfilEfetivo(admin, '')]) {
      expect(temPermissao(perfil, 'USUARIO_WRITE')).toBe(true)
      expect(temPermissao(perfil, 'PERFIL_WRITE')).toBe(true)
    }
  })

  it('deslogado não tem permissão alguma', () => {
    expect(temPermissao(null, 'PRODUTO_READ')).toBe(false)
  })
})

describe('souDonoDaEmpresa (REQ-03) — quem cadastrou a empresa, não quem tem a permissão RBAC', () => {
  it('dono da empresa: donoUsuarioId bate com o id do usuário', () => {
    // mockEmpresa (emp-001, Doces da Ana) tem donoUsuarioId '2' — a própria Ana
    expect(souDonoDaEmpresa(ana, mockEmpresa)).toBe(true)
  })

  it('não-dono: PROPRIETARIO vinculado, mas outro id é o dono', () => {
    // Carla não é dona de emp-001 mesmo que tivesse perfil PROPRIETARIO lá
    const carlaComoProprietaria: Usuario = { ...carla, empresas: [{ empresaId: '1', perfil: perfilProprietario }] }
    expect(souDonoDaEmpresa(carlaComoProprietaria, mockEmpresa)).toBe(false)
  })

  it('usuário ou empresa nulos não lançam — devolvem false', () => {
    expect(souDonoDaEmpresa(null, mockEmpresa)).toBe(false)
    expect(souDonoDaEmpresa(ana, null)).toBe(false)
    expect(souDonoDaEmpresa(null, null)).toBe(false)
  })

  it('empresa sem o mesmo dono não é confundida por coincidência de tipo', () => {
    const empresaDeOutroDono: Empresa = { ...mockEmpresa, donoUsuarioId: '999' }
    expect(souDonoDaEmpresa(ana, empresaDeOutroDono)).toBe(false)
  })
})
