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

## Roteiro da integração com o backend

Deixou de ser "3 fatias fechadas" a partir de 2026-08-04: a auditoria de
cálculo zero (ver `integracao-backend-precificacao/spec.md`) achou fórmula de
domínio e agregação sobrevivendo em telas já ligadas a dado real, então o
escopo original da "fatia 3" foi dividido — precificação sai sozinha porque o
backend já a implementa; Gestão do Site, relatórios e assistente vieram depois
porque cada uma tem uma dependência própria (reescrita grande, módulo do
backend inexistente, tela nova).

| Feature | Spec | Estado |
|---------|------|--------|
| Integração backend — sessão e empresas | [integracao-backend-sessao-empresas/](integracao-backend-sessao-empresas/spec.md) | **concluída** |
| Integração backend — catálogo, usuários e perfis | [integracao-backend-catalogo/](integracao-backend-catalogo/spec.md) | **concluída** |
| Integração backend — precificação e auditoria de cálculo zero | [integracao-backend-precificacao/](integracao-backend-precificacao/spec.md) | **concluída** |
| Integração backend — Gestão do Site | `integracao-backend-gestao-site/` | próxima — depende da anterior fechar |
| Módulo de relatórios (Jasper) | `modulo-relatorios-jasper` — spec no repo **markup-back** | **bloqueada**: módulo `com.markup.reports` não existe no backend |
| Assistente (RAG) | a especificar | tela nova, não remoção de mock |
| Módulo Gestão do Site (mock) | [modulo-gestao-site/](modulo-gestao-site/spec.md) | baseline do que existe hoje — superado por `integracao-backend-gestao-site` quando essa nascer |
| Faixa de negociação e PDF (mock) | [faixa-negociacao-e-pdf/](faixa-negociacao-e-pdf/spec.md) | baseline — a faixa já migrou em `integracao-backend-precificacao`; o PDF segue bloqueado |

## Regras do fluxo

1. Nenhuma feature vai para código sem `spec.md`.
2. `spec.md` não contém stack nem código (isso é `plan.md`).
3. Todo artefato declara os artigos da Constituição que aplica; violar um artigo
   exige emenda explícita na Constituição.
