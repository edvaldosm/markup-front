import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser, PermissaoChave } from '@/types'
import { mockUsuarios, perfilDaSessao } from '@/mock/data'
import { isAdminGlobal, temPermissao } from '@/auth/autorizacao'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)

  /** ADMIN global (R09): enxerga e opera todas as empresas */
  const adminGlobal = computed(() => isAdminGlobal(user.value))

  function login(email: string, _password: string): Promise<boolean> {
    loading.value = true
    return new Promise(resolve => {
      setTimeout(() => {
        const found = mockUsuarios.find(u => u.email === email && u.ativo)
        if (found) {
          user.value = {
            id: found.id,
            nome: found.nome,
            email: found.email,
            perfil: perfilDaSessao(found),
            vinculos: found.empresas,
          }
          loading.value = false
          resolve(true)
        } else {
          loading.value = false
          resolve(false)
        }
      }, 600)
    })
  }

  function logout() {
    user.value = null
  }

  function hasPermissao(chave: PermissaoChave): boolean {
    return temPermissao(user.value, chave)
  }

  return { user, loading, adminGlobal, login, logout, hasPermissao }
})
