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

O estado atual do frontend está em [../frontend-markup/spec.md](../frontend-markup/spec.md).
O baseline do backend vive no repo **markup-back** (`.claude/backend-markup/spec.md`).

## Escopo deste diretório

Só specs que tocam o **frontend**. Specs de backend (`backend-java-spring`,
`assistente-rag`, `multiempresa-ownership`, `modulo-relatorios-jasper`) foram
movidas para `markup-back/.claude/specs/` em 2026-08-03 — o backend já está
implementado, e manter cópia aqui só criaria duas versões divergindo.

## Features especificadas

| Feature | Spec | Estado |
|---------|------|--------|
| Integração backend — sessão e empresas | [integracao-backend-sessao-empresas/](integracao-backend-sessao-empresas/spec.md) | fatia 1 de 3 — **concluída** |
| Integração backend — catálogo, usuários e perfis | [integracao-backend-catalogo/](integracao-backend-catalogo/spec.md) | fatia 2 de 3 — **concluída** |
| Módulo Gestão do Site | [modulo-gestao-site/](modulo-gestao-site/spec.md) | implementado (mock) |
| Faixa de negociação e PDF | [faixa-negociacao-e-pdf/](faixa-negociacao-e-pdf/spec.md) | implementado (mock) |

## Regras do fluxo

1. Nenhuma feature vai para código sem `spec.md`.
2. `spec.md` não contém stack nem código (isso é `plan.md`).
3. Todo artefato declara os artigos da Constituição que aplica; violar um artigo
   exige emenda explícita na Constituição.
