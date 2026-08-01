---
name: project-markup-frontend
description: "Contexto do projeto markup-front — stack, estrutura, telas e status"
metadata: 
  node_type: memory
  type: project
  originSessionId: cb2c661e-91b2-427f-96bd-4401d8e2aa68
---

Protótipo navegável Vue 3 do sistema de precificação por Markup por Divisor.

**Stack:** Vue 3 + Pinia + Vue Router + TypeScript + Vite. GraphQL mockado via `src/graphql/client.ts` (estrutura Apollo pronta para ligar com `MOCK_MODE = false`).

**Telas implementadas (17):**
- Produto (13): Login, Dashboard, Empresa, Materiais, Despesas Fixas, Impostos, Produtos (lista), Produto Detalhe (Ficha Técnica), Calculadora de Precificação, **Fator R** (serviços/Simples), Relatórios, Usuários, Perfis & RBAC
- **Gestão do Site (4)**, só para o ADMIN global: `/admin` (painel), `/admin/empresas`, `/admin/empresas/:id` (equipe da empresa), `/admin/usuarios`
- Multi-empresa: `CompanySwitcher` troca a empresa ativa e as stores reagem por reatividade.

> **Rules + Skills do front** destiladas em `.claude/frontend-markup/` (fonte de verdade dos padrões). Ver também `.claude/markup_knowledge_architecture.md`.

**Design:** Verde claro sofisticado — sidebar `#193f1b` (verde escuro), surface branca, accent `#2d7d31`. Design tokens em `src/assets/main.css` como variáveis CSS. O módulo de Gestão do Site usa o **escopo `.theme-admin`**, que remapeia a primária para a escala neutra grafite (sidebar `#0f172a`, accent `#475569`) — ver rule FR10.

**Dados mock:** `src/mock/data.ts` — empresa "Doces da Ana", **50 materiais**, **15 despesas fixas**, **15 produtos** (7 categorias), 4 perfis RBAC.

**Lógica de negócio:** `src/composables/useMarkup.ts` — fórmula `PV = CP / (1 - soma/100)`, rateio DF dinâmico.

**Padrão de paginação infinita (obrigatório em todas as telas com lista):**
- Composable: `src/composables/usePaginacao.ts` — `usePaginacao(source, { pageSize: 10 })`
- Componente: `src/components/ui/InfiniteScrollSentinel.vue` — spinner + botão "Carregar mais" + indicador de fim
- Trigger duplo: IntersectionObserver automático (scroll) + botão manual (fallback/acessibilidade)
- Mock delay: 1200ms para spinner visível durante testes
- Template ref no sentinel: `ref="sentinelaEl"` (Vue 3 auto-bind ao `.value` do composable)
- Implementado em: MateriaisView, DespesasFixasView — aplicar em TODA nova tela com lista

**How to apply:** Antes de adicionar telas ou alterar lógica, verificar este contexto para não duplicar stores ou quebrar a estrutura de navegação existente. Qualquer nova tela com tabela/lista DEVE usar `usePaginacao` + `InfiniteScrollSentinel`.

**Why:** Protótipo para validar UX antes de conectar backend GraphQL real.
