# Specs — Fluxo Spec-Driven Development

Cada mudança de comportamento nasce aqui, numa pasta `<slug>/`, antes de virar
código. Governado por [../constitution.md](../constitution.md), Artigo IV.

## Fluxo

```
/specify  →  spec.md   (o quê e por quê — requisitos)
/plan     →  plan.md   (como — abordagem, contratos, templates)
/tasks    →  tasks.md  (lista ordenada e rastreável)
implementar (ou recriar-* para scaffold total)
```

- `_template/` — modelos de `spec.md`, `plan.md`, `tasks.md`.
- `<slug>/` — uma pasta por feature/mudança.

## Baselines já especificados

O estado atual do sistema está descrito nos specs de baseline de cada base:

- Backend: [../backend-markup/spec.md](../backend-markup/spec.md)
- Frontend: [../frontend-markup/spec.md](../frontend-markup/spec.md)

## Regras do fluxo

1. Nenhuma feature vai para código sem `spec.md`.
2. `spec.md` não contém stack nem código (isso é `plan.md`).
3. Todo artefato declara os artigos da Constituição que aplica; violar um artigo
   exige emenda explícita na Constituição.
