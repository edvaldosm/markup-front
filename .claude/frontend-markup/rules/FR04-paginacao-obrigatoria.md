# Rule FR04 — Listas usam paginação infinita

**Categoria:** UX / Padrão de tela
**Origem:** `src/composables/usePaginacao.ts`, `src/components/ui/InfiniteScrollSentinel.vue`, memória do projeto

## Regra

**Toda tela com tabela/lista** usa `usePaginacao(source, { pageSize: 10 })` +
o componente `InfiniteScrollSentinel`.

- Trigger duplo: `IntersectionObserver` (scroll automático) **e** botão manual
  "Carregar mais" (fallback/acessibilidade).
- Template ref no sentinel: `ref="sentinelaEl"` (Vue 3 auto-bind ao `.value`).
- A paginação reinicia sozinha quando a fonte muda (busca/filtro) — `watch(source)`.
- Já aplicado em `MateriaisView`, `DespesasFixasView`; aplicar em **toda nova
  tela com lista**.

## Por quê

Padrão único de carregamento em todas as telas, pronto para virar cursor
GraphQL (`first: pageSize, after: cursor`) sem reescrever a UI. Ver
[[paginacao-infinita]].
