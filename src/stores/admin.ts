import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Empresa, Perfil, Usuario, VinculoEmpresa, SegmentoNegocio } from '@/types'
import { mockEmpresas, mockUsuarios, mockPerfis } from '@/mock/data'
import { mockQuery } from '@/graphql/client'
import { podeAcessarModuloAdmin } from '@/auth/autorizacao'
import { useAuthStore } from './auth'

/** Um membro da equipe de uma empresa: quem é, com que perfil e se é o dono */
export interface MembroEquipe {
  usuario: Usuario
  perfil: Perfil | null
  dono: boolean
}

/** Empresa vista pelo gestor do site: cadastro + dono + equipe com acesso */
export interface EmpresaAdmin {
  empresa: Empresa
  dono: Usuario | null
  equipe: MembroEquipe[]
}

/** Uma empresa na qual o usuário entra, e com que perfil */
export interface AcessoDoUsuario {
  empresa: Empresa
  perfil: Perfil | null
  dono: boolean
}

/** Usuário visto pelo gestor do site: cadastro + escopo + onde ele entra */
export interface UsuarioAdmin {
  usuario: Usuario
  /** Perfil de escopo global (ADMIN) — quando presente, vale para todas as empresas */
  perfilGlobal: Perfil | null
  acessos: AcessoDoUsuario[]
}

/**
 * Store do **módulo de Gestão do Site** (spec `modulo-gestao-site`).
 *
 * É a **única** store que não filtra por empresa ativa: o gestor precisa da base
 * inteira. Por isso todo caminho de entrada — carga e cada ação — checa o escopo
 * global antes de tocar em qualquer dado. Para quem não é ADMIN, esta store é um
 * conjunto vazio e um punhado de `false`.
 *
 * O backend continua sendo a autoridade (R02/R05/R09): aqui a UI só deixa de
 * oferecer o que o servidor negaria.
 */
