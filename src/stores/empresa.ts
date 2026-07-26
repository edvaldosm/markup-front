import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Empresa } from '@/types'
import { mockEmpresas } from '@/mock/data'
import { mockQuery } from '@/graphql/client'

export const useEmpresaStore = defineStore('empresa', () => {
  const empresas = ref<Empresa[]>([])
  const empresaAtivaId = ref<string>('emp-001')
  const loading = ref(false)

  /** Empresa atualmente selecionada — todos os demais stores filtram por ela */
  const empresa = computed<Empresa | null>(
    () => empresas.value.find(e => e.id === empresaAtivaId.value) ?? null
  )

  async function fetchEmpresas() {
    loading.value = true
    const result = await mockQuery([...mockEmpresas])
    empresas.value = result.data
    if (!empresas.value.some(e => e.id === empresaAtivaId.value) && empresas.value[0]) {
      empresaAtivaId.value = empresas.value[0].id
    }
    loading.value = false
  }

  /** Alias de compatibilidade — antigo carregamento mono-empresa */
  const fetchEmpresa = fetchEmpresas

  function selecionarEmpresa(id: string) {
    if (empresas.value.some(e => e.id === id)) {
      empresaAtivaId.value = id
    }
  }

  async function salvarEmpresa(dados: Partial<Empresa>) {
    loading.value = true
    await mockQuery(null, 400)
    const emp = empresas.value.find(e => e.id === empresaAtivaId.value)
    if (emp) Object.assign(emp, dados)
    loading.value = false
  }

  /** Cria uma nova empresa e a seleciona como ativa */
  async function criarEmpresa(dados: Omit<Empresa, 'id' | 'createdAt'>): Promise<Empresa> {
    loading.value = true
    await mockQuery(null, 400)
    const nova: Empresa = {
      ...dados,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    empresas.value.push(nova)
    empresaAtivaId.value = nova.id
    loading.value = false
    return nova
  }

  return {
    empresas, empresaAtivaId, empresa, loading,
    fetchEmpresas, fetchEmpresa, selecionarEmpresa, salvarEmpresa, criarEmpresa,
  }
})
