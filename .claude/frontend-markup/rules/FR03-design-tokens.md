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
- Realces derivados da primária também são tokens: `--color-primary-shadow`,
  `--color-primary-shadow-strong`, `--focus-ring`. Sem eles, um hex de acento
  cravado no componente não acompanha a troca de tema ([[FR10-escopo-de-tema-por-modulo]]).
- Há uma segunda escala, **`--color-neutral-50…900`** (grafite), usada pelo
  escopo `.theme-admin` — ela existe para ser *remapeada sobre* a primária, não
  para ser usada solta no meio de uma tela do produto.

## Por quê

Um único ponto de verdade visual permite retema/ajuste global sem caçar hex
espalhado. Ver [[design-tokens-tema]].
