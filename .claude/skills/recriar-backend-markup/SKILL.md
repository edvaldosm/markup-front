---
name: recriar-backend-markup
description: Recria do zero o backend Go (Gin + gqlgen + GORM + PostgreSQL) do sistema Markup, a partir de .claude/backend-markup, respeitando as 7 Rules. Use quando o usuário pedir para gerar/scaffoldar apenas o backend.
---

# Recriar backend Markup (Go)

Gera o backend do sistema de precificação a partir de
`.claude/backend-markup/`. Trabalhe em **pt-br**.

## Ler antes

`.claude/backend-markup/README.md` e todos os arquivos de `rules/` e `skills/`.

## Invariantes (Rules — nunca violar)

- R01 — todo cálculo de precificação no backend; o front só exibe
- R02 — toda query filtra por `empresa_id` do JWT
- R03 — `divisorMarkup <= 0` → erro; nunca preço ≤ 0
- R04 — camadas domain/service/resolver separadas
- R05 — verificar permissão RBAC no início de cada resolver
- R06 — não editar `generated.go` / `models_gen.go`
- R07 — formatação/ordenação/estado de UI ficam no front

## Fases (cada uma guiada por uma Skill)

1. **Estrutura + deps** — `estrutura-projeto-go`: layout `cmd/ graph/ internal/`,
   `go.mod`, `gqlgen.yml`, dependências (Gin, gqlgen, GORM, gin-jwt, bcrypt).
2. **Schema GraphQL** — `schema-graphql-markup`: escrever `graph/schema.graphqls`,
   rodar `go tool gqlgen generate`.
3. **Domínio GORM** — `modelagem-der-markup`: 1 struct por entidade em `internal/domain/`.
4. **Services** — `resolver-precificacao-go` + fórmula `formula-markup-divisor`:
   toda a regra em `internal/service/` (precificação isolada).
5. **Auth JWT** — `auth-jwt-gin`: middleware gin-jwt, claims, rotas `/login` `/refresh`.
6. **RBAC** — `rbac-permissoes`: chaves, perfis e checagem nos resolvers.
7. **Seed** — `seed-dados-iniciais`: impostos, 16 permissões, 5 perfis, admin.

## Verificar

`go build ./...` e reportar o resultado real. Confirmar destino/sobrescrita
antes de escrever arquivos.
