---
name: roteamento-e-layout
description: Roteamento, layout (AppLayout/Sidebar/Header/CompanySwitcher) e as 13 telas do frontend Markup. Use ao adicionar telas, rotas ou mexer na navegação.
metadata:
  domain: frontend-markup
  kind: skill
  origin: src/router/index.ts, src/components/layout/*, src/views/*
---

# Roteamento e layout

## Router (`src/router/index.ts`)

`createWebHistory`, componentes lazy, guard de auth ([[FR07-rotas-protegidas]]):

- `/login` — `meta.public`
- `/` → `AppLayout` (`meta.requiresAuth`), redireciona `''` → `/dashboard`
- Curinga `/:pathMatch(.*)*` → `/dashboard`

## Layout (`src/components/layout/`)

- `AppLayout` — shell com `<router-view>` das telas internas
- `AppSidebar` — navegação (sidebar `--color-primary-900`, largura `--sidebar-width`)
- `AppHeader` — topo (`--header-height`)
- `CompanySwitcher` — troca de empresa ativa (multi-empresa); dispara a
  reatividade das stores ([[FR02-stores-por-dominio]])

## As 13 telas (`src/views/`)

| Rota | View | Módulo |
|------|------|--------|
| `login` | LoginView | Auth |
| `dashboard` | DashboardView | Visão geral |
| `empresa` | EmpresaView | Empresa |
| `materiais` | MateriaisView | Materiais/insumos |
| `despesas` | DespesasFixasView | Despesas fixas |
| `impostos` | ImpostosView | Impostos |
| `produtos` | ProdutosView | Produtos (lista) |
| `produto-detalhe` | ProdutoDetalheView | Ficha técnica (`/produtos/:id`) |
| `precificacao` | PrecificacaoView | Calculadora de preço |
| `fator-r` | FatorRView | Fator R (serviços/Simples) |
| `relatorios` | RelatoriosView | Relatórios |
| `usuarios` | UsuariosView | Usuários |
| `perfis` | PerfisView | Perfis & RBAC |

## Componentes UI base (`src/components/ui/`)

`BaseButton`, `BaseCard`, `BaseInput`, `BaseModal`, `BaseBadge`, `StatCard`,
`InfiniteScrollSentinel` ([[paginacao-infinita]]), `ProdutoFormModal`,
`EmpresaFormModal`, `FatorRNote`. Estilo via tokens ([[design-tokens-tema]]).
