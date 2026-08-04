/**
 * Store do **módulo de Gestão do Site** (spec `integracao-backend-gestao-site`).
 *
 * É a **única** store que não filtra por empresa ativa: o gestor precisa da
 * base inteira. Por isso todo caminho de entrada — carga e cada ação — checa o
 * escopo global antes de tocar em qualquer dado; para quem não é ADMIN, esta
 * store é um conjunto vazio e um punhado de `false`. O backend continua sendo
 * a autoridade (R02/R05/R09): aqui a UI só deixa de oferecer o que o servidor
 * negaria.
 *
 * `empresas` guarda `EmpresaAdmin[]` **como o servidor devolve** — dono e
 * equipe já compostos por `todasEmpresas`/`empresaAdmin`. Não existe mais uma
 * junção local cruzando `Empresa[]` com `Usuario[]`: essa junção calculava
 * "quem é o dono" e "quem está na equipe" a partir de duas listas soltas, e o
 * servidor faz isso com uma fonte só (Artigo III v2.5.0).
 *
 * `usuariosAdmin` continua cruzando `usuarios` com `empresas` por
 * `empresaId` — mas isso não é o mesmo tipo de conta: é resolver uma
 * referência (`UsuarioEmpresa.empresaId`) contra uma lista já buscada, que é
 * o uso que o próprio contrato pede (ver comentário em `VinculoEmpresa`).
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Empresa, EmpresaAdmin, MetricasBase, Perfil, Usuario } from '@/types'
import { apolloClient } from '@/graphql/client'
import {
  TODAS_EMPRESAS, EMPRESA_ADMIN, TODOS_USUARIOS, METRICAS_DA_BASE,
  VINCULAR_USUARIO, DESVINCULAR_USUARIO, DEFINIR_PERFIL_NO_VINCULO, DEFINIR_USUARIO_ATIVO,
} from '@/graphql/operations/admin'
import { mensagemDeErro } from '@/graphql/erros'
import { podeAcessarModuloAdmin } from '@/auth/autorizacao'
import { useAuthStore } from './auth'
import { registrarResetDeSessao } from './reset'

/**
 * Uma empresa na qual o usuário entra, e com que perfil.
 *
 * `perfil` é sempre presente: `UsuarioEmpresa.perfil` é obrigatório no
 * contrato (não existe vínculo sem perfil).
 */
export interface AcessoDoUsuario {
  empresa: Empresa
  perfil: Perfil
  dono: boolean
}

/** Usuário visto pelo gestor do site: cadastro + escopo + onde ele entra */
export interface UsuarioAdmin {
  usuario: Usuario
  /** Perfil de escopo global (ADMIN) — quando presente, vale para todas as empresas */
  perfilGlobal: Perfil | null
  acessos: AcessoDoUsuario[]
}

