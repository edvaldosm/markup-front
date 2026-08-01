---
name: assistente-rag-precificacao
description: Assistente RAG do backend Markup (Spring AI + Claude + pgvector) que responde só sobre formação de preço, com guardrails de escopo e conteúdo. Use ao implementar o AssistenteService, a ingestão do vault ou a query perguntarAssistente.
metadata:
  domain: backend-markup
  kind: skill
  origin: Requisito 2026-07-31 (assistente + RAG + guardrails)
---

# Assistente RAG de precificação (Spring AI)

Responde dúvidas do usuário sobre **formação de preço** e preenchimento das telas,
fundamentado no **vault ingerido**. Guardrails obrigatórios ([[R08-assistente-escopo-guardrails]]).

## Stack

- **Spring AI** (orquestração), **Anthropic Claude** (LLM), **pgvector** (vector store).
- `spring-ai-anthropic-spring-boot-starter` + `spring-ai-pgvector-store-spring-boot-starter`.
- Chave `ANTHROPIC_API_KEY` via env; nunca commitada.

## Ingestão do vault (offline / job)

O vault (`d:\ObsidianDocumentos\Conhecimento`) é **markdown local** — precisa ser
ingerido, não lido em runtime:

1. Ler os `.md` relevantes (foco: `cálculos/financeiras/markup/wiki/`).
2. Dividir em chunks (`TokenTextSplitter`), gerar embeddings, gravar no
   `VectorStore` (pgvector). Rodar via `CommandLineRunner`/endpoint admin.

## Fluxo de resposta (`service/AssistenteService.java`)

```java
public RespostaAssistente perguntar(String pergunta, UsuarioContexto ctx) {
    // Guardrail 1 — conteúdo ofensivo (R08)
    if (moderacao.ehOfensivo(pergunta))
        return RespostaAssistente.recusa("Não posso responder a isso.");

    // Guardrail 2 — escopo: só formação de preço (R08)
    if (!classificador.ehSobrePrecificacao(pergunta))
        return RespostaAssistente.foraDeEscopo(
            "Só ajudo com formação de preço e preenchimento do sistema.");

    // RAG — recupera do vault ingerido e responde ancorado
    List<Document> docs = vectorStore.similaritySearch(
        SearchRequest.query(pergunta).withTopK(4));
    if (docs.isEmpty())
        return RespostaAssistente.semфонte("Não encontrei isso na base.");

    String contexto = docs.stream().map(Document::getContent).collect(joining("\n---\n"));
    String resposta = chatClient.prompt()
        .system(PROMPT_SISTEMA)          // "responda só sobre precificação, use o contexto, não invente"
        .user(u -> u.text("Contexto:\n{ctx}\n\nPergunta: {q}")
                    .param("ctx", contexto).param("q", pergunta))
        .call().content();

    return RespostaAssistente.ok(resposta, fontes(docs));
}
```

- Os guardrails podem ser implementados com regras/lista + uma chamada de
  classificação barata ao próprio LLM; recusar **antes** de gastar o RAG quando possível.
- Nunca alucinar: sem documento relevante → dizer que não sabe.
- Respeitar isolamento ao usar dados do usuário no prompt ([[R09-ownership-multiempresa]]).

## Contrato GraphQL

```graphql
type RespostaAssistente { status: AssistenteStatus!  texto: String!  fontes: [String!]! }
enum AssistenteStatus { OK  FORA_DE_ESCOPO  RECUSADO  SEM_FONTE }
extend type Query { perguntarAssistente(pergunta: String!): RespostaAssistente! }
```

Front consome isso e só exibe ([[assistente-ui]], [[FR08-assistente-consome-backend]]).
