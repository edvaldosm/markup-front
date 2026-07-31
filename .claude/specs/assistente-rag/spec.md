# Spec — Assistente RAG de precificação

> Governado por [../../constitution.md](../../constitution.md) v2.0.0.

- **Slug:** assistente-rag
- **Status:** aprovada
- **Data:** 2026-07-31

## Problema / Objetivo

O usuário tem dúvidas ao preencher o sistema (materiais, impostos, margem, Fator R).
Um assistente deve esclarecer, **só sobre formação de preço**, ancorado no vault.

## Histórias de usuário

- Como usuário, quero perguntar "o que é margem de lucro líquido?" e receber uma
  resposta baseada na documentação, sem sair da tela.
- Como operador, quero que o assistente recuse perguntas fora do tema e ofensivas.

## Requisitos

- **REQ-01 (MUST):** `perguntarAssistente(pergunta): RespostaAssistente` no GraphQL.
- **REQ-02 (MUST):** guardrail de **escopo** — só formação de preço; fora ⇒ `FORA_DE_ESCOPO`.
- **REQ-03 (MUST):** guardrail de **conteúdo** — ofensivo ⇒ `RECUSADO`.
- **REQ-04 (MUST):** resposta **fundamentada no vault ingerido** (RAG); sem doc
  relevante ⇒ `SEM_FONTE`; **nunca alucinar**.
- **REQ-05 (MUST):** guardrails e RAG **no backend**; front só exibe.
- **REQ-06 (SHOULD):** retornar `fontes` (trechos/origem) junto da resposta.
- **REQ-07 (MUST):** widget de chat no front consumindo o backend.

## Critérios de aceite

- [ ] Pergunta de preço válida com doc ⇒ `OK` + texto + fontes.
- [ ] "Qual a capital da França?" ⇒ `FORA_DE_ESCOPO`.
- [ ] Pergunta ofensiva ⇒ `RECUSADO`.
- [ ] Pergunta de preço sem doc na base ⇒ `SEM_FONTE` (sem inventar).

## Fora de escopo

- Voz/áudio; histórico persistente entre sessões (só em memória por enquanto).

## Conformidade com a Constituição

- Artigos: **B8**, **F8**, B2/B9 (contexto do usuário respeita isolamento).
- Emenda: já aplicada (v2.0.0).

## Pontos a clarificar

- [ ] Idioma das respostas: pt-br fixo? (assumido sim)
- [ ] O que ingerir do vault além de `markup/wiki/`?
