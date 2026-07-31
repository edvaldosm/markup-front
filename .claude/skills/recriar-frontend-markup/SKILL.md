---
name: recriar-frontend-markup
description: Recria do zero o frontend Vue 3 (Pinia + Vue Router + TS + Vite) do sistema Markup, a partir de .claude/frontend-markup, respeitando as 8 Rules. Use quando o usuário pedir para gerar/scaffoldar apenas o frontend.
---

# Recriar frontend Markup (Vue 3)

Gera o protótipo navegável a partir de `.claude/frontend-markup/`. Trabalhe em
**pt-br**.

## Ler antes

`.claude/frontend-markup/README.md` e todos os arquivos de `rules/` e `skills/`.

## Invariantes (Rules — nunca violar)

- FR01 — `<script setup lang="ts">` + Composition API
- FR02 — Pinia setup stores por domínio, reativas à empresa ativa
- FR03 — cores/espaços via variáveis CSS (`main.css`), sem hardcode
- FR04 — listas usam `usePaginacao` + `InfiniteScrollSentinel`
- FR05 — moeda/percentual só via `useCurrency`
- FR06 — GraphQL isolado (`MOCK_MODE`); ao ligar backend, cálculo sai do front
- FR07 — rotas com guard de auth + lazy load
- FR08 — assistente só consome o backend; nunca o vault/LLM direto

## Fases (cada uma guiada por uma Skill)

1. **Scaffold + deps** — `estrutura-projeto-vue`: `src/` completo, `main.ts`,
   Vite/tsconfig com alias `@`, dependências (vue, pinia, vue-router, apollo).
2. **Tipos** — `modelo-de-dados-front`: `src/types/index.ts`, segmentos, Fator R.
3. **Tokens** — `design-tokens-tema`: `src/assets/main.css` (`:root` + reset).
4. **Stores** — `store-pinia-dominio`: auth, empresa, produtos, materiais,
   despesas, impostos, usuarios.
5. **Composables** — `composables-calculo-formatacao` + `paginacao-infinita`.
6. **Camada GraphQL** — `camada-graphql-mock`: `client.ts` + `mock/data.ts`.
7. **Router + layout** — `roteamento-e-layout`: guard, `AppLayout`/Sidebar/Header,
   `CompanySwitcher` e as 13 telas em `src/views/`.
8. **UI base** — componentes `Base*`, `StatCard`, `InfiniteScrollSentinel`, modais.
9. **Assistente** — `assistente-ui`: `AssistenteWidget.vue` + `useAssistente.ts`
   consumindo `perguntarAssistente` (mock e real), tratando OK/FORA_DE_ESCOPO/
   RECUSADO/SEM_FONTE.

## Verificar

`npm install` + `npm run build` (`vue-tsc && vite build`); reportar o resultado
real. Confirmar destino/sobrescrita antes de escrever arquivos.
