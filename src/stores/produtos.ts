import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Produto } from '@/types'
import { mockProdutos } from '@/mock/data'
import { mockQuery } from '@/graphql/client'
import { useEmpresaStore } from './empresa'

export const useProdutosStore = defineStore('produtos', () => {
  const empresaStore = useEmpresaStore()
  const todos = ref<Produto[]>([])
  const loading = ref(false)

  /** Produtos/serviços da empresa ativa (reativo à troca de empresa) */
  const produtos = computed(() =>
    todos.value.filter(p => p.empresaId === empresaStore.empresaAtivaId)
  )

  async function fetchProdutos() {
    loading.value = true
    const result = await mockQuery([...mockProdutos])
    todos.value = result.data
    loading.value = false
  }

  async function salvar(produto: Produto) {
    loading.value = true
    await mockQuery(null, 400)
    const idx = todos.value.findIndex(p => p.id === produto.id)
    if (idx >= 0) {
      todos.value[idx] = { ...produto }
    } else {
      todos.value.push({
        ...produto,
        id: `prod-${Date.now()}`,
        empresaId: empresaStore.empresaAtivaId,
        createdAt: new Date().toISOString(),
      })
    }
    loading.value = false
  }

  async function remover(id: string) {
    await mockQuery(null, 200)
    todos.value = todos.value.filter(p => p.id !== id)
  }

  function getProduto(id: string) {
    return todos.value.find(p => p.id === id)
  }

  return { produtos, loading, fetchProdutos, salvar, remover, getProduto }
})
