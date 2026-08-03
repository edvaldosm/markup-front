---
name: plan
description: Gera o plano técnico (plan.md) a partir de um spec.md do sistema Markup — abordagem, contratos e quais Skills/templates usar. Segundo passo do fluxo SDD. Use após /specify.
---

# /plan — Planejar (SDD, passo 2/3)

Cria `.claude/specs/<slug>/plan.md` a partir do `spec.md` aprovado. Trabalhe em
**pt-br**.

## Procedimento

1. **Ler** `.claude/specs/<slug>/spec.md` e `.claude/constitution.md`. Se houver
   `[PRECISA CLARIFICAR]` em aberto, resolver com o usuário antes.
2. **Criar** `plan.md` a partir de `.claude/specs/_template/plan.md`.
3. **Definir a abordagem** e as camadas afetadas, apontando os **templates**
   existentes que servem de base:
   - Frontend: skills em `.claude/frontend-markup/skills/`.
   - Backend (quando a feature exigir): repo `markup-back`, skills em
     `.claude/backend-markup/skills/` e contrato em `src/main/resources/graphql/schema.graphqls`.
4. **Contratos:** especificar mudanças de schema GraphQL e de `src/types` de forma
   que fiquem espelhados (Artigo III da Constituição).
5. **Rastreabilidade:** mapear cada `REQ-xx` a uma decisão de design.
6. **Rules:** listar os artigos que guiam/limitam a implementação; não propor nada
   que os viole.

## Saída

Caminho do `plan.md` + riscos principais. **Próximo:** `/tasks`.
