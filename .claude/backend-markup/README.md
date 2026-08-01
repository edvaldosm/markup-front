# Backend Markup — Base de conhecimento segmentada

Rules (invariantes) e Skills (templates) do backend **Java 21 + Spring Boot 4**
(GraphQL via Spring for GraphQL, JPA/PostgreSQL, Spring Security, Spring AI).

- **Requisitos (SDD):** [spec.md](spec.md) — o *quê/por quê*. Os arquivos de `skills/` são os *templates* (o *como*).
- **Princípios:** [../constitution.md](../constitution.md) — as `rules/` são os artigos (v2.4.0).
- **Fonte original:** `IniciandoBackEndMarkup.md` (prompt consolidado, backend Go — **arquivado no git**; migrado para Java nesta base).
- **Fonte de verdade do domínio:** `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`
- **Atualizado em:** 2026-07-31 (v2 — Java/Spring + assistente RAG + ownership)

## Rules — o que sempre/nunca fazer

| Arquivo | Regra |
|---------|-------|
| [R01](rules/R01-calculo-no-backend.md) | Todo cálculo de precificação vive no backend; o front só exibe |
| [R02](rules/R02-isolamento-multiempresa.md) | Consultas restritas às empresas autorizadas ao usuário do JWT |
| [R03](rules/R03-divisor-markup-positivo.md) | `divisorMarkup <= 0` → erro; nunca preço ≤ 0 |
| [R04](rules/R04-separacao-camadas.md) | domain / repository / service / controller GraphQL separados |
| [R05](rules/R05-autorizacao-rbac.md) | Autorização RBAC em cada operação (Spring Security) |
| [R06](rules/R06-contrato-first-schema.md) | Contrato-first: o `.graphqls` é a fonte; o código segue o schema |
| [R07](rules/R07-fora-do-backend.md) | Formatação, ordenação de UI e estado de tela ficam no front |
| [R08](rules/R08-assistente-escopo-guardrails.md) | Assistente responde só sobre preço; recusa ofensivo/fora de escopo |
| [R09](rules/R09-ownership-multiempresa.md) | Empresa tem dono; usuário só vê as próprias/compartilhadas; ADMIN global |
| [R10](rules/R10-fator-r-anexo-simples.md) | Fator R deriva o anexo do Simples (serviços): ≥28% ⇒ III, senão V |
| [R11](rules/R11-guardas-de-calculo.md) | Guardas de divisão e validação de entrada; falhar alto, nunca em silêncio |
| [R12](rules/R12-relatorios-no-backend.md) | Relatório é do backend, em módulo próprio, via JasperReports |

## Skills — como fazer (templates)

| Skill | Descrição |
|-------|-----------|
| [formula-markup-divisor](skills/formula-markup-divisor/SKILL.md) | A fórmula do Markup por Divisor e seus componentes |
| [service-precificacao-java](skills/service-precificacao-java/SKILL.md) | `PrecificacaoService` + controller GraphQL (Java/Spring) |
| [schema-graphql-markup](skills/schema-graphql-markup/SKILL.md) | Schema GraphQL: tipos, enums, queries, mutations, inputs |
| [modelagem-der-markup](skills/modelagem-der-markup/SKILL.md) | Modelagem de dados (DER v3 — RBAC + ownership) em JPA |
| [auth-jwt-spring](skills/auth-jwt-spring/SKILL.md) | Autenticação JWT com Spring Security + claims |
| [rbac-permissoes](skills/rbac-permissoes/SKILL.md) | Permissões granulares, perfis e proteção com `@PreAuthorize` |
| [estrutura-projeto-spring](skills/estrutura-projeto-spring/SKILL.md) | Layout Java/Spring Boot e fluxo contrato-first |
| [seed-dados-iniciais](skills/seed-dados-iniciais/SKILL.md) | Seed via Flyway: impostos, permissões, perfis, admin |
| [assistente-rag-precificacao](skills/assistente-rag-precificacao/SKILL.md) | Assistente RAG (Spring AI + Claude + pgvector) com guardrails |
| [catalogo-calculos-validacoes](skills/catalogo-calculos-validacoes/SKILL.md) | **Catálogo autoritativo**: todos os cálculos (C1–C12) e guardas (V1–V9) |
| [modulo-relatorios-jasper](skills/modulo-relatorios-jasper/SKILL.md) | Módulo exclusivo de relatórios: JasperReports, catálogo, download autenticado |
