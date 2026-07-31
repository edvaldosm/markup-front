# Backend Markup — Base de conhecimento segmentada

Segmentação do prompt `IniciandoBackEndMarkup.md` em blocos pequenos, separando
**Rules** (invariantes/políticas inegociáveis) de **Skills** (procedimentos
reutilizáveis de implementação).

- **Requisitos (SDD):** [spec.md](spec.md) — o *quê/por quê*. Os arquivos de `skills/` são os *templates* (o *como*).
- **Princípios:** [../constitution.md](../constitution.md) — as `rules/` são os artigos.
- **Fonte original:** `IniciandoBackEndMarkup.md` (prompt consolidado — **arquivado no histórico git** após a segmentação; esta base é a fonte de verdade)
- **Fonte de verdade do domínio:** `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`
- **Gerado em:** 2026-07-31

## Rules — o que sempre/nunca fazer

| Arquivo | Regra |
|---------|-------|
| [rules/R01-calculo-no-backend.md](rules/R01-calculo-no-backend.md) | Todo cálculo de precificação vive no backend; o front só exibe |
| [rules/R02-isolamento-multiempresa.md](rules/R02-isolamento-multiempresa.md) | Toda query filtra por `empresa_id` obtido do JWT |
| [rules/R03-divisor-markup-positivo.md](rules/R03-divisor-markup-positivo.md) | `divisorMarkup <= 0` → erro; nunca preço ≤ 0 |
| [rules/R04-separacao-camadas.md](rules/R04-separacao-camadas.md) | domain = tipos, service = regra, resolver = orquestração |
| [rules/R05-autorizacao-rbac.md](rules/R05-autorizacao-rbac.md) | Verificar permissão via claims JWT no início de cada resolver |
| [rules/R06-arquivos-gerados-nao-editar.md](rules/R06-arquivos-gerados-nao-editar.md) | `generated.go` e `models_gen.go` nunca são editados à mão |
| [rules/R07-fora-do-backend.md](rules/R07-fora-do-backend.md) | Formatação, ordenação de UI e estado de tela ficam no front |

## Skills — como fazer (procedimentos)

| Skill | Descrição |
|-------|-----------|
| [skills/formula-markup-divisor](skills/formula-markup-divisor/SKILL.md) | A fórmula do Markup por Divisor e seus componentes |
| [skills/resolver-precificacao-go](skills/resolver-precificacao-go/SKILL.md) | Implementar o resolver `PrecificarProduto` em Go |
| [skills/schema-graphql-markup](skills/schema-graphql-markup/SKILL.md) | Schema GraphQL: tipos, enums, queries, mutations, inputs |
| [skills/modelagem-der-markup](skills/modelagem-der-markup/SKILL.md) | Modelagem de dados (DER v3 — RBAC corporativo) |
| [skills/auth-jwt-gin](skills/auth-jwt-gin/SKILL.md) | Autenticação JWT com Gin + estrutura de claims |
| [skills/rbac-permissoes](skills/rbac-permissoes/SKILL.md) | Permissões granulares, perfis padrão e proteção de resolvers |
| [skills/estrutura-projeto-go](skills/estrutura-projeto-go/SKILL.md) | Layout de pastas Go e fluxo `gqlgen generate` |
| [skills/seed-dados-iniciais](skills/seed-dados-iniciais/SKILL.md) | Seed de impostos, permissões, perfis e admin inicial |
