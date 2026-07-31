# Rule FR02 — Estado em Pinia setup stores por domínio

**Categoria:** Estado / Arquitetura
**Origem:** `src/stores/*.ts`

## Regra

Cada domínio tem sua **store Pinia no formato setup** (`defineStore('x', () => {…})`):
`auth`, `empresa`, `produtos`, `materiais`, `despesas`, `impostos`, `usuarios`.

- Listas filtradas pela **empresa ativa** via `computed` reativo:

  ```ts
  const produtos = computed(() =>
    todos.value.filter(p => p.empresaId === empresaStore.empresaAtivaId)
  )
  ```

- Ações (`fetch*`, `salvar`, `remover`) passam **sempre** pela camada
  `mockQuery`/GraphQL — nunca manipulam dados fora da store.
- A troca de empresa (`CompanySwitcher`) reflete automaticamente em todas as
  telas por reatividade.

## Por quê

Isola o estado por contexto de negócio, mantém o multi-empresa consistente e
evita duplicação de fonte de dados. Ver [[store-pinia-dominio]] e
[[camada-graphql-mock]].
