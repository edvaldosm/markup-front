import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AuthUser } from '@/types'
import { mockUsuarios, mockPerfis, mockEmpresa } from '@/mock/data'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)

  function login(email: string, _password: string): Promise<boolean> {
    loading.value = true
    return new Promise(resolve => {
      setTimeout(() => {
        const found = mockUsuarios.find(u => u.email === email && u.ativo)
        if (found) {
          const perfil = found.empresas[0]?.perfil ?? mockPerfis[0]
          user.value = {
            id: found.id,
            nome: found.nome,
            email: found.email,
            perfil,
            empresa: mockEmpresa
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

  function hasPermissao(chave: string): boolean {
    return user.value?.perfil.permissoes.some(p => p.chave === chave) ?? false
  }

  return { user, loading, login, logout, hasPermissao }
})
