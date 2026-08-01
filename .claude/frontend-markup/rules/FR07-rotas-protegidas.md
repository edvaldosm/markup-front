# Rule FR07 — Rotas protegidas por guard + lazy load

**Categoria:** Roteamento / Auth
**Origem:** `src/router/index.ts`

## Regra

- Componentes de rota são **lazy-loaded**: `component: () => import('@/views/…')`.
- Rotas autenticadas ficam sob o layout `AppLayout` com `meta: { requiresAuth: true }`;
  rotas públicas marcam `meta: { public: true }` (ex.: `login`).
- Um `router.beforeEach` redireciona para `login` quando não há usuário:

  ```ts
  router.beforeEach((to) => {
    const auth = useAuthStore()
    if (!to.meta.public && !auth.user) return { name: 'login' }
  })
  ```

- Rota curinga `/:pathMatch(.*)*` redireciona para `/dashboard`.

## Por quê

Protege as telas internas e mantém o bundle inicial pequeno (code splitting por
rota). Ver [[roteamento-e-layout]].
