# Rule FR08 — Assistente consome o backend, nunca o vault

**Categoria:** IA / Fronteira
**Origem:** Requisito do usuário (2026-07-31)

## Regra

O assistente da UI apenas **envia a pergunta** ao backend (`perguntarAssistente`)
e **exibe a resposta**. Nunca:

- acessa o vault/`d:\ObsidianDocumentos` direto,
- chama um LLM ou vector store do lado do cliente,
- renderiza conteúdo classificado como fora de escopo ou recusado — nesses casos
  mostra a mensagem devolvida pelo backend (`FORA_DE_ESCOPO`/`RECUSADO`/`SEM_FONTE`).

O guardrail (escopo + ofensivo) e o RAG vivem **no backend** (Artigo B8).

## Por quê

Centraliza o controle de escopo, custo e segurança no servidor; o cliente não é
confiável para aplicar guardrails nem para guardar chaves de LLM. Ver
[[assistente-ui]] e backend [[assistente-rag-precificacao]].
