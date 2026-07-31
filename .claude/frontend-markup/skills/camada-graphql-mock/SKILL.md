---
name: camada-graphql-mock
description: Camada GraphQL do frontend Markup (client.ts, MOCK_MODE, mockQuery) e migração para Apollo Client. Use ao integrar o backend real ou mexer no acesso a dados.
metadata:
  domain: frontend-markup
  kind: skill
  origin: src/graphql/client.ts
---

# Camada GraphQL (mock → Apollo)

Todo acesso a dados passa por `src/graphql/client.ts` ([[FR06-camada-graphql-isolada]]).

## Estado atual (mock)

```ts
export const MOCK_MODE = true
export const GQL_ENDPOINT = import.meta.env.VITE_GQL_ENDPOINT ?? 'http://localhost:8080/graphql'

export async function mockQuery<T>(data: T, delayMs = 300): QueryResult<T> {
  await new Promise(r => setTimeout(r, delayMs))
  return { data, loading: false, error: null }
}
```

As stores consomem `mockQuery` com dados de `src/mock/data.ts`
([[store-pinia-dominio]]).

## Migração para backend real (`MOCK_MODE = false`)

```ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
import { provideApolloClient } from '@vue/apollo-composable'

const httpLink = createHttpLink({ uri: GQL_ENDPOINT })
export const apolloClient = new ApolloClient({ link: httpLink, cache: new InMemoryCache() })
```

Passos:
1. `MOCK_MODE = false` e inicializar `apolloClient` (header `Authorization: Bearer <token>`).
2. Nas stores, trocar `mockQuery(...)` por `useQuery`/`useMutation`.
3. **Remover o cálculo local** de `useMarkupCalculator` e consumir
   `precificarProduto` do backend (backend [[R01-calculo-no-backend]]).
4. Paginação vira cursor (`first/after`) — ver [[paginacao-infinita]].

Endpoint e contrato: backend [[schema-graphql-markup]].
