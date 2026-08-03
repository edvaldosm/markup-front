/**
 * Aceite da R09 — navegação multi-usuário.
 *
 * Sobe o app real (router + AppLayout + views) e percorre a jornada de cada
 * persona, comprovando que:
 *   1. o seletor lista só as empresas autorizadas;
 *   2. o menu mostra só o que o perfil permite;
 *   3. cada tela permitida abre e carrega;
 *   4. rota proibida não abre;
 *   5. **nenhum dado de outra empresa aparece** — nem no store, nem na tela.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { montarAppComo, entrarComo, aguardar, prepararAmbiente } from './app-harness'
import { SENHA_PADRAO, type ServidorFalso } from './servidor-falso'
import { useAuthStore } from '@/stores/auth'
import { useEmpresaStore } from '@/stores/empresa'
import { useProdutosStore } from '@/stores/produtos'
import { useMateriaisStore } from '@/stores/materiais'
import { useDespesasStore } from '@/stores/despesas'
import { useUsuariosStore } from '@/stores/usuarios'
import { mockProdutos, mockMateriais, mockDespesasFixas } from '@/mock/data'

// ─── Personas ────────────────────────────────────────────────────────────────

interface Persona {
  nome: string
  email: string
  perfil: string
  /** empresas que ele DEVE ver, em ordem alfabética de id */
  empresas: string[]
  /** rotas que o perfil permite */
  permitidas: string[]
  /** rotas que devem ser barradas para o dashboard */
  bloqueadas: string[]
}

const TODAS = ['/empresa', '/materiais', '/despesas', '/impostos', '/produtos',
               '/precificacao', '/fator-r', '/relatorios', '/usuarios', '/perfis']

/**
 * Módulo de Gestão do Site — fora de `TODAS` de propósito: PROPRIETARIO tem todas
 * as permissões RBAC e mesmo assim não entra aqui. O que separa é o **escopo
 * global** (R09/FR10), não a permissão.
 */
const ADMIN = ['/admin', '/admin/empresas', '/admin/usuarios']

const semAsRotas = (bloqueadas: string[]) => TODAS.filter(r => !bloqueadas.includes(r))

const personas: Persona[] = [
  {
    nome: 'Edvaldo (ADMIN global)',
    email: 'admin@markup.com.br',
    perfil: 'ADMIN',
    empresas: ['1', '2', '3', '4'],
    permitidas: [...TODAS, ...ADMIN],
    bloqueadas: [],
  },
  {
    nome: 'Ana (dona + convidada)',
    email: 'ana@docesdaana.com.br',
    perfil: 'PROPRIETARIO',
    empresas: ['1', '3'],
    permitidas: TODAS,
    bloqueadas: [...ADMIN],
  },
  {
    nome: 'Roberto (dono da MetalForte)',
    email: 'roberto@metalforte.com.br',
    perfil: 'PROPRIETARIO',
    empresas: ['2'],
    permitidas: TODAS,
    bloqueadas: [...ADMIN],
  },
  {
    nome: 'Juliana (dona da NexaTech)',
    email: 'juliana@nexatech.com.br',
    perfil: 'PROPRIETARIO',
    empresas: ['3'],
    permitidas: TODAS,
    bloqueadas: [...ADMIN],
  },
  {
    nome: 'Marcos (gerente)',
    email: 'marcos@docesdaana.com.br',
    perfil: 'GERENTE',
    empresas: ['1'],
    permitidas: semAsRotas(['/impostos', '/usuarios', '/perfis']),
    bloqueadas: ['/impostos', '/usuarios', '/perfis', ...ADMIN],
  },
  {
    nome: 'Carla (vendedora)',
    email: 'carla@docesdaana.com.br',
    perfil: 'VENDEDOR',
    empresas: ['1'],
    permitidas: ['/produtos', '/precificacao', '/relatorios'],
    bloqueadas: ['/empresa', '/materiais', '/despesas', '/impostos', '/fator-r',
                 '/usuarios', '/perfis', ...ADMIN],
  },
]

// ─── Helpers de isolamento ───────────────────────────────────────────────────

