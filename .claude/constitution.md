# Constituição — Projeto Markup

> Documento de princípios do sistema de precificação **Markup por Divisor**.
> São **invariantes**: toda spec, plano, tarefa e código gerado deve obedecê-los.
> Em conflito, a Constituição prevalece sobre qualquer spec ou preferência de
> implementação.

- **Idioma de trabalho:** pt-br.
- **Fonte de verdade do domínio:** `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md` (consultar o "segundo cérebro" antes da web).
- **Versão:** 1.0.0 — 2026-07-31

---

## Artigo I — Princípios de Backend

Detalhe de cada princípio em `.claude/backend-markup/rules/`.

- **B1.** Todo cálculo de precificação vive no backend; o front só exibe. → [R01](backend-markup/rules/R01-calculo-no-backend.md)
- **B2.** Toda query filtra por `empresa_id` obtido do JWT (multi-tenant). → [R02](backend-markup/rules/R02-isolamento-multiempresa.md)
- **B3.** `divisorMarkup <= 0` retorna erro; nunca preço ≤ 0. → [R03](backend-markup/rules/R03-divisor-markup-positivo.md)
- **B4.** Camadas separadas: domain (tipos), service (regra), resolver (orquestração). → [R04](backend-markup/rules/R04-separacao-camadas.md)
- **B5.** Autorização RBAC verificada no início de cada resolver. → [R05](backend-markup/rules/R05-autorizacao-rbac.md)
- **B6.** Arquivos gerados pelo gqlgen nunca são editados à mão. → [R06](backend-markup/rules/R06-arquivos-gerados-nao-editar.md)
- **B7.** Formatação, ordenação de UI e estado de tela não vão para o backend. → [R07](backend-markup/rules/R07-fora-do-backend.md)

## Artigo II — Princípios de Frontend

Detalhe de cada princípio em `.claude/frontend-markup/rules/`.

- **F1.** Componentes em `<script setup lang="ts">` + Composition API. → [FR01](frontend-markup/rules/FR01-composition-api-ts.md)
- **F2.** Estado em Pinia setup stores por domínio, reativo à empresa ativa. → [FR02](frontend-markup/rules/FR02-stores-por-dominio.md)
- **F3.** Cores/espaços via variáveis CSS (`main.css`); nunca hardcode. → [FR03](frontend-markup/rules/FR03-design-tokens.md)
- **F4.** Toda tela com lista usa `usePaginacao` + `InfiniteScrollSentinel`. → [FR04](frontend-markup/rules/FR04-paginacao-obrigatoria.md)
- **F5.** Moeda/percentual só via `useCurrency` (Intl pt-BR). → [FR05](frontend-markup/rules/FR05-formatacao-intl.md)
- **F6.** GraphQL isolado (`MOCK_MODE`); ao ligar o backend, o cálculo sai do front. → [FR06](frontend-markup/rules/FR06-camada-graphql-isolada.md)
- **F7.** Rotas com guard de auth + lazy load de componentes. → [FR07](frontend-markup/rules/FR07-rotas-protegidas.md)

## Artigo III — Fronteira Backend ↔ Frontend

- O backend devolve **números crus**; o frontend **formata e apresenta** (B7 + F5).
- Contrato único: schema GraphQL do backend ([schema](backend-markup/skills/schema-graphql-markup/SKILL.md))
  espelhado pelos tipos do front ([tipos](frontend-markup/skills/modelo-de-dados-front/SKILL.md));
  endpoint via `VITE_GQL_ENDPOINT`.

## Artigo IV — Governança (Spec-Driven Development)

1. **Fluxo de mudança:** `/specify` → `/plan` → `/tasks` → implementar. Nenhuma
   feature entra em código sem passar por uma spec em `.claude/specs/<slug>/`.
2. **Precedência:** Constituição > spec da feature > plano > preferência de código.
3. **Conformidade:** todo `spec.md`, `plan.md` e `tasks.md` declara quais artigos
   aplica; nada pode propor algo que viole um artigo sem uma emenda explícita aqui.
4. **Emenda:** alterar um princípio = editar a Rule correspondente **e** subir a
   versão desta Constituição (semver: breaking = major).
5. **Regeneração total:** as skills `recriar-*` produzem o projeto do zero a
   partir das bases, sempre respeitando estes artigos.
