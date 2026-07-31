---
name: estrutura-projeto-spring
description: Layout do backend Markup em Java 21 + Spring Boot 4 (Spring for GraphQL, Spring Data JPA, Spring Security, Spring AI). Use ao criar o projeto ou adicionar módulos.
metadata:
  domain: backend-markup
  kind: skill
  origin: Requisito 2026-07-31 (migração Go→Java/Spring)
---

# Estrutura de projeto (Java 21 + Spring Boot 4)

## Stack

- **Java 21** (LTS), **Spring Boot 4**, build **Maven** (ou Gradle)
- **Spring for GraphQL** (schema-first) — servido em `POST /graphql`
- **Spring Data JPA** + **PostgreSQL** (com extensão **pgvector**)
- **Spring Security** + JWT (`spring-boot-starter-oauth2-resource-server` ou `jjwt`)
- **Spring AI** (RAG: Anthropic Claude + vector store pgvector) — ver [[assistente-rag-precificacao]]
- **Flyway** para migrações e seed

### Dependências (starters principais)

```
spring-boot-starter-web
spring-boot-starter-graphql
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-validation
org.postgresql:postgresql
org.flywaydb:flyway-core
spring-ai-anthropic-spring-boot-starter
spring-ai-pgvector-store-spring-boot-starter
```

## Layout

```text
backend/
├── pom.xml
└── src/main/
    ├── java/com/markup/
    │   ├── MarkupApplication.java
    │   ├── config/            ← SecurityConfig, GraphQlConfig, AiConfig
    │   ├── domain/            ← entidades @Entity (1 por entidade)
    │   ├── repository/        ← interfaces JpaRepository
    │   ├── service/           ← regra de negócio (PrecificacaoService, AssistenteService, …)
    │   ├── graphql/           ← @Controller GraphQL (finos) + DTOs/records
    │   └── security/          ← filtro JWT, RBAC, contexto do usuário
    └── resources/
        ├── application.yml
        ├── graphql/schema.graphqls   ← contrato (fonte — R06)
        └── db/migration/             ← Flyway (schema + seed)
```

## Responsabilidade por camada

Ver [[R04-separacao-camadas]]: `domain` (entidades), `repository` (consultas),
`service` (regra), `graphql` (orquestração + RBAC). Contrato-first ([[R06-contrato-first-schema]]).

## Fluxo

1. Editar `resources/graphql/schema.graphqls` ([[schema-graphql-markup]]).
2. Criar/ajustar `@QueryMapping`/`@MutationMapping`/`@SchemaMapping` nos controllers.
3. `./mvnw spring-boot:run` (precisa de Postgres+pgvector; ver [[assistente-rag-precificacao]]).
