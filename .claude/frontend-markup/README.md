# Frontend Markup — Base de conhecimento segmentada

Rules e Skills destiladas do código real do protótipo Vue 3 (`src/`) e da
memória `project_markup_frontend.md`. Espelha a estrutura de
[.claude/backend-markup/](../backend-markup/README.md).

- **Requisitos (SDD):** [spec.md](spec.md) — o *quê/por quê*. Os arquivos de `skills/` são os *templates* (o *como*).
- **Princípios:** [../constitution.md](../constitution.md) — as `rules/` são os artigos (v2.4.0).
- **Fonte:** `src/**` (código vivo) + `.claude/project_markup_frontend.md` (memória de estado)
- **Fonte de verdade do domínio:** `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`
- **Gerado em:** 2026-07-31

## Rules — o que sempre/nunca fazer

| Arquivo | Regra |
|---------|-------|
| [rules/FR01-composition-api-ts.md](rules/FR01-composition-api-ts.md) | Componentes em `<script setup>` + Composition API + TypeScript |
| [rules/FR02-stores-por-dominio.md](rules/FR02-stores-por-dominio.md) | Estado em Pinia setup stores por domínio, reativo à empresa ativa |
| [rules/FR03-design-tokens.md](rules/FR03-design-tokens.md) | Cores/espacos via variáveis CSS de `main.css` — nunca hardcode |
| [rules/FR04-paginacao-obrigatoria.md](rules/FR04-paginacao-obrigatoria.md) | Toda tela com lista usa `usePaginacao` + `InfiniteScrollSentinel` |
| [rules/FR05-formatacao-intl.md](rules/FR05-formatacao-intl.md) | Moeda/percentual só via `useCurrency` (Intl pt-BR) |
| [rules/FR06-camada-graphql-isolada.md](rules/FR06-camada-graphql-isolada.md) | GraphQL isolado em `src/graphql`; ao ligar backend, cálculo sai do front |
| [rules/FR07-rotas-protegidas.md](rules/FR07-rotas-protegidas.md) | Rotas com guard de auth + lazy load de componentes |
| [rules/FR08-assistente-consome-backend.md](rules/FR08-assistente-consome-backend.md) | Assistente só consome o backend; nunca o vault/LLM direto |
| [rules/FR09-teste-navegacao-por-perfil.md](rules/FR09-teste-navegacao-por-perfil.md) | Visibilidade/permissão exige teste que navega como cada perfil |
| [rules/FR10-escopo-de-tema-por-modulo.md](rules/FR10-escopo-de-tema-por-modulo.md) | Módulo com público próprio muda de identidade por escopo de tema, não por hardcode |
| [rules/FR11-relatorio-vem-do-backend.md](rules/FR11-relatorio-vem-do-backend.md) | Relatório vem do backend (Jasper); o front pede e baixa, não monta documento |

## Skills — como fazer (procedimentos)

| Skill | Descrição |
|-------|-----------|
| [skills/estrutura-projeto-vue](skills/estrutura-projeto-vue/SKILL.md) | Layout de pastas, bootstrap, Vite/TS e dependências |
| [skills/modelo-de-dados-front](skills/modelo-de-dados-front/SKILL.md) | Tipos do domínio (`src/types`), segmentos e Fator R |
| [skills/store-pinia-dominio](skills/store-pinia-dominio/SKILL.md) | Padrão de setup store por domínio com `mockQuery` |
| [skills/composables-calculo-formatacao](skills/composables-calculo-formatacao/SKILL.md) | `useMarkupCalculator`, `useCurrency` e Fator R |
| [skills/paginacao-infinita](skills/paginacao-infinita/SKILL.md) | `usePaginacao` + `InfiniteScrollSentinel` |
| [skills/camada-graphql-mock](skills/camada-graphql-mock/SKILL.md) | `client.ts`, `MOCK_MODE`, `mockQuery` e migração p/ Apollo |
| [skills/roteamento-e-layout](skills/roteamento-e-layout/SKILL.md) | Router, `AppLayout`/Sidebar/Header, `CompanySwitcher`, as 17 telas |
| [skills/design-tokens-tema](skills/design-tokens-tema/SKILL.md) | Tokens do tema verde, escala neutra e escopos de tema |
| [skills/modulo-gestao-site](skills/modulo-gestao-site/SKILL.md) | Módulo do gestor do site: rotas `/admin`, store global e tema neutro |
| [skills/assistente-ui](skills/assistente-ui/SKILL.md) | Chat do assistente (widget + composable) consumindo o backend |
| [skills/testes-navegacao-multiusuario](skills/testes-navegacao-multiusuario/SKILL.md) | Testes de aceite (vitest) navegando como cada perfil |
