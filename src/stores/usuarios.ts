/**
 * Usuários e perfis.
 *
 * Duas ausências deliberadas, herdadas do contrato:
 *
 * - **Não existe criação direta de usuário.** O cadastro é por convite, e o
 *   convite devolve uma senha provisória que só aparece uma vez.
 * - **Não existe escrita de perfil.** `perfil` é dado de sistema, nasce no
 *   Flyway. Como PROPRIETARIO tem `PERFIL_WRITE` e o perfil é global, permitir
 *   escrita promoveria qualquer dono a administrador de toda a base.
 *
 * Ao contrário do catálogo, `usuarios` não recebe `empresaId`: o escopo é o do
 * token. A lista da empresa ativa é recorte de exibição, não de autorização —
 * quem autoriza é o servidor.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Perfil, Usuario } from '@/types'
import { apolloClient } from '@/graphql/client'
import { ATUALIZAR_USUARIO, CONVIDAR_USUARIO, PERFIS, USUARIOS } from '@/graphql/operations/usuarios'
import { mensagemDeErro } from '@/graphql/erros'
import { useEmpresaStore } from './empresa'
import { registrarResetDeSessao } from './reset'

export interface Convidado {
  usuario: Usuario
  /** Exibida uma única vez: o servidor não a devolve de novo */
  senhaProvisoria: string
}

export const useUsuariosStore = defineStore('usuarios', () => {
  const empresaStore = useEmpresaStore()
  const todosUsuarios = ref<Usuario[]>([])
  const perfis = ref<Perfil[]>([])
  const loading = ref(false)
  const erro = ref<string | null>(null)

  /** Recorte de exibição: quem tem vínculo com a empresa ativa. */
  const usuarios = computed(() =>
    todosUsuarios.value.filter(u =>
      u.empresas.some(v => v.empresaId === empresaStore.empresaAtivaId),
    ),
  )

  async function fetchUsuarios(): Promise<void> {
    loading.value = true
    erro.value = null
    try {
      const [respostaUsuarios, respostaPerfis] = await Promise.all([
        apolloClient.query({ query: USUARIOS }),
        apolloClient.query({ query: PERFIS }),
      ])
      todosUsuarios.value = [...respostaUsuarios.data.usuarios]
      perfis.value = [...respostaPerfis.data.perfis]
    } catch (e) {
      erro.value = mensagemDeErro(e, 'usuarios')
      todosUsuarios.value = []
      perfis.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Convida alguém para a **empresa ativa**. Devolve a senha provisória para a
   * tela exibir uma vez; o store não a guarda, justamente para não haver de onde
   * exibi-la de novo.
   *
   * `cpf`/`dataNascimento` obrigatórios (REQ-01) — o servidor também passou a
   * exigir ser o dono da empresa ou ter escopo global; se o cliente estiver
   * desatualizado e mostrar o botão para quem não é (REQ-04), a recusa cai
   * aqui como qualquer outro erro de mutation (REQ-10).
   */
  async function convidar(
    nome: string, email: string, cpf: string, dataNascimento: string, perfilId: string,
  ): Promise<Convidado | null> {
    loading.value = true
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: CONVIDAR_USUARIO,
        variables: {
          nome, email, cpf, perfilId,
          dataNascimento: `${dataNascimento}T00:00:00.000Z`,
          empresaId: empresaStore.empresaAtivaId,
        },
      })
      todosUsuarios.value.push(data.convidarUsuario.usuario)
      return {
        usuario: data.convidarUsuario.usuario,
        senhaProvisoria: data.convidarUsuario.senhaProvisoria,
      }
    } catch (e) {
      erro.value = mensagemDeErro(e, 'convidarUsuario')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Edita nome/CPF/nascimento/e-mail de um usuário já cadastrado (REQ-02/08).
   * Não mexe em perfil nem vínculo — isso continua no fluxo de vínculo
   * existente (`definirPerfilNoVinculo`, fora de escopo aqui).
   */
  async function atualizar(
    usuarioId: string, nome: string, cpf: string, dataNascimento: string, email: string,
  ): Promise<Usuario | null> {
    loading.value = true
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: ATUALIZAR_USUARIO,
        variables: { usuarioId, nome, cpf, email, dataNascimento: `${dataNascimento}T00:00:00.000Z` },
      })
      const salvo: Usuario = data.atualizarUsuario
      const idx = todosUsuarios.value.findIndex(u => u.id === salvo.id)
      if (idx >= 0) todosUsuarios.value[idx] = salvo
      else todosUsuarios.value.push(salvo)
      return salvo
    } catch (e) {
      erro.value = mensagemDeErro(e, 'atualizarUsuario')
      return null
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    todosUsuarios.value = []
    perfis.value = []
    erro.value = null
  }

  registrarResetDeSessao(reset)

  return { usuarios, perfis, loading, erro, fetchUsuarios, convidar, atualizar, reset }
})
