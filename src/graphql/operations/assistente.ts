/**
 * Assistente RAG — `perguntarAssistente` é uma **query**, mas se comporta
 * como um comando do ponto de vista do cliente (gasta um turno de RAG/LLM e
 * atualiza a conversa no servidor via `threadId`). Por isso `fetchPolicy:
 * 'network-only'` sempre que chamada (ver `composables/useAssistente.ts`) —
 * o `InMemoryCache` do Apollo cachearia por variável e devolveria uma
 * resposta antiga para a mesma pergunta repetida na mesma conversa.
 */
import { gql } from '@apollo/client/core'

export const PERGUNTAR_ASSISTENTE = gql`
  query PerguntarAssistente($pergunta: String!, $empresaId: ID, $threadId: ID) {
    perguntarAssistente(pergunta: $pergunta, empresaId: $empresaId, threadId: $threadId) {
      status
      texto
      origem
      fontes {
        documento
        trecho
      }
      threadId
    }
  }
`