const rotulosDe = (empresaId: string, iguais: boolean) => [
  ...mockProdutos.filter(p => (p.empresaId === empresaId) === iguais).map(p => p.nome),
  ...mockMateriais.filter(m => (m.empresaId === empresaId) === iguais).map(m => m.nome),
  ...mockDespesasFixas.filter(d => (d.empresaId === empresaId) === iguais).map(d => d.descricao),
]

/**
 * Nomes que pertencem **exclusivamente** a outras empresas — se um deles
 * aparecer na tela, houve vazamento.
 *
 * Descarta qualquer nome que se sobreponha aos da empresa ativa: nomes iguais,
 * mas também os que são prefixo/sufixo de um dela (ex.: "Energia elétrica" da
 * confeitaria vs. "Energia elétrica (maquinário pesado)" da indústria). Sem
 * isso a busca por substring acusaria vazamento onde não há.
 */
function nomesExclusivosDeOutras(empresaAtiva: string): string[] {
  const daAtiva = rotulosDe(empresaAtiva, true)
  const deOutras = new Set(rotulosDe(empresaAtiva, false))
  return [...deOutras].filter(
    nome => !daAtiva.some(meu => meu.includes(nome) || nome.includes(meu))
  )
}

let servidor: ServidorFalso

beforeEach(() => {
  // Os stores ainda no mock (catálogo) simulam latência com `setTimeout`; sessão
  // e empresas já vêm do servidor falso, que responde na hora.
  vi.useFakeTimers()
  servidor = prepararAmbiente()
})
afterEach(() => {
  servidor.restaurar()
  vi.useRealTimers()
})

// ─── Jornada por persona ─────────────────────────────────────────────────────

describe.each(personas)('jornada — $nome', (persona) => {
  it('vê exatamente as empresas autorizadas no seletor', async () => {
    const app = await montarAppComo(persona.email)
    const empresaStore = useEmpresaStore()

    expect(empresaStore.empresas.map(e => e.id).sort()).toEqual(persona.empresas)
    expect(empresaStore.empresaAtivaId).toBe(persona.empresas[0])

    // o dropdown lista uma entrada por empresa autorizada — nem mais, nem menos
    const listadas = await app.abrirSwitcher()
    expect(listadas).toHaveLength(persona.empresas.length)
    expect(listadas.sort()).toEqual(
      empresaStore.empresas.map(e => e.razaoSocial).sort()
    )
    app.desmontar()
  })

  it('o menu mostra só o que o perfil permite', async () => {
    const app = await montarAppComo(persona.email)
    const noMenu = app.rotasNoMenu()

    for (const rota of persona.bloqueadas) {
      expect(noMenu, `menu não deveria oferecer ${rota}`).not.toContain(rota)
    }
    for (const rota of persona.permitidas) {
      expect(noMenu, `menu deveria oferecer ${rota}`).toContain(rota)
    }
    expect(noMenu).toContain('/dashboard')
    app.desmontar()
  })

  it('abre todas as telas permitidas', async () => {
    const app = await montarAppComo(persona.email)

    for (const rota of persona.permitidas) {
      const nome = await app.irPara(rota)
      expect(nome, `deveria abrir ${rota}`).not.toBe('dashboard')
      expect(app.router.currentRoute.value.path).toBe(rota)
    }
    app.desmontar()
  })

  it('é barrado nas telas que o perfil não permite', async () => {
    const app = await montarAppComo(persona.email)

    for (const rota of persona.bloqueadas) {
      const nome = await app.irPara(rota)
      expect(nome, `${rota} deveria cair no dashboard`).toBe('dashboard')
    }
    app.desmontar()
  })

  it('nenhum dado de outra empresa aparece na tela', async () => {
    const app = await montarAppComo(persona.email)
    const empresaStore = useEmpresaStore()
    const ativa = empresaStore.empresaAtivaId

    // percorre as telas de dados que o perfil permite
    const telasDeDados = persona.permitidas.filter(r =>
      ['/produtos', '/materiais', '/despesas', '/relatorios', '/precificacao'].includes(r)
    )

    const proibidos = nomesExclusivosDeOutras(ativa)
    expect(proibidos.length, 'fixture precisa ter dados de outras empresas').toBeGreaterThan(0)

    for (const rota of telasDeDados) {
      await app.irPara(rota)
      const texto = app.texto()
      const vazou = proibidos.filter(nome => texto.includes(nome))
      expect(vazou, `vazou dado de outra empresa em ${rota}`).toEqual([])
    }
    app.desmontar()
  })
})

