import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Material } from '@/types'
import { mockMateriais } from '@/mock/data'
import { mockQuery } from '@/graphql/client'
import { useEmpresaStore } from './empresa'

export const useMateriaisStore = defineStore('materiais', () => {
  const empresaStore = useEmpresaStore()
  const todos = ref<Material[]>([])
  const loading = ref(false)

  /** Materiais/insumos da empresa ativa (reativo à troca de empresa) */
  const materiais = computed(() =>
    todos.value.filter(m => m.empresaId === empresaStore.empresaAtivaId)
  )

  async function fetchMateriais() {
    loading.value = true
    const result = await mockQuery([...mockMateriais])
    todos.value = result.data
    loading.value = false
  }

  async function salvar(material: Material) {
    loading.value = true
    await mockQuery(null, 300)
    const idx = todos.value.findIndex(m => m.id === material.id)
    if (idx >= 0) {
      todos.value[idx] = { ...material }
    } else {
      todos.value.push({ ...material, id: `mat-${Date.now()}`, empresaId: empresaStore.empresaAtivaId })
    }
    loading.value = false
  }

  async function remover(id: string) {
    await mockQuery(null, 200)
    todos.value = todos.value.filter(m => m.id !== id)
  }

  return { materiais, loading, fetchMateriais, salvar, remover }
})
