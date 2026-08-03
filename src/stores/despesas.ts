import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DespesaFixa } from '@/types'
import { mockDespesasFixas } from '@/mock/data'
import { mockQuery } from '@/graphql/client'
import { useEmpresaStore } from './empresa'
import { registrarResetDeSessao } from './reset'

export const useDespesasStore = defineStore('despesas', () => {
  const empresaStore = useEmpresaStore()
  const todos = ref<DespesaFixa[]>([])
  const loading = ref(false)

  /** Despesas da empresa ativa (reativo à troca de empresa) */
  const despesas = computed(() =>
    todos.value.filter(d => d.empresaId === empresaStore.empresaAtivaId)
  )

  const totalMensal = computed(() =>
    despesas.value.filter(d => d.ativa).reduce((acc, d) => acc + d.valorMensal, 0)
  )

  async function fetchDespesas() {
    loading.value = true
    const result = await mockQuery([...mockDespesasFixas])
    todos.value = result.data
    loading.value = false
  }

  async function salvar(despesa: DespesaFixa) {
    loading.value = true
    await mockQuery(null, 300)
    const idx = todos.value.findIndex(d => d.id === despesa.id)
    if (idx >= 0) {
      todos.value[idx] = { ...despesa }
    } else {
      todos.value.push({ ...despesa, id: `df-${Date.now()}`, empresaId: empresaStore.empresaAtivaId })
    }
    loading.value = false
  }

  async function remover(id: string) {
    await mockQuery(null, 200)
    todos.value = todos.value.filter(d => d.id !== id)
  }

  function reset(): void {
    todos.value = []
  }

  registrarResetDeSessao(reset)

  return { despesas, loading, totalMensal, fetchDespesas, salvar, remover, reset }
})
