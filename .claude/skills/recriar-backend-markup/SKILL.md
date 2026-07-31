---
name: recriar-backend-markup
description: Recria do zero o backend Java 21 + Spring Boot 4 (Spring for GraphQL, JPA/PostgreSQL, Spring Security, Spring AI) do sistema Markup, a partir de .claude/backend-markup, respeitando as 9 Rules. Use quando o usuário pedir para gerar/scaffoldar apenas o backend.
---

# Recriar backend Markup (Java 21 + Spring Boot 4)

Gera o backend a partir de `.claude/backend-markup/`. Trabalhe em **pt-br**.

## Ler antes

`.claude/backend-markup/README.md`, `spec.md`, e todos os `rules/` e `skills/`.

## Invariantes (Rules — nunca violar)

R01 cálculo no backend · R02 isolamento por empresa autorizada · R03 divisor > 0 ·
R04 camadas domain/repository/service/controller · R05 RBAC em cada operação ·
R06 contrato-first (`.graphqls`) · R07 UI fora do backend · R08 assistente só
sobre preço + guardrails · R09 ownership + ADMIN global.

## Fases (cada uma guiada por uma Skill)

1. **Estrutura + deps** — `estrutura-projeto-spring`: projeto Maven, `pom.xml`,
   starters (web, graphql, data-jpa, security, validation, flyway, spring-ai anthropic + pgvector).
2. **Contrato** — `schema-graphql-markup`: `resources/graphql/schema.graphqls`
   (inclui `minhasEmpresas` e `perguntarAssistente`).
3. **Domínio JPA** — `modelagem-der-markup`: entidades `@Entity` (Empresa com `dono_usuario_id`).
4. **Persistência** — repositórios `JpaRepository` + `service/` com a regra.
5. **Precificação** — `service-precificacao-java` + `formula-markup-divisor`.
6. **Segurança** — `auth-jwt-spring` + `rbac-permissoes` (`@PreAuthorize`) + R02/R09 no service.
7. **Assistente RAG** — `assistente-rag-precificacao`: Spring AI + Claude + pgvector, ingestão do vault, guardrails.
8. **Seed** — `seed-dados-iniciais`: Flyway (schema + impostos, 16 permissões, 5 perfis, admin).

## Verificar

`./mvnw -q compile` (e `test` se houver). Rodar de fato exige **PostgreSQL com
pgvector** e `ANTHROPIC_API_KEY`. Confirmar destino/sobrescrita antes de escrever.
Reportar o resultado real do build.
