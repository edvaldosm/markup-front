# Tarefas — Assistente RAG de precificação

- **Slug:** assistente-rag  •  **Baseado em:** plan.md  •  **Data:** 2026-07-31

## Backend

- [ ] **T-B1** (REQ-04) — Flyway: `CREATE EXTENSION vector` + tabela do vector store
- [ ] **T-B2** (REQ-04) — `AiConfig`: `ChatClient` (Claude) + `VectorStore` (pgvector) · dep: T-B1
- [ ] **T-B3** (REQ-04) — job/endpoint de **ingestão do vault** (ler `.md`, split, embed, salvar)
- [ ] **T-B4** (REQ-02) — guardrail de escopo (só formação de preço)
- [ ] **T-B5** (REQ-03) — guardrail de conteúdo ofensivo
- [ ] **T-B6** (REQ-01/04/06) — `AssistenteService.perguntar` (guardrails → RAG → resposta+fontes) · skill: `assistente-rag-precificacao`
- [ ] **T-B7** (REQ-01) — schema `perguntarAssistente` + controller GraphQL

## Frontend

- [ ] **T-F1** (REQ-07) — `AssistenteWidget.vue` (botão flutuante + painel) · skill: `assistente-ui`
- [ ] **T-F2** (REQ-07) — `useAssistente.ts` + `perguntarAssistenteGql` (mock e real)
- [ ] **T-F3** (REQ-07) — tratar status OK/FORA_DE_ESCOPO/RECUSADO/SEM_FONTE na UI

## Verificação

- [ ] 4 cenários de aceite do `spec.md` (OK, fora de escopo, ofensivo, sem fonte)
- [ ] Front exibe corretamente cada status

---
**Próximo passo:** implementar (requer `ANTHROPIC_API_KEY` + pgvector).
