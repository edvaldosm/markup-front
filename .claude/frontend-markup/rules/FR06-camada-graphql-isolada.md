# Rule FR06 — Camada GraphQL isolada e cálculo migra para o backend

**Categoria:** Integração / Fronteira
**Origem:** `src/graphql/client.ts`, `src/composables/useMarkup.ts`

## Regra

Todo acesso a dados passa pela camada `src/graphql/` (`client.ts`), controlada
pela flag `MOCK_MODE`:

- **`MOCK_MODE = true` (protótipo):** dados vêm de `src/mock/data.ts` via
  `mockQuery`; o cálculo de precificação roda localmente em
  `useMarkupCalculator`.
- **`MOCK_MODE = false` (produção):** inicializar Apollo Client apontando para
  `GQL_ENDPOINT` (`VITE_GQL_ENDPOINT`, default `http://localhost:8080/graphql`).
  **Ao ligar o backend real, o cálculo de precificação sai do front** e passa a
  consumir a query `precificarProduto` — ver backend [[R01-calculo-no-backend]].

## Por quê

Mantém o protótipo navegável sem backend e deixa a troca para GraphQL real numa
única flag, sem espalhar `fetch` pelas telas. Ver [[camada-graphql-mock]].
