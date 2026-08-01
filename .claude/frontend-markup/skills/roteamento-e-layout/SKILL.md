---
name: roteamento-e-layout
description: Roteamento, layout (AppLayout/Sidebar/Header/CompanySwitcher) e as 17 telas do frontend Markup. Use ao adicionar telas, rotas ou mexer na navegação.
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

O que protege cada rota é declarado nela, e são **duas coisas diferentes**:

| Meta | Significa | Checagem no guard |
|------|-----------|-------------------|
| `permissao: PermissaoChave` | RBAC dentro da empresa | `auth.hasPermissao(...)` |
| `adminGlobal: true` | escopo global (Gestão do Site) | `auth.adminGlobal` |

Sem permissão/escopo o guard cai no `dashboard` — o destino de fallback.

## Layout (`src/components/layout/`)

- `AppLayout` — shell com `<router-view>` das telas internas
- `AppSidebar` — navegação (sidebar `--color-primary-900`, largura `--sidebar-width`)
- `AppHeader` — topo (`--header-height`)
- `CompanySwitcher` — troca de empresa ativa (multi-empresa); dispara a
  reatividade das stores ([[FR02-stores-por-dominio]]). Em `/admin*` ele **sai**
  do header (não há empresa ativa na visão global) e dá lugar ao selo
  "Modo gestor"

Em `/admin*` o layout entra no escopo de tema neutro e a sidebar troca a marca do
segmento pela da área do gestor — ver [[FR10-escopo-de-tema-por-modulo]].

## As 17 telas (`src/views/`)

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
| `admin` | admin/AdminVisaoGeralView | Gestão do Site — painel |
| `admin-empresas` | admin/AdminEmpresasView | Gestão do Site — empresas |
| `admin-empresa-detalhe` | admin/AdminEmpresaDetalheView | Equipe da empresa (`/admin/empresas/:id`) |
| `admin-usuarios` | admin/AdminUsuariosView | Gestão do Site — usuários |

As quatro últimas são o módulo do gestor (`meta.adminGlobal`) — procedimento em
[[modulo-gestao-site]].

## Componentes UI base (`src/components/ui/`)

`BaseButton`, `BaseCard`, `BaseInput`, `BaseModal`, `BaseBadge`, `StatCard`,
`InfiniteScrollSentinel` ([[paginacao-infinita]]), `ProdutoFormModal`,
`EmpresaFormModal`, `FatorRNote`. Estilo via tokens ([[design-tokens-tema]]).
