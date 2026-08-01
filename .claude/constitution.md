# Constituição — Projeto Markup

> Documento de princípios do sistema de precificação **Markup por Divisor**.
> São **invariantes**: toda spec, plano, tarefa e código gerado deve obedecê-los.
> Em conflito, a Constituição prevalece sobre qualquer spec ou preferência de
> implementação.

- **Idioma de trabalho:** pt-br.
- **Fonte de verdade do domínio:** `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md` (consultar o "segundo cérebro" antes da web).
- **Versão:** 2.1.0 — 2026-08-01

### Histórico
- **2.1.0** — Novo artigo **F9**: toda regra de visibilidade/permissão precisa de teste de aceite navegando como cada perfil. Emenda motivada pela implementação da B9 no front.
- **2.0.0** — Backend migra de Go/gqlgen para **Java 21 + Spring Boot 4** (GraphQL via Spring for GraphQL). Novos artigos: **B8** (assistente/RAG), **B9** (ownership multi-empresa), **F8** (assistente no front).
- **1.0.0** — Versão inicial (backend Go).

---

## Artigo I — Princípios de Backend

Stack: **Java 21 + Spring Boot 4**, **Spring for GraphQL** (schema-first),
**Spring Data JPA** + PostgreSQL, **Spring Security** (JWT), **Spring AI** (RAG).
Detalhe de cada princípio em `.claude/backend-markup/rules/`.

- **B1.** Todo cálculo de precificação vive no backend; o front só exibe. → [R01](backend-markup/rules/R01-calculo-no-backend.md)
- **B2.** Toda consulta filtra por empresa autorizada ao usuário do JWT (multi-tenant). → [R02](backend-markup/rules/R02-isolamento-multiempresa.md)
- **B3.** `divisorMarkup <= 0` retorna erro; nunca preço ≤ 0. → [R03](backend-markup/rules/R03-divisor-markup-positivo.md)
- **B4.** Camadas separadas: domain (entidades JPA), repository, service (regra), controller GraphQL (orquestração). → [R04](backend-markup/rules/R04-separacao-camadas.md)
- **B5.** Autorização RBAC verificada em cada operação (Spring Security). → [R05](backend-markup/rules/R05-autorizacao-rbac.md)
- **B6.** Contrato-first: o `.graphqls` é a fonte de verdade do contrato; o código segue o schema. → [R06](backend-markup/rules/R06-contrato-first-schema.md)
- **B7.** Formatação, ordenação de UI e estado de tela não vão para o backend. → [R07](backend-markup/rules/R07-fora-do-backend.md)
- **B8.** O assistente/RAG responde **apenas** sobre formação de preço; recusa conteúdo ofensivo ou fora de escopo; a fonte é o vault **ingerido** num vector store. → [R08](backend-markup/rules/R08-assistente-escopo-guardrails.md)
- **B9.** Toda empresa tem um **dono** (quem a cadastrou); usuário só enxerga empresas próprias ou explicitamente compartilhadas; **ADMIN tem visão global**. → [R09](backend-markup/rules/R09-ownership-multiempresa.md)

## Artigo II — Princípios de Frontend

Stack: **Vue 3 + Pinia + Vue Router + TypeScript + Vite**, Apollo Client.
Detalhe em `.claude/frontend-markup/rules/`.

- **F1.** Componentes em `<script setup lang="ts">` + Composition API. → [FR01](frontend-markup/rules/FR01-composition-api-ts.md)
- **F2.** Estado em Pinia setup stores por domínio, reativo à empresa ativa. → [FR02](frontend-markup/rules/FR02-stores-por-dominio.md)
- **F3.** Cores/espaços via variáveis CSS (`main.css`); nunca hardcode. → [FR03](frontend-markup/rules/FR03-design-tokens.md)
- **F4.** Toda tela com lista usa `usePaginacao` + `InfiniteScrollSentinel`. → [FR04](frontend-markup/rules/FR04-paginacao-obrigatoria.md)
- **F5.** Moeda/percentual só via `useCurrency` (Intl pt-BR). → [FR05](frontend-markup/rules/FR05-formatacao-intl.md)
- **F6.** GraphQL isolado (`MOCK_MODE`); ao ligar o backend, o cálculo sai do front. → [FR06](frontend-markup/rules/FR06-camada-graphql-isolada.md)
- **F7.** Rotas com guard de auth + lazy load de componentes. → [FR07](frontend-markup/rules/FR07-rotas-protegidas.md)
- **F8.** O assistente consome **o backend**, nunca o vault direto; não renderiza conteúdo fora de formação de preço. → [FR08](frontend-markup/rules/FR08-assistente-consome-backend.md)
- **F9.** Toda regra de **visibilidade ou permissão** tem teste de aceite que **navega como cada perfil** e prova o que ele vê e o que lhe é negado. → [FR09](frontend-markup/rules/FR09-teste-navegacao-por-perfil.md)

## Artigo III — Fronteira Backend ↔ Frontend

- O backend devolve **números crus**; o frontend **formata e apresenta** (B7 + F5).
- Contrato único: schema GraphQL do backend (servido por Spring for GraphQL)
  espelhado pelos tipos do front; endpoint via `VITE_GQL_ENDPOINT`.
- O assistente conversa via GraphQL (`perguntarAssistente`), com o guardrail e o
  RAG **no backend** (B8) — o front só exibe (F8).

## Artigo IV — Governança (Spec-Driven Development)

1. **Fluxo de mudança:** `/specify` → `/plan` → `/tasks` → implementar. Nenhuma
   feature entra em código sem passar por uma spec em `.claude/specs/<slug>/`.
2. **Precedência:** Constituição > spec da feature > plano > preferência de código.
3. **Conformidade:** todo `spec.md`, `plan.md` e `tasks.md` declara quais artigos
   aplica; nada pode propor algo que viole um artigo sem uma emenda explícita aqui.
4. **Emenda:** alterar um princípio = editar a Rule correspondente **e** subir a
   versão desta Constituição (semver: breaking = major).
5. **Regeneração total:** as skills `recriar-*` produzem o projeto do zero a
   partir das bases, sempre respeitando estes artigos.
