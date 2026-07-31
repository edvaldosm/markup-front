---
name: paginacao-infinita
description: Padrão de paginação infinita do frontend Markup (usePaginacao + InfiniteScrollSentinel) obrigatório em telas com lista. Use ao criar qualquer tela com tabela/lista.
metadata:
  domain: frontend-markup
  kind: skill
  origin: src/composables/usePaginacao.ts, src/components/ui/InfiniteScrollSentinel.vue
---

# Paginação infinita

Obrigatório em toda tela com lista ([[FR04-paginacao-obrigatoria]]).

## `usePaginacao(source, options)`

```ts
const {
  itensVisiveis, temMais, carregandoMais, totalItens,
  sentinelaEl, carregarMais, resetar,
} = usePaginacao(produtosFiltrados, { pageSize: 10 })
```

- `source`: `Ref`/`ComputedRef` da lista completa (ex.: `computed` da store).
- `itensVisiveis` = `source.slice(0, pagina * pageSize)`.
- `IntersectionObserver` observa `sentinelaEl` (threshold 0.1) e chama
  `carregarMais`; `watch(source)` chama `resetar()` em busca/filtro.
- `mockDelay` (1200ms) simula latência — remover ao ligar GraphQL.

## Uso na tela

```vue
<script setup lang="ts">
const { itensVisiveis, temMais, carregandoMais, sentinelaEl, carregarMais } =
  usePaginacao(lista, { pageSize: 10 })
</script>

<template>
  <div v-for="item in itensVisiveis" :key="item.id"> … </div>
  <InfiniteScrollSentinel
    ref="sentinelaEl"
    :tem-mais="temMais"
    :carregando="carregandoMais"
    @carregar="carregarMais"
  />
</template>
```

Template ref `ref="sentinelaEl"` faz o auto-bind ao `.value` do composable
(Vue 3). Aplicado em `MateriaisView`, `DespesasFixasView`.

## Migração para GraphQL

Trocar o slice local por cursor: `useQuery(LIST, { first: pageSize, after: cursor })`
usando `PaginatedResult<T>` / `PageInfo` ([[modelo-de-dados-front]]).
