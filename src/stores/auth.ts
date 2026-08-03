import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Perfil, PermissaoChave, Usuario } from '@/types'
import { apolloClient } from '@/graphql/client'
import { LOGIN, RENOVAR_SESSAO, ENCERRAR_SESSAO } from '@/graphql/operations/acesso'
import { guardarSessao, haSessaoRestauravel, limparSessao, tokenDeRenovacao } from '@/graphql/sessao'
import { classificarErro } from '@/graphql/erros'
import { isAdminGlobal, perfilEfetivo, temPermissao } from '@/auth/autorizacao'
import { resetarStoresDeSessao } from './reset'
import { useEmpresaStore } from './empresa'

export const useAuthStore = defineStore('auth', () => {
  /** Usuário autenticado, como o backend o descreve — sem perfil fixado. */
  const user = ref<Usuario | null>(null)
  const loading = ref(false)
  /** Mensagem pronta para a tela; `null` quando não há erro pendente. */
  const erro = ref<string | null>(null)

  /**
   * Perfil que vale agora — depende da **empresa ativa** (REQ-09).
   *
   * `useEmpresaStore()` é chamado **aqui dentro**, não no topo do setup: o store
   * de empresa importa este módulo, e resolver a dependência só no momento do
   * acesso é o que mantém o ciclo inofensivo.
   */
  const perfil = computed<Perfil | null>(() =>
    perfilEfetivo(user.value, useEmpresaStore().empresaAtivaId),
  )

  /** ADMIN global (R09): enxerga e opera todas as empresas */
  const adminGlobal = computed(() => isAdminGlobal(perfil.value))

  /** Guarda o par de tokens e o usuário devolvidos por login/renovação. */
  function aceitarSessao(payload: {
    token: string
    refreshToken: string
    usuario: Usuario
  }): void {
    guardarSessao(payload.token, payload.refreshToken)
    user.value = payload.usuario
  }

  async function login(email: string, senha: string): Promise<boolean> {
    loading.value = true
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: LOGIN,
        variables: { email, senha },
      })
      aceitarSessao(data.login)
      return true
    } catch (e) {
      // Inclui usuário inativo (REQ-05): o backend recusa, o front só explica.
      erro.value = classificarErro(e, 'login').mensagem
      limparSessao()
      user.value = null
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Recupera a sessão a partir do refresh guardado — é o que faz o F5 não pedir
   * senha (REQ-02). Chamado no boot, antes de montar o app.
   */
  async function restaurarSessao(): Promise<boolean> {
    const refreshToken = tokenDeRenovacao()
    if (!haSessaoRestauravel() || !refreshToken) return false

    loading.value = true
    try {
      const { data } = await apolloClient.mutate({
        mutation: RENOVAR_SESSAO,
        variables: { refreshToken },
      })
      aceitarSessao(data.renovarSessao)
      return true
    } catch {
      // Refresh vencido ou revogado: começa do zero, em silêncio. Não é erro do
      // usuário — ele nem pediu nada ainda.
      limparSessao()
      user.value = null
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Encerra a sessão no servidor e apaga todo rastro local (REQ-04).
   *
   * A mutation é **best-effort**: se a rede falhar, o refresh token continua
   * válido no servidor até expirar, mas manter o usuário logado no navegador por
   * causa disso seria pior. A limpeza local acontece de qualquer forma.
   */
  async function logout(): Promise<void> {
    try {
      await apolloClient.mutate({ mutation: ENCERRAR_SESSAO })
    } catch {
      /* sessão já inválida ou rede fora: a limpeza local segue */
    }
    limparSessao()
    user.value = null
    erro.value = null
    resetarStoresDeSessao()
    // Depois dos stores: o cache do Apollo não pode reidratar o que acabou de
    // ser limpo na próxima consulta.
    await apolloClient.clearStore()
  }

  function hasPermissao(chave: PermissaoChave): boolean {
    return temPermissao(perfil.value, chave)
  }

  return { user, perfil, loading, erro, adminGlobal, login, restaurarSessao, logout, hasPermissao }
})
