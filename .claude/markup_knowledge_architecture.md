---
name: markup-knowledge-architecture
description: "Arquitetura de conhecimento do projeto Markup — bases Rules+Skills (backend e frontend) e skills invocáveis de recriação"
metadata:
  node_type: memory
  type: reference
---

O conhecimento do sistema Markup está organizado em `.claude/` no padrão
**SDD (Spec-Driven Development)**: **Constituição** (princípios) → **spec** (o quê)
→ **skills/templates** (o como) → **implementação**, com skills invocáveis para
o loop incremental e para regeneração total.

## Padrão SDD (Constituição v2.1.0)

- `constitution.md` — princípios invioláveis (artigos B1–B9 backend, F1–F9 frontend = as Rules).
- `<base>/spec.md` — requisitos (o quê/por quê), separado das `skills/` (templates).
- `specs/` — loop por feature: `/specify` → `spec.md`, `/plan` → `plan.md`,
  `/tasks` → `tasks.md`; `specs/_template/` tem os modelos.
- Skills de workflow invocáveis: `specify`, `plan`, `tasks`.

## Bases de conhecimento (referência aninhada)

- `.claude/backend-markup/` — backend **Java 21 + Spring Boot 4** (Spring for GraphQL,
  JPA/PostgreSQL+pgvector, Spring Security, Spring AI). **9 Rules + 9 Skills**.
  (Migrado de Go em 2026-07-31.)
- `.claude/frontend-markup/` — frontend Vue 3/Pinia/Router/TS/Vite. **9 Rules + 10 Skills**.
  Destilado do código real em `src/**` + memória `project_markup_frontend.md`.

As Skills dessas duas pastas são **referência** (não disparam sozinhas).

## Features especificadas (specs/, aguardando implementação)

Ordem: **backend-java-spring → (multiempresa-ownership, assistente-rag)**.
- `specs/backend-java-spring/` — migração de stack Go→Java, preservando o contrato GraphQL.
- `specs/assistente-rag/` — assistente RAG (Spring AI + Claude + pgvector) com guardrails (só preço / anti-ofensivo).
- `specs/multiempresa-ownership/` — empresa tem dono; isolamento por dono; ADMIN global.

## Skills invocáveis (`.claude/skills/` — chamáveis por comando)

- `recriar-projeto-markup` — orquestrador: recria backend + frontend, garante o
  contrato (`VITE_GQL_ENDPOINT` ↔ `/graphql`, tipos ↔ schema) e verifica build.
- `recriar-backend-markup` — só o backend Java/Spring (8 fases guiadas pelas Skills).
- `recriar-frontend-markup` — só o frontend Vue (10 fases guiadas pelas Skills).

## Prompt reutilizável

`PromptFrontEnd/prompt-segmentar-rules-skills.md` — repetir a segmentação
Rules/Skills para outros documentos.

**Decisões (2026-07-31):** backend em **Java 21 + Spring Boot 4** mantendo **GraphQL**
(Spring for GraphQL); IA do assistente = **Spring AI + Claude + pgvector**;
multi-empresa = **dono + compartilhamento explícito + ADMIN global**. O backend será
gerado em **`backend/` dentro deste repo** (monorepo `markup-front/backend/`).

**How to apply:** para recriar/scaffoldar o projeto, invocar a skill
`recriar-projeto-markup` (ou a escopada). Para alterar regras/procedimentos,
editar a Rule/Skill correspondente na base — é a fonte de verdade, não os
arquivos de spec antigos.

**Why:** o usuário quer uma arquitetura "segundo cérebro" onde um comando recria
o projeto a partir do conhecimento segmentado, mantendo Rules como invariantes.

Fonte de verdade do domínio:
`d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`.
