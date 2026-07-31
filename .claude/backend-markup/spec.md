# Spec — Backend Markup

> **Requisitos** (o quê e por quê) do backend. O **como** (templates, código) está
> em `skills/`. Os princípios em [constitution.md](../constitution.md). Este spec
> descreve o **baseline** do backend; mudanças novas nascem em `.claude/specs/<slug>/`.

## Objetivo

Expor uma API **GraphQL** que centraliza todo o cálculo de precificação por
Markup por Divisor, isolada por empresa e protegida por RBAC.

## Requisitos funcionais

- **RB-01 (Precificação):** o sistema DEVE calcular o Preço de Venda no servidor
  pela fórmula `PV = CP / (1 - (Impostos+DF+ML+D)/100)`. (Artigos B1, B3)
  - Aceite: `precificarProduto(produtoId)` retorna `ResultadoPrecificacao` com
    breakdown; soma ≥ 100% ⇒ erro, nunca preço ≤ 0.
- **RB-02 (Custo base):** DEVE calcular CP = `SUM(qtd × custo_unitario)` da ficha técnica.
- **RB-03 (Despesas fixas):** DEVE calcular %DF = `SUM(valor_mensal_ativo)/faturamento×100` dinamicamente.
- **RB-04 (Multi-tenant):** toda operação DEVE filtrar por `empresa_id` do JWT. (Artigo B2)
  - Aceite: usuário não lê/escreve dados de empresa fora do seu token.
- **RB-05 (RBAC):** cada resolver DEVE exigir a permissão correspondente (`*_READ`/`*_WRITE`). (Artigo B5)
- **RB-06 (Auth):** login DEVE emitir JWT com claims `id`, `empresa_id`, `role`, `permissoes`; refresh sem re-login.
- **RB-07 (CRUD de domínio):** empresa, despesas, materiais, impostos, produtos
  (com ficha técnica e impostos), perfis/permissões e usuários.
- **RB-08 (Seed):** DEVE popular impostos padrão, 16 permissões, 5 perfis e admin inicial.

## Modelo de dados (requisito)

Entidades e relações conforme o DER v3 — ver template
[modelagem-der-markup](skills/modelagem-der-markup/SKILL.md).

## Contrato (requisito)

Schema GraphQL (tipos, queries, mutations, inputs) — ver template
[schema-graphql-markup](skills/schema-graphql-markup/SKILL.md). Endpoint
`POST /graphql` com `Authorization: Bearer <token>`.

## Fora de escopo (não-objetivos)

Formatação de moeda/percentual, ordenação e filtragem de UI, e estado de
interface — pertencem ao frontend. (Artigo B7)

## Rastreabilidade → templates (`skills/`)

| Requisito | Template |
|-----------|----------|
| RB-01/02/03 | `formula-markup-divisor`, `resolver-precificacao-go` |
| RB-04/05 | `rbac-permissoes`, rules R02/R05 |
| RB-06 | `auth-jwt-gin` |
| RB-07 | `modelagem-der-markup`, `schema-graphql-markup`, `estrutura-projeto-go` |
| RB-08 | `seed-dados-iniciais` |
