# Rule FR03 — Cores e espaços via design tokens

**Categoria:** Estilo / Tema
**Origem:** `src/assets/main.css` (`:root`)

## Regra

Estilos usam **variáveis CSS** definidas em `src/assets/main.css` — nunca valores
hardcoded (hex, px de espaçamento, raios, sombras).

- Cores: `var(--color-primary-600)`, `var(--color-surface)`, `var(--color-text-muted)`, etc.
- Espaço: `var(--space-4)`; raio: `var(--radius)`; sombra: `var(--shadow-sm)`.
- Paleta é o **verde claro sofisticado** (primary 50→900), sidebar
  `--color-primary-900` (`#193f1b`), accent `--color-primary-600` (`#2d7d31`).

## Por quê

Um único ponto de verdade visual permite retema/ajuste global sem caçar hex
espalhado. Ver [[design-tokens-tema]].
