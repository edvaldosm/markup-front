---
name: prompt-segmentar-rules-skills
description: Prompt reutilizável para segmentar um documento-fonte em blocos de Rules e Skills gravados no .claude do projeto.
idioma: pt-br
origem: novaversao.txt (2026-07-31)
---

# Prompt — Segmentar documento em Rules e Skills

> Prompt reutilizável para transformar um documento denso (spec, guia, prompt)
> numa base de conhecimento segmentada dentro de `.claude/`, separando o que é
> **regra** do que é **procedimento**.

## Contexto fixo

- **Fonte de conhecimento (segundo cérebro):** consultar **primeiro** o vault
  Obsidian em `d:\ObsidianDocumentos\Conhecimento` antes da web. Mapa de assuntos
  em `CLAUDE.md`. Fonte de verdade do domínio Markup:
  `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`.
- **Idioma:** responder e escrever sempre em **pt-br**.

## Entrada

- `ARQUIVO_FONTE`: caminho do documento a segmentar (ex: um `.md` de spec).
- `DESTINO`: `.claude/<slug-do-tema>/` no projeto.

## Tarefa

1. Ler o `ARQUIVO_FONTE` por completo.
2. Segmentar em **blocos pequenos**, classificando cada um como:
   - **Rule** — invariante/política inegociável ("sempre/nunca", fronteiras de
     responsabilidade, regras de segurança e integridade). Vai em
     `DESTINO/rules/RNN-<slug>.md`.
   - **Skill** — procedimento reutilizável ("como fazer": fórmulas, schemas,
     estruturas de código, passos). Vai em `DESTINO/skills/<slug>/SKILL.md` com
     frontmatter `name` + `description`.
3. Criar um `DESTINO/README.md` indexando Rules e Skills com links.
4. Cruzar referências entre blocos com wikilinks `[[slug]]`.
5. Manter cada bloco enxuto e com um cabeçalho apontando a origem (seção do
   documento-fonte).

## Convenções

- Cada Rule tem: título, categoria, origem, a regra e o "por quê".
- Cada Skill tem: frontmatter (`name`, `description`, `metadata`), o procedimento
  e links para as Rules relacionadas.
- Skills de outra stack (ex: backend Go num repo de frontend) ficam **aninhadas**
  em `DESTINO/skills/` como referência — não em `.claude/skills/` raiz — para não
  dispararem automaticamente no trabalho corrente.

## Saída esperada

- `DESTINO/README.md` (índice)
- `DESTINO/rules/*.md` (uma regra por arquivo)
- `DESTINO/skills/*/SKILL.md` (um procedimento por skill)

## Exemplo já aplicado

Fonte `PromptFrontEnd/IniciandoBackEndMarkup.md` → `.claude/backend-markup/`
(7 Rules + 8 Skills). Ver `.claude/backend-markup/README.md`.
