import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Usuario, Perfil } from '@/types'
import { mockUsuarios, mockPerfis, perfilVendedor } from '@/mock/data'
import { mockQuery } from '@/graphql/client'
import { useEmpresaStore } from './empresa'
import { registrarResetDeSessao } from './reset'

export const useUsuariosStore = defineStore('usuarios', () => {
  const empresaStore = useEmpresaStore()
  const todosUsuarios = ref<Usuario[]>([])
  const perfis = ref<Perfil[]>([])
  const loading = ref(false)

  /** Usuários vinculados à empresa ativa (relação N:N usuário↔empresa) */
  const usuarios = computed(() =>
    todosUsuarios.value.filter(u => u.empresas.some(e => e.empresaId === empresaStore.empresaAtivaId))
  )

  async function fetchUsuarios() {
    loading.value = true
    const [u, p] = await Promise.all([
      mockQuery([...mockUsuarios]),
      mockQuery([...mockPerfis])
    ])
    todosUsuarios.value = u.data
    perfis.value = p.data
    loading.value = false
  }

  async function salvarUsuario(usuario: Usuario) {
    loading.value = true
    await mockQuery(null, 400)
    const idx = todosUsuarios.value.findIndex(u => u.id === usuario.id)
    if (idx >= 0) {
      todosUsuarios.value[idx] = { ...usuario }
    } else {
      const novo: Usuario = {
        ...usuario,
        id: `usr-${Date.now()}`,
        // nunca cair no ADMIN global como default: usuário novo entra no perfil mais restrito
        empresas: usuario.empresas.length
          ? usuario.empresas
          : [{ empresaId: empresaStore.empresaAtivaId, perfilId: perfilVendedor.id }],
      }
      todosUsuarios.value.push(novo)
    }
    loading.value = false
  }

  async function salvarPerfil(perfil: Perfil) {
    loading.value = true
    await mockQuery(null, 300)
    const idx = perfis.value.findIndex(p => p.id === perfil.id)
    if (idx >= 0) {
      perfis.value[idx] = { ...perfil }
    } else {
      perfis.value.push({ ...perfil, id: `perfil-${Date.now()}` })
    }
    loading.value = false
  }

  function reset(): void {
    todosUsuarios.value = []
    perfis.value = []
  }

  registrarResetDeSessao(reset)

  return { usuarios, perfis, loading, fetchUsuarios, salvarUsuario, salvarPerfil, reset }
})
