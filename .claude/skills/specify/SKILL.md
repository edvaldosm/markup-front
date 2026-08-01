---
name: specify
description: Cria a especificação (spec.md) de uma nova feature/mudança do sistema Markup — o QUE e por quê, sem o COMO. Primeiro passo do fluxo SDD. Use ao iniciar qualquer mudança de comportamento ou funcionalidade.
---

# /specify — Especificar (SDD, passo 1/3)

Cria `.claude/specs/<slug>/spec.md` capturando **requisitos**, não implementação.
Trabalhe em **pt-br**.

## Procedimento

1. **Entender o pedido** do usuário (a feature/mudança). Se faltar contexto de
   domínio, consultar o segundo cérebro
   (`d:\ObsidianDocumentos\Conhecimento\...\wiki-markup.md`).
2. **Escolher slug** kebab-case e criar `.claude/specs/<slug>/spec.md` a partir de
   `.claude/specs/_template/spec.md`.
3. **Preencher** só o QUE/por quê: objetivo, histórias de usuário, requisitos
   testáveis (`REQ-01…` com MUST/SHOULD), critérios de aceite, fora de escopo.
4. **Conformidade:** ler `.claude/constitution.md` e listar os artigos aplicáveis.
   Nada pode violar um artigo; se precisar, registrar "emenda necessária".
5. **Ambiguidade:** marcar `[PRECISA CLARIFICAR]` e perguntar ao usuário antes de fechar.
6. **NÃO** incluir stack, arquivos ou código — isso é `/plan`.

## Saída

Caminho do `spec.md` criado + lista de pontos a clarificar. **Próximo:** `/plan`.
