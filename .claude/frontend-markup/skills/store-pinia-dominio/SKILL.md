---
name: store-pinia-dominio
description: Padrão de setup store Pinia por domínio no frontend Markup, filtrando pela empresa ativa e passando por mockQuery. Use ao criar ou alterar stores.
metadata:
  domain: frontend-markup
  kind: skill
  origin: src/stores/produtos.ts (padrão), src/stores/*.ts
---

# Store Pinia por domínio

Padrão obrigatório ([[FR02-stores-por-dominio]]): **setup store**, lista bruta em
`todos`, `computed` filtrando pela empresa ativa, ações via `mockQuery`.

## Modelo de referência (`src/stores/produtos.ts`)

```ts
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

  // reativo à troca de empresa (CompanySwitcher)
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
    if (idx >= 0) todos.value[idx] = { ...produto }
    else todos.value.push({ ...produto, id: `prod-${Date.now()}`,
      empresaId: empresaStore.empresaAtivaId, createdAt: new Date().toISOString() })
    loading.value = false
  }

  async function remover(id: string) {
    await mockQuery(null, 200)
    todos.value = todos.value.filter(p => p.id !== id)
  }

  function getProduto(id: string) { return todos.value.find(p => p.id === id) }

  return { produtos, loading, fetchProdutos, salvar, remover, getProduto }
})
```

## Stores existentes

`auth`, `empresa`, `produtos`, `materiais`, `despesas`, `impostos`, `usuarios`,
`admin`. Ao ligar o backend, `mockQuery(...)` vira `useQuery`/`useMutation`
([[camada-graphql-mock]]).

### A exceção: `admin`

`stores/admin.ts` é a **única** store que não filtra por empresa ativa — o gestor
do site precisa da base inteira. O preço dessa exceção é o guard: `fetchTudo()` e
**toda** ação começam checando `podeAcessarModuloAdmin(auth.user)`; para quem não
é ADMIN a store é conjunto vazio. Ver [[modulo-gestao-site]].
