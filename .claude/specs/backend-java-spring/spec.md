# Spec — Backend em Java 21 + Spring Boot 4

> Governado por [../../constitution.md](../../constitution.md) v2.0.0.

- **Slug:** backend-java-spring
- **Status:** aprovada
- **Data:** 2026-07-31

## Problema / Objetivo

Construir o backend em **Java 21 + Spring Boot 4** (era Go), **preservando o
contrato GraphQL** para não impactar o frontend.

## Histórias de usuário

- Como time, quero o backend em Java/Spring para alinhar com nossa stack, sem
  reescrever o frontend.

## Requisitos

- **REQ-01 (MUST):** expor GraphQL em `POST /graphql` via Spring for GraphQL,
  com o mesmo contrato do schema atual (paridade de tipos/queries/mutations).
- **REQ-02 (MUST):** paridade funcional do baseline (`backend-markup/spec.md`
  RB-01..RB-08): precificação, CRUD, auth, RBAC, seed.
- **REQ-03 (MUST):** persistência em PostgreSQL via Spring Data JPA; migrações Flyway.
- **REQ-04 (MUST):** segurança JWT via Spring Security; permissões como authorities.
- **REQ-05 (SHOULD):** projeto em `backend/` (monorepo) — decisão registrada.

## Critérios de aceite

- [ ] `./mvnw compile` sem erros.
- [ ] Front atual funciona contra o novo backend sem mudança de tipos (Artigo III).
- [ ] `precificarProduto` devolve `ResultadoPrecificacao` idêntico em forma ao contrato.

## Fora de escopo

- Assistente RAG (spec `assistente-rag`) e ownership (spec `multiempresa-ownership`)
  — dependem deste, mas são specs próprias.
- Qualquer mudança na fórmula de precificação.

## Conformidade com a Constituição

- Artigos: B1–B7 (todos), Artigo III. Emenda: já aplicada (v2.0.0).

## Pontos a clarificar

- [ ] Build: Maven (assumido) ou Gradle?