export const useAdminStore = defineStore('admin', () => {
  const auth = useAuthStore()

  const empresas = ref<Empresa[]>([])
  const usuarios = ref<Usuario[]>([])
  const perfis = ref<Perfil[]>([])
  const loading = ref(false)
  const carregado = ref(false)

  /** A sessão atual é a do gestor do site? */
  const souGestor = computed(() => podeAcessarModuloAdmin(auth.user))

  function limpar() {
    empresas.value = []
    usuarios.value = []
    perfis.value = []
    carregado.value = false
  }

  /**
   * Carrega a base inteira. Com o backend ligado, vira `todasEmpresas` +
   * `todosUsuarios` (queries de escopo global, F6).
   */
  async function fetchTudo() {
    if (!souGestor.value) {
      limpar()
      return
    }
    loading.value = true
    const [e, u, p] = await Promise.all([
      mockQuery([...mockEmpresas]),
      mockQuery([...mockUsuarios]),
      mockQuery([...mockPerfis]),
    ])
    empresas.value = e.data
    usuarios.value = u.data
    perfis.value = p.data
    carregado.value = true
    loading.value = false
  }

  const perfilPorId = (id: string): Perfil | null =>
    perfis.value.find(p => p.id === id) ?? null

  const usuarioPorId = (id: string): Usuario | null =>
    usuarios.value.find(u => u.id === id) ?? null

  /** Perfil efetivo de um vínculo — o embutido no mock ou o resolvido pelo id */
  const perfilDoVinculo = (v: VinculoEmpresa): Perfil | null =>
    v.perfil ?? perfilPorId(v.perfilId)

  /** Empresas com dono e equipe resolvidos, prontas para a listagem administrativa */
  const empresasAdmin = computed<EmpresaAdmin[]>(() =>
    empresas.value.map(empresa => {
      const dono = usuarios.value.find(u => u.id === empresa.donoUsuarioId) ?? null

      const equipe: MembroEquipe[] = usuarios.value
        .filter(u => u.empresas.some(v => v.empresaId === empresa.id))
        .map(usuario => {
          const vinculo = usuario.empresas.find(v => v.empresaId === empresa.id)!
          return {
            usuario,
            perfil: perfilDoVinculo(vinculo),
            dono: usuario.id === empresa.donoUsuarioId,
          }
        })

      // Empresa sem vínculo para o próprio dono não deveria existir (R09), mas se
      // acontecer o gestor precisa enxergar isso em vez de uma equipe sem dono.
      if (dono && !equipe.some(m => m.dono)) {
        equipe.unshift({ usuario: dono, perfil: null, dono: true })
      }

      return { empresa, dono, equipe }
    })
  )

  /** Usuários com escopo e acessos resolvidos, prontos para a listagem global */
  const usuariosAdmin = computed<UsuarioAdmin[]>(() =>
    usuarios.value.map(usuario => ({
      usuario,
      perfilGlobal: usuario.perfilGlobal ?? null,
      acessos: usuario.empresas
        .map(v => {
          const empresa = empresas.value.find(e => e.id === v.empresaId)
          if (!empresa) return null
          return {
            empresa,
            perfil: perfilDoVinculo(v),
            dono: empresa.donoUsuarioId === usuario.id,
          }
        })
        .filter((a): a is AcessoDoUsuario => a !== null),
    }))
  )

  const empresaAdminPorId = (id: string): EmpresaAdmin | null =>
    empresasAdmin.value.find(e => e.empresa.id === id) ?? null

  /** Indicadores da base — o painel de entrada do gestor */
  const metricas = computed(() => {
    const porSegmento = empresas.value.reduce((acc, e) => {
      acc[e.segmento] = (acc[e.segmento] ?? 0) + 1
      return acc
    }, {} as Record<SegmentoNegocio, number>)

    return {
      totalEmpresas: empresas.value.length,
      totalUsuarios: usuarios.value.length,
      usuariosAtivos: usuarios.value.filter(u => u.ativo).length,
      usuariosInativos: usuarios.value.filter(u => !u.ativo).length,
      totalVinculos: usuarios.value.reduce((acc, u) => acc + u.empresas.length, 0),
      faturamentoTotal: empresas.value.reduce((acc, e) => acc + e.faturamentoMedioMensal, 0),
      porSegmento,
    }
  })

  /** Quantos usuários têm cada perfil, contando vínculos + escopo global */
  const usuariosPorPerfil = computed(() =>
    perfis.value.map(perfil => ({
      perfil,
      total: usuarios.value.filter(u =>
        u.perfilGlobal?.id === perfil.id || u.empresas.some(v => v.perfilId === perfil.id)
      ).length,
    }))
  )

  // ─── Ações do gestor ────────────────────────────────────────────────────────
  // Mutam o "banco" mock através dos itens do próprio store (mesmos objetos), de
  // modo que a mudança sobrevive à navegação — mesma estratégia de `criarEmpresa`.

  /** Ativa/desativa o acesso de um usuário. Devolve o novo estado, ou `null` se recusado. */
  async function definirUsuarioAtivo(usuarioId: string, ativo: boolean): Promise<boolean | null> {
    if (!souGestor.value) return null
    const usuario = usuarioPorId(usuarioId)
    if (!usuario) return null
    loading.value = true
    await mockQuery(null, 250)
    usuario.ativo = ativo
    loading.value = false
    return usuario.ativo
  }

  /** Troca o perfil de um usuário **dentro de uma empresa** (não mexe no escopo global). */
  async function definirPerfilNoVinculo(
    usuarioId: string, empresaId: string, perfilId: string
  ): Promise<boolean> {
    if (!souGestor.value) return false
    const usuario = usuarioPorId(usuarioId)
    const perfil = perfilPorId(perfilId)
    const vinculo = usuario?.empresas.find(v => v.empresaId === empresaId)
    if (!usuario || !perfil || !vinculo) return false
    loading.value = true
    await mockQuery(null, 250)
    vinculo.perfilId = perfil.id
    vinculo.perfil = perfil
    loading.value = false
    return true
  }

  /** Dá acesso de um usuário existente a uma empresa. Vínculo repetido é recusado. */
  async function vincularUsuario(
    usuarioId: string, empresaId: string, perfilId: string
  ): Promise<boolean> {
    if (!souGestor.value) return false
    const usuario = usuarioPorId(usuarioId)
    const empresa = empresas.value.find(e => e.id === empresaId)
    const perfil = perfilPorId(perfilId)
    if (!usuario || !empresa || !perfil) return false
    if (usuario.empresas.some(v => v.empresaId === empresaId)) return false
    loading.value = true
    await mockQuery(null, 250)
    usuario.empresas.push({ empresaId, perfilId: perfil.id, perfil })
    loading.value = false
    return true
  }

  /**
   * Remove o acesso de um usuário a uma empresa.
   *
   * O **dono não pode ser desvinculado** da própria empresa (REQ-07): ela ficaria
   * sem responsável e sairia do conjunto de quem a cadastrou (B9/R09). Trocar de
   * dono é transferência de propriedade — fora do escopo desta spec.
   */
  async function desvincularUsuario(usuarioId: string, empresaId: string): Promise<boolean> {
    if (!souGestor.value) return false
    const usuario = usuarioPorId(usuarioId)
    const empresa = empresas.value.find(e => e.id === empresaId)
    if (!usuario || !empresa) return false
    if (empresa.donoUsuarioId === usuarioId) return false
    const idx = usuario.empresas.findIndex(v => v.empresaId === empresaId)
    if (idx < 0) return false
    loading.value = true
    await mockQuery(null, 250)
    usuario.empresas.splice(idx, 1)
    loading.value = false
    return true
  }

  return {
    // estado
    empresas, usuarios, perfis, loading, carregado, souGestor,
    // derivados
    empresasAdmin, usuariosAdmin, empresaAdminPorId, metricas, usuariosPorPerfil,
    perfilPorId, usuarioPorId,
    // ações
    fetchTudo, limpar,
    definirUsuarioAtivo, definirPerfilNoVinculo, vincularUsuario, desvincularUsuario,
  }
})