// ─── Isolamento no nível dos stores ──────────────────────────────────────────

describe('isolamento de dados por empresa (R02/R09)', () => {
  it.each(personas)('$nome só expõe registros da empresa ativa', async (persona) => {
    await entrarComo(persona.email)
    const empresaStore = useEmpresaStore()
    await aguardar(empresaStore.fetchEmpresas())

    const produtos = useProdutosStore()
    const materiais = useMateriaisStore()
    const despesas = useDespesasStore()
    await aguardar(Promise.all([
      produtos.fetchProdutos(), materiais.fetchMateriais(), despesas.fetchDespesas(),
    ]))

    const ativa = empresaStore.empresaAtivaId
    expect(produtos.produtos.every(p => p.empresaId === ativa)).toBe(true)
    expect(materiais.materiais.every(m => m.empresaId === ativa)).toBe(true)
    expect(despesas.despesas.every(d => d.empresaId === ativa)).toBe(true)
  })

  it('trocar de empresa troca o conjunto de dados exposto', async () => {
    await entrarComo('ana@docesdaana.com.br') // emp-001 + emp-003
    const empresaStore = useEmpresaStore()
    await aguardar(empresaStore.fetchEmpresas())

    const produtos = useProdutosStore()
    await aguardar(produtos.fetchProdutos())

    expect(empresaStore.empresaAtivaId).toBe('1')
    const daConfeitaria = produtos.produtos.map(p => p.id)
    expect(daConfeitaria.length).toBeGreaterThan(0)
    expect(produtos.produtos.every(p => p.empresaId === '1')).toBe(true)

    expect(empresaStore.selecionarEmpresa('3')).toBe(true)
    expect(produtos.produtos.every(p => p.empresaId === '3')).toBe(true)
    // nenhum produto da confeitaria sobrou
    expect(produtos.produtos.some(p => daConfeitaria.includes(p.id))).toBe(false)
  })

  it('usuários listados são só os vinculados à empresa ativa', async () => {
    await entrarComo('roberto@metalforte.com.br') // emp-002
    const empresaStore = useEmpresaStore()
    await aguardar(empresaStore.fetchEmpresas())

    const usuarios = useUsuariosStore()
    await aguardar(usuarios.fetchUsuarios())

    expect(usuarios.usuarios.length).toBeGreaterThan(0)
    for (const u of usuarios.usuarios) {
      expect(u.empresas.some(v => v.empresaId === '2')).toBe(true)
    }
    // a equipe da Doces da Ana não aparece para o dono da MetalForte
    expect(usuarios.usuarios.map(u => u.email)).not.toContain('carla@docesdaana.com.br')
  })
})

// ─── Troca de sessão ─────────────────────────────────────────────────────────

describe('troca de usuário não vaza contexto', () => {
  it('sair de um dono e entrar como outro troca todo o conjunto', async () => {
    const app = await montarAppComo('ana@docesdaana.com.br')
    const empresaStore = useEmpresaStore()
    expect(empresaStore.empresas.map(e => e.id).sort()).toEqual(['1', '3'])
    app.desmontar()

    // nova sessão, outro dono
    setActivePinia(createPinia())
    const app2 = await montarAppComo('roberto@metalforte.com.br')
    const empresaStore2 = useEmpresaStore()

    expect(empresaStore2.empresas.map(e => e.id)).toEqual(['2'])
    expect(app2.texto()).not.toContain('Doces da Ana')
    app2.desmontar()
  })

  it('usuário inativo não consegue entrar', async () => {
    const auth = useAuthStore()
    // Ricardo está com `ativo: false` no cadastro
    expect(await aguardar(auth.login('contador@contabilidade.com.br', SENHA_PADRAO))).toBe(false)
    expect(auth.user).toBeNull()
  })
})
