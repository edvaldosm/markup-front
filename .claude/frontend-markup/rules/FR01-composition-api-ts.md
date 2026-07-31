# Rule FR01 — Composition API + `<script setup>` + TypeScript

**Categoria:** Convenção de componentes
**Origem:** `src/**` (padrão em todos os `.vue`), `package.json` (vue-tsc)

## Regra

Todo componente Vue usa **`<script setup lang="ts">`** com Composition API. Sem
Options API, sem JavaScript solto.

- Tipagem forte: importar tipos de `@/types` (alias `@` → `src/`).
- Build valida tipos: `vue-tsc && vite build` (script `build`).
- Lógica reutilizável vive em **composables** (`src/composables/`), não copiada
  entre componentes.

## Por quê

Consistência com todo o código existente e segurança de tipos ponta a ponta
entre domínio, stores e telas. Ver [[modelo-de-dados-front]].
