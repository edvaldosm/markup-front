---
name: design-tokens-tema
description: Tokens de design do frontend Markup (tema verde, espaçamentos, sombras, sidebar) definidos em main.css. Use ao estilizar componentes ou ajustar o tema.
metadata:
  domain: frontend-markup
  kind: skill
  origin: src/assets/main.css
---

# Design tokens — tema verde sofisticado

Definidos em `:root` de `src/assets/main.css`. Sempre usar via `var(--…)`
([[FR03-design-tokens]]).

## Paleta primária (verde)

```
--color-primary-50  #f0faf0   --color-primary-500 #3a9b3e
--color-primary-100 #dcf3dc   --color-primary-600 #2d7d31  (accent)
--color-primary-200 #b9e7bb   --color-primary-700 #256328
--color-primary-300 #87d18a   --color-primary-800 #1e4f21
--color-primary-400 #55b559   --color-primary-900 #193f1b  (sidebar)
```

## Superfícies e texto

```
--color-surface #ffffff   --color-bg #f6faf6   --color-bg-subtle #edf7ed
--color-border #d4e8d4     --color-border-light #e8f5e8
--color-text #1a2e1b       --color-text-muted #5a7a5b   --color-text-light #8aaa8b
```

## Semânticos

`--color-success #3a9b3e`, `--color-warning #d97706`, `--color-danger #dc2626`,
`--color-info #2563eb`.

## Escalas

- Espaço: `--space-1`..`--space-12` (0.25rem → 3rem)
- Raio: `--radius-sm 6px`, `--radius 10px`, `--radius-lg 16px`, `--radius-xl 24px`
- Sombra: `--shadow-xs`..`--shadow-lg`
- Layout: `--sidebar-width 240px`, `--header-height 60px`
- Fonte: `--font-sans` (Inter, system-ui)

O tema pode variar por `SegmentoNegocio` (config em `src/config/segmentos.ts`) —
ver [[modelo-de-dados-front]].