export const useAdminStore = defineStore('admin', () => {
  const auth = useAuthStore()

  const empresas = ref<EmpresaAdmin[]>([])
  const usuarios = ref<Usuario[]>([])
  const perfis = ref<Perfil[]>([])
  const metricas = ref<MetricasBase | null>(null)
  const loading = ref(false)
  const carregado = ref(false)
  const erro = ref<string | null>(null)

  /** A sessão atual é a do gestor do site? */
  const souGestor = computed(() => podeAcessarModuloAdmin(auth.perfil))

  function limpar(): void {
    empresas.value = []
    usuarios.value = []
    perfis.value = []
    metricas.value = null
    carregado.value = false
    erro.value = null
  }

  // A base inteira da Gestão do Site não pode sobreviver ao logout (REQ-04 da fatia 1)
  registrarResetDeSessao(limpar)

  /** Carrega a base inteira: `todasEmpresas` + `todosUsuarios` + `metricasDaBase`. */
  async function fetchTudo(): Promise<void> {
    if (!souGestor.value) {
      limpar()
      return
    }
    loading.value = true
    erro.value = null
    try {
      const [respEmpresas, respUsuarios, respMetricas] = await Promise.all([
        apolloClient.query({ query: TODAS_EMPRESAS, fetchPolicy: 'network-only' }),
        apolloClient.query({ query: TODOS_USUARIOS, fetchPolicy: 'network-only' }),
        apolloClient.query({ query: METRICAS_DA_BASE, fetchPolicy: 'network-only' }),
      ])
      empresas.value = [...respEmpresas.data.todasEmpresas]
      usuarios.value = [...respUsuarios.data.todosUsuarios]
      metricas.value = respMetricas.data.metricasDaBase
      // Perfis não têm query própria de admin — vêm do cadastro de sistema, já
      // usado em `usuarios.ts`; aqui só precisamos deles para os formulários
      // de vínculo, então reaproveitamos o mesmo catálogo via `perfis` global
      // se já carregado, ou derivamos dos vínculos visíveis.
      perfis.value = derivarPerfisVisiveis()
      carregado.value = true
    } catch (e) {
      erro.value = mensagemDeErro(e, 'todasEmpresas')
      limpar()
    } finally {
      loading.value = false
    }
  }

  /**
   * O contrato não tem `perfis` de escopo global dedicado à Gestão do Site — o
   * conjunto de perfis existentes se descobre pelos vínculos já carregados.
   * Cobre o caso de uso real (selecionar perfil ao vincular usuário a uma
   * empresa onde ele já não está); não inventa perfil que não apareça em uso.
   */
  function derivarPerfisVisiveis(): Perfil[] {
    const porId = new Map<string, Perfil>()
    for (const usuarioAdmin of usuarios.value) {
      if (usuarioAdmin.perfilGlobal) porId.set(usuarioAdmin.perfilGlobal.id, usuarioAdmin.perfilGlobal)
      for (const vinculo of usuarioAdmin.empresas) porId.set(vinculo.perfil.id, vinculo.perfil)
    }
    for (const empresaAdmin of empresas.value) {
      for (const membro of empresaAdmin.equipe) {
        if (membro.perfil) porId.set(membro.perfil.id, membro.perfil)
      }
    }
    return [...porId.values()]
  }

  async function buscarEmpresaAdmin(empresaId: string): Promise<EmpresaAdmin | null> {
    if (!souGestor.value) return null
    try {
      const { data } = await apolloClient.query({
        query: EMPRESA_ADMIN,
        variables: { empresaId },
        fetchPolicy: 'network-only',
      })
      return data.empresaAdmin
    } catch (e) {
      erro.value = mensagemDeErro(e, 'empresaAdmin')
      return null
    }
  }

  const perfilPorId = (id: string): Perfil | null =>
    perfis.value.find(p => p.id === id) ?? null

  const usuarioPorId = (id: string): Usuario | null =>
    usuarios.value.find(u => u.id === id) ?? null

  const empresaAdminPorId = (id: string): EmpresaAdmin | null =>
    empresas.value.find(e => e.empresa.id === id) ?? null

  /**
   * Usuários com escopo e acessos resolvidos, prontos para a listagem global.
   *
   * Cruza `usuarios` (de `todosUsuarios`) com `empresas` (de `todasEmpresas`)
   * por `empresaId` — resolução de referência, não agregação nova: é o uso
   * que `UsuarioEmpresa.empresaId` (id solto, de propósito) pede.
   */
  const usuariosAdmin = computed<UsuarioAdmin[]>(() =>
    usuarios.value.map(usuario => ({
      usuario,
      perfilGlobal: usuario.perfilGlobal ?? null,
      acessos: usuario.empresas
        .map(v => {
          const empresaAdmin = empresas.value.find(e => e.empresa.id === v.empresaId)
          if (!empresaAdmin) return null
          return {
            empresa: empresaAdmin.empresa,
            perfil: v.perfil,
            dono: empresaAdmin.empresa.donoUsuarioId === usuario.id,
          }
        })
        .filter((a): a is AcessoDoUsuario => a !== null),
    })),
  )

  /** Quantos usuários têm cada perfil — contagem sobre lista já correta, não agregado novo. */
  const usuariosPorPerfil = computed(() =>
    perfis.value.map(perfil => ({
      perfil,
      total: usuarios.value.filter(u =>
        u.perfilGlobal?.id === perfil.id || u.empresas.some(v => v.perfil.id === perfil.id),
      ).length,
    })),
  )

  // ─── Ações do gestor ────────────────────────────────────────────────────────

  /** Ativa/desativa o acesso de um usuário. Devolve o novo estado, ou `null` se recusado. */
  async function definirUsuarioAtivo(usuarioId: string, ativo: boolean): Promise<boolean | null> {
    if (!souGestor.value) return null
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: DEFINIR_USUARIO_ATIVO,
        variables: { usuarioId, ativo },
      })
      // Substitui o elemento, não muta `usuario.ativo` — o objeto veio do
      // Apollo e é **congelado**; atribuir a uma propriedade dele lança em
      // modo estrito (o mesmo bug já visto na fatia 1, aqui num lugar novo).
      const idx = usuarios.value.findIndex(u => u.id === usuarioId)
      if (idx >= 0) {
        usuarios.value[idx] = { ...usuarios.value[idx], ativo: data.definirUsuarioAtivo.ativo }
      }
      return data.definirUsuarioAtivo.ativo
    } catch (e) {
      erro.value = mensagemDeErro(e, 'definirUsuarioAtivo')
      return null
    }
  }

  /** Troca o perfil de um usuário **dentro de uma empresa** (não mexe no escopo global). */
  async function definirPerfilNoVinculo(
    usuarioId: string, empresaId: string, perfilId: string,
  ): Promise<boolean> {
    if (!souGestor.value) return false
    erro.value = null
    try {
      await apolloClient.mutate({
        mutation: DEFINIR_PERFIL_NO_VINCULO,
        variables: { usuarioId, empresaId, perfilId },
      })
      // A equipe da empresa mudou: recarrega o que exibe isso.
      await Promise.all([recarregarEmpresas(), recarregarMetricas()])
      return true
    } catch (e) {
      erro.value = mensagemDeErro(e, 'definirPerfilNoVinculo')
      return false
    }
  }

  /** Dá acesso de um usuário existente a uma empresa. Vínculo repetido é recusado pelo servidor. */
  async function vincularUsuario(
    usuarioId: string, empresaId: string, perfilId: string,
  ): Promise<boolean> {
    if (!souGestor.value) return false
    erro.value = null
    try {
      await apolloClient.mutate({
        mutation: VINCULAR_USUARIO,
        variables: { usuarioId, empresaId, perfilId },
      })
      await Promise.all([recarregarTodosUsuarios(), recarregarEmpresas(), recarregarMetricas()])
      return true
    } catch (e) {
      erro.value = mensagemDeErro(e, 'vincularUsuario')
      return false
    }
  }

  /**
   * Remove o acesso de um usuário a uma empresa.
   *
   * O **dono não pode ser desvinculado** da própria empresa: ela ficaria sem
   * responsável (B9/R09). A checagem local aqui é só atalho de UI — evita a
   * viagem de rede para um caso que o servidor sempre recusaria; quem decide
   * de verdade é o `catch` abaixo.
   */
  async function desvincularUsuario(usuarioId: string, empresaId: string): Promise<boolean> {
    if (!souGestor.value) return false
    const empresaAdmin = empresaAdminPorId(empresaId)
    if (empresaAdmin?.empresa.donoUsuarioId === usuarioId) return false
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: DESVINCULAR_USUARIO,
        variables: { usuarioId, empresaId },
      })
      if (data.desvincularUsuario) {
        await Promise.all([recarregarTodosUsuarios(), recarregarEmpresas(), recarregarMetricas()])
      }
      return data.desvincularUsuario
    } catch (e) {
      erro.value = mensagemDeErro(e, 'desvincularUsuario')
      return false
    }
  }

  async function recarregarEmpresas(): Promise<void> {
    const { data } = await apolloClient.query({ query: TODAS_EMPRESAS, fetchPolicy: 'network-only' })
    empresas.value = [...data.todasEmpresas]
  }

  async function recarregarTodosUsuarios(): Promise<void> {
    const { data } = await apolloClient.query({ query: TODOS_USUARIOS, fetchPolicy: 'network-only' })
    usuarios.value = [...data.todosUsuarios]
  }

  async function recarregarMetricas(): Promise<void> {
    const { data } = await apolloClient.query({ query: METRICAS_DA_BASE, fetchPolicy: 'network-only' })
    metricas.value = data.metricasDaBase
  }

  return {
    // estado
    empresas, usuarios, perfis, metricas, loading, carregado, erro, souGestor,
    // derivados
    usuariosAdmin, empresaAdminPorId, usuariosPorPerfil,
    perfilPorId, usuarioPorId,
    // ações
    fetchTudo, buscarEmpresaAdmin, limpar,
    definirUsuarioAtivo, definirPerfilNoVinculo, vincularUsuario, desvincularUsuario,
  }
})
