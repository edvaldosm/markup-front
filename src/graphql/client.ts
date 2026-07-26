/**
 * GraphQL client — estrutura pronta para Apollo Client.
 * Em produção: substituir MOCK_MODE por false e configurar GQL_ENDPOINT.
 */

export const MOCK_MODE = true
export const GQL_ENDPOINT = import.meta.env.VITE_GQL_ENDPOINT ?? 'http://localhost:8080/graphql'

// Quando MOCK_MODE = false, inicializar Apollo Client aqui:
// import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
// import { provideApolloClient } from '@vue/apollo-composable'
//
// const httpLink = createHttpLink({ uri: GQL_ENDPOINT })
// export const apolloClient = new ApolloClient({
//   link: httpLink,
//   cache: new InMemoryCache(),
// })

export type QueryResult<T> = Promise<{ data: T; loading: false; error: null }>

/** Simula latência de rede para dar realismo ao mock */
export async function mockQuery<T>(data: T, delayMs = 300): QueryResult<T> {
  await new Promise(r => setTimeout(r, delayMs))
  return { data, loading: false, error: null }
}
