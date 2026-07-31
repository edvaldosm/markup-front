# Tarefas — Backend em Java 21 + Spring Boot 4

- **Slug:** backend-java-spring  •  **Baseado em:** plan.md  •  **Data:** 2026-07-31

## Backend

- [ ] **T-B1** (REQ-01) — scaffold Spring Boot 4 em `backend/` (`pom.xml`, `MarkupApplication`) · skill: `estrutura-projeto-spring`
- [ ] **T-B2** (REQ-03) — `application.yml` + datasource Postgres + Flyway
- [ ] **T-B3** (REQ-01) — `resources/graphql/schema.graphqls` (contrato baseline) · skill: `schema-graphql-markup`
- [ ] **T-B4** (REQ-03) — entidades `@Entity` + repositórios · dep: T-B1 · skill: `modelagem-der-markup`
- [ ] **T-B5** (REQ-02) — services CRUD (empresa, despesa, material, imposto, produto, perfil, usuario)
- [ ] **T-B6** (REQ-02) — `PrecificacaoService` + controller · skill: `service-precificacao-java`
- [ ] **T-B7** (REQ-04) — `SecurityConfig` + `JwtAuthFilter` + login · skill: `auth-jwt-spring`
- [ ] **T-B8** (REQ-04) — `@PreAuthorize` nos controllers · skill: `rbac-permissoes`
- [ ] **T-B9** (REQ-02) — seed Flyway (`V2__seed.sql`) · skill: `seed-dados-iniciais`

## Verificação

- [ ] `./mvnw compile`
- [ ] Front atual sobe contra o backend e lista/precifica sem erro
- [ ] Critérios de aceite do `spec.md`

---
**Próximo passo:** implementar (ou `recriar-backend-markup`).
