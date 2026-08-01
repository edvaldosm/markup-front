# Plano técnico — Assistente RAG de precificação

- **Slug:** assistente-rag  •  **Baseado em:** spec.md  •  **Data:** 2026-07-31
- **Depende de:** `backend-java-spring`

## Abordagem

RAG com **Spring AI** (LLM **Anthropic Claude**) + **pgvector** no mesmo Postgres.
Guardrails em dois passos antes do RAG. Front com widget de chat.

## Camadas afetadas

- **Backend:** `service/AssistenteService`, `config/AiConfig`, ingestão do vault,
  controller GraphQL — template `assistente-rag-precificacao`.
- **Frontend:** `AssistenteWidget.vue` + `useAssistente.ts` — template `assistente-ui`.

## Mudanças de modelo / contrato

- **Schema:** `perguntarAssistente`, `RespostaAssistente`, enum `AssistenteStatus` (já no template do schema).
- **Vector store:** tabela pgvector (extensão `CREATE EXTENSION vector`) via Flyway.
- **Tipos do front:** adicionar `RespostaAssistente`/`AssistenteStatus`.

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-02 | classificador de escopo (regra + chamada barata ao LLM) antes do RAG |
| REQ-03 | moderação por lista + heurística; recusa antes de gastar RAG |
| REQ-04 | `similaritySearch topK=4`; se vazio ⇒ `SEM_FONTE`; system prompt anti-alucinação |
| REQ-05 | tudo no `AssistenteService`; front nunca chama LLM/vault (FR08) |

## Rules aplicáveis

R08 (escopo/guardrails), FR08 (front consome backend), R09 (isolamento no contexto).

## Riscos e alternativas

- Custo/latência do LLM → cachear classificação; recusar cedo.
- Ingestão do vault (local) → job/endpoint admin que lê os `.md` e indexa; **chave
  `ANTHROPIC_API_KEY` obrigatória** (env, nunca commit).

---
**Próximo passo:** `/tasks`
