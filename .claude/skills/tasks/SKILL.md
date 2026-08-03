---
name: tasks
description: Deriva a lista de tarefas ordenada e rastreável (tasks.md) a partir de um plan.md do sistema Markup. Terceiro passo do fluxo SDD, antes de implementar. Use após /plan.
---

# /tasks — Tarefas (SDD, passo 3/3)

Cria `.claude/specs/<slug>/tasks.md` a partir do `plan.md`. Trabalhe em **pt-br**.

## Procedimento

1. **Ler** `.claude/specs/<slug>/plan.md` e o `spec.md` correspondente.
2. **Criar** `tasks.md` a partir de `.claude/specs/_template/tasks.md`.
3. **Quebrar** em tarefas pequenas e ordenadas, agrupadas por camada
   (Backend / Frontend / Verificação). Cada tarefa tem:
   - id (`T-B1`, `T-F1`…), referência ao requisito (`REQ-xx`),
   - arquivo/skill alvo, critério de "done" e dependências (`dep:`).
4. **Fechar** com a etapa de verificação (`npm run build`, `npm test`) e a
   checagem dos critérios de aceite do `spec.md`.

## Saída

Caminho do `tasks.md`. **Próximo:** implementar as tarefas (ou usar
`recriar-frontend-markup` para scaffold total quando a feature for grande o
bastante para justificar regeneração).
