import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Imposto } from '@/types'
import { mockImpostos } from '@/mock/data'
import { mockQuery } from '@/graphql/client'

export const useImpostosStore = defineStore('impostos', () => {
  const impostos = ref<Imposto[]>([])
  const loading = ref(false)

  async function fetchImpostos() {
    loading.value = true
    const result = await mockQuery([...mockImpostos])
    impostos.value = result.data
    loading.value = false
  }

  async function salvar(imposto: Imposto) {
    loading.value = true
    await mockQuery(null, 300)
    const idx = impostos.value.findIndex(i => i.id === imposto.id)
    if (idx >= 0) {
      impostos.value[idx] = { ...imposto }
    } else {
      impostos.value.push({ ...imposto, id: `imp-${Date.now()}` })
    }
    loading.value = false
  }

  return { impostos, loading, fetchImpostos, salvar }
})
