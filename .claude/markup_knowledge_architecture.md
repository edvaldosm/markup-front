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

## Padrão SDD

- `constitution.md` — princípios invioláveis (artigos B1–B7 e F1–F7 = as Rules).
- `<base>/spec.md` — requisitos (o quê/por quê), separado das `skills/` (templates).
- `specs/` — loop por feature: `/specify` → `spec.md`, `/plan` → `plan.md`,
  `/tasks` → `tasks.md`; `specs/_template/` tem os modelos.
- Skills de workflow invocáveis: `specify`, `plan`, `tasks`.

## Bases de conhecimento (referência aninhada)

- `.claude/backend-markup/` — backend Go/Gin/gqlgen/GORM/PostgreSQL. 7 Rules + 8 Skills.
  README indexa tudo. Destilado do prompt `IniciandoBackEndMarkup.md` (arquivado no git).
- `.claude/frontend-markup/` — frontend Vue 3/Pinia/Router/TS/Vite. 7 Rules + 8 Skills.
  Destilado do código real em `src/**` + memória `project_markup_frontend.md`.

As Skills dessas duas pastas são **referência** (não disparam sozinhas).

## Skills invocáveis (`.claude/skills/` — chamáveis por comando)

- `recriar-projeto-markup` — orquestrador: recria backend + frontend, garante o
  contrato (`VITE_GQL_ENDPOINT` ↔ `/graphql`, tipos ↔ schema) e verifica build.
- `recriar-backend-markup` — só o backend Go (7 fases guiadas pelas Skills).
- `recriar-frontend-markup` — só o frontend Vue (8 fases guiadas pelas Skills).

## Prompt reutilizável

`PromptFrontEnd/prompt-segmentar-rules-skills.md` — repetir a segmentação
Rules/Skills para outros documentos.

**How to apply:** para recriar/scaffoldar o projeto, invocar a skill
`recriar-projeto-markup` (ou a escopada). Para alterar regras/procedimentos,
editar a Rule/Skill correspondente na base — é a fonte de verdade, não os
arquivos de spec antigos.

**Why:** o usuário quer uma arquitetura "segundo cérebro" onde um comando recria
o projeto a partir do conhecimento segmentado, mantendo Rules como invariantes.

Fonte de verdade do domínio:
`d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`.
