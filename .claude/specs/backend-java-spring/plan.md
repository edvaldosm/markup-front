# Plano técnico — Backend em Java 21 + Spring Boot 4

- **Slug:** backend-java-spring  •  **Baseado em:** spec.md  •  **Data:** 2026-07-31

## Abordagem

Scaffold Spring Boot 4 em `backend/`, schema-first, portando entidades e regra do
baseline. Reusar os templates de `backend-markup/skills/`.

## Camadas afetadas

- **Backend (novo):** `config/ domain/ repository/ service/ graphql/ security/` —
  templates: `estrutura-projeto-spring`, `modelagem-der-markup`,
  `service-precificacao-java`, `auth-jwt-spring`, `rbac-permissoes`, `seed-dados-iniciais`.
- **Frontend:** nenhuma mudança de código; só apontar `VITE_GQL_ENDPOINT` (já default).

## Mudanças de modelo / contrato

- **Schema GraphQL:** copiar o contrato de `schema-graphql-markup` para
  `resources/graphql/schema.graphqls` (sem `dono`/assistente ainda — vêm das outras specs).
- **Tipos do front:** inalterados.
- **Migração de dados:** Flyway `V1__schema.sql`.

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-01 | Spring for GraphQL, `@QueryMapping`/`@MutationMapping`/`@SchemaMapping` |
| REQ-03 | JPA + Flyway; UUID como PK |
| REQ-04 | `JwtAuthFilter` + `@EnableMethodSecurity` |

## Rules aplicáveis

R01–R07 (todas do baseline). R08/R09 ficam para as specs seguintes.

## Riscos e alternativas

- Divergência de contrato front↔back → mitigar validando o schema contra `src/types`.
- Spring Boot 4 recente → fixar versões no `pom.xml`.

---
**Próximo passo:** `/tasks`
