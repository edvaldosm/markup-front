# Rule R08 — Assistente: escopo restrito + guardrails

**Categoria:** IA / Segurança de conteúdo
**Origem:** Requisito do usuário (2026-07-31) — assistente RAG

## Regra

O assistente (RAG) **só responde sobre formação de preço** (Markup por Divisor,
impostos, despesas fixas, Fator R, preenchimento das telas do sistema). Tudo
mais é recusado com mensagem cordial de fora de escopo.

Toda pergunta passa, **no backend**, por dois guardrails **antes** de consultar o RAG:

1. **Filtro de escopo** — classificar se a pergunta é sobre formação de preço.
   Fora do tema → recusar sem chamar o LLM/vector store.
2. **Filtro de conteúdo ofensivo** — linguagem ofensiva/abusiva → recusar e
   registrar.

Demais invariantes:

- A resposta é **fundamentada no vault ingerido** (RAG); sem fonte relevante,
  responder que não sabe — **nunca alucinar**.
- O guardrail e o RAG ficam **no backend** (`AssistenteService`); o front só
  envia a pergunta e exibe a resposta ([[FR08-assistente-consome-backend]]).
- Respeitar o isolamento multi-empresa ([[R09-ownership-multiempresa]]) em
  qualquer dado de contexto do usuário passado ao prompt.

## Por quê

Impede uso indevido do assistente como chatbot genérico, controla custo/risco do
LLM e garante respostas ancoradas na fonte de verdade do domínio. Ver
[[assistente-rag-precificacao]].
