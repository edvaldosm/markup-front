---
name: estrutura-projeto-vue
description: Layout de pastas, bootstrap, Vite/TS e dependências do frontend Markup (Vue 3 + Pinia + Vue Router). Use ao criar o projeto do zero ou adicionar módulos.
metadata:
  domain: frontend-markup
  kind: skill
  origin: src/main.ts, package.json, vite.config.ts, tsconfig.json
---

# Estrutura de projeto (Vue 3)

## Stack

- Vue 3.5 (Composition API) + TypeScript 5.7
- Pinia 2.3 (estado) + Vue Router 4.5 (rotas)
- Vite 6 (build) + vue-tsc (type-check)
- Apollo (`@apollo/client`, `@vue/apollo-composable`, `graphql`) — pronto para ligar

```json
// dependencies
"vue", "vue-router", "pinia", "@apollo/client", "@vue/apollo-composable", "graphql"
// devDependencies
"@vitejs/plugin-vue", "typescript", "vite", "vue-tsc"
```

Scripts: `dev` (vite), `build` (`vue-tsc && vite build`), `preview`.

## Layout

```text
src/
├── main.ts                 ← createApp + Pinia + Router + main.css
├── App.vue
├── assets/main.css         ← design tokens (:root) + reset
├── router/index.ts         ← rotas + guard de auth
├── stores/                 ← Pinia por domínio (auth, empresa, produtos, …)
├── composables/            ← useMarkup, usePaginacao
├── graphql/client.ts       ← MOCK_MODE + mockQuery + GQL_ENDPOINT
├── mock/data.ts            ← dados mock (empresa "Doces da Ana")
├── config/segmentos.ts     ← config por segmento de negócio
├── types/index.ts          ← tipos do domínio
├── components/
│   ├── layout/             ← AppLayout, AppHeader, AppSidebar, CompanySwitcher
│   └── ui/                 ← Base* (Button, Card, Input, Modal, Badge), StatCard,
│                              InfiniteScrollSentinel, *FormModal, FatorRNote
└── views/                  ← 1 arquivo por tela (ver [[roteamento-e-layout]])
```

## Bootstrap (`main.ts`)

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

createApp(App).use(createPinia()).use(router).mount('#app')
```

## Config

- Alias `@` → `src/` (Vite + tsconfig `paths`).
- Env do backend: `VITE_GQL_ENDPOINT` (ver [[camada-graphql-mock]]).
