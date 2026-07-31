import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Empresa } from '@/types'
import { mockEmpresas } from '@/mock/data'
import { mockQuery } from '@/graphql/client'
import { empresasAutorizadas, podeAcessarEmpresa } from '@/auth/autorizacao'
import { useAuthStore } from './auth'

export const useEmpresaStore = defineStore('empresa', () => {
  const auth = useAuthStore()

  /** Apenas as empresas autorizadas ao usuário logado — nunca a base inteira */
  const empresas = ref<Empresa[]>([])
  /** Id da empresa ativa; `''` = nenhuma (usuário sem empresa autorizada) */
  const empresaAtivaId = ref<string>('')
  const loading = ref(false)

  /** Empresa atualmente selecionada — todos os demais stores filtram por ela */
  const empresa = computed<Empresa | null>(
    () => empresas.value.find(e => e.id === empresaAtivaId.value) ?? null
  )

  /**
   * Equivale à query `minhasEmpresas` do backend: devolve só o conjunto
   * autorizado (próprias ∪ compartilhadas; ADMIN ⇒ todas).
   */
  async function fetchEmpresas() {
    loading.value = true
    const autorizadas = empresasAutorizadas(auth.user, mockEmpresas)
    const result = await mockQuery(autorizadas)
    empresas.value = result.data
    // a empresa ativa precisa continuar dentro do conjunto autorizado
    if (!empresas.value.some(e => e.id === empresaAtivaId.value)) {
      empresaAtivaId.value = empresas.value[0]?.id ?? ''
    }
    loading.value = false
  }

  /** Alias de compatibilidade — antigo carregamento mono-empresa */
  const fetchEmpresa = fetchEmpresas

  /**
   * Seleciona a empresa ativa. Ids fora do conjunto autorizado são ignorados
   * (R09: nunca confiar num `empresaId` vindo da UI). Retorna se foi aceita.
   */
  function selecionarEmpresa(id: string): boolean {
    if (!podeAcessarEmpresa(auth.user, id, empresas.value)) return false
    empresaAtivaId.value = id
    return true
  }

  async function salvarEmpresa(dados: Partial<Empresa>) {
    loading.value = true
    await mockQuery(null, 400)
    const emp = empresas.value.find(e => e.id === empresaAtivaId.value)
    if (emp) Object.assign(emp, dados)
    loading.value = false
  }

  /** Cria uma nova empresa — o usuário logado vira o **dono** (R09) — e a seleciona */
  async function criarEmpresa(
    dados: Omit<Empresa, 'id' | 'createdAt' | 'donoUsuarioId'>
  ): Promise<Empresa> {
    loading.value = true
    await mockQuery(null, 400)
    const nova: Empresa = {
      ...dados,
      id: `emp-${Date.now()}`,
      donoUsuarioId: auth.user?.id ?? '',
      createdAt: new Date().toISOString(),
    }
    // persiste no "banco" mock para sobreviver a um novo fetchEmpresas
    mockEmpresas.push(nova)
    empresas.value.push(nova)
    empresaAtivaId.value = nova.id
    loading.value = false
    return nova
  }

  /** Limpa o estado ao trocar de usuário (logout/login) */
  function reset() {
    empresas.value = []
    empresaAtivaId.value = ''
  }

  return {
    empresas, empresaAtivaId, empresa, loading,
    fetchEmpresas, fetchEmpresa, selecionarEmpresa, salvarEmpresa, criarEmpresa, reset,
  }
})
