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

## Padrão SDD (Constituição v2.4.0)

- `constitution.md` — princípios invioláveis (artigos B1–B11 backend, F1–F9 frontend = as Rules).
- `<base>/spec.md` — requisitos (o quê/por quê), separado das `skills/` (templates).
- `specs/` — loop por feature: `/specify` → `spec.md`, `/plan` → `plan.md`,
  `/tasks` → `tasks.md`; `specs/_template/` tem os modelos.
- Skills de workflow invocáveis: `specify`, `plan`, `tasks`.

## Bases de conhecimento (referência aninhada)

- `.claude/frontend-markup/` — frontend Vue 3/Pinia/Router/TS/Vite. **11 Rules + 11 Skills**.
  Destilado do código real em `src/**` + memória `project_markup_frontend.md`.
- **Backend:** vive no repositório próprio **`D:\Projetos\JAVA\markup-back`**
  (Java 21 + Spring Boot 4). A base `backend-markup/` (12 Rules + 11 Skills), os
  specs de backend e a skill `recriar-backend-markup` moram lá — foram removidos
  deste repo em 2026-08-03 para não haver duas cópias divergindo.

As Skills dessa pasta são **referência** (não disparam sozinhas).

## Contrato entre os dois repos

O `schema.graphqls` do markup-back é a **fonte de verdade** do contrato (B6). O
front espelha os tipos e aponta `VITE_GQL_ENDPOINT` para `/graphql`.

## Skills invocáveis (`.claude/skills/` — chamáveis por comando)

- `recriar-frontend-markup` — recria o frontend Vue (10 fases guiadas pelas Skills).

## Prompt reutilizável

`PromptFrontEnd/prompt-segmentar-rules-skills.md` — repetir a segmentação
Rules/Skills para outros documentos.

**Decisões (2026-07-31):** backend em **Java 21 + Spring Boot 4** mantendo **GraphQL**
(Spring for GraphQL); IA do assistente = **Spring AI + Claude + pgvector**;
multi-empresa = **dono + compartilhamento explícito + ADMIN global**.
**Revisto em 2026-08-03:** o backend não é monorepo — é repositório separado
(`markup-back`), já implementado e com o GraphQL no ar.

**How to apply:** para recriar/scaffoldar o frontend, invocar a skill
`recriar-frontend-markup`. Para alterar regras/procedimentos,
editar a Rule/Skill correspondente na base — é a fonte de verdade, não os
arquivos de spec antigos.

**Why:** o usuário quer uma arquitetura "segundo cérebro" onde um comando recria
o projeto a partir do conhecimento segmentado, mantendo Rules como invariantes.

Fonte de verdade do domínio:
`d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`.
