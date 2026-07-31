# Rule R06 — Não editar arquivos gerados pelo gqlgen

**Categoria:** Fluxo de código / gqlgen
**Origem:** IniciandoBackEndMarkup.md §8

## Regra

Os arquivos gerados pelo gqlgen **nunca** são editados à mão:

- `graph/generated.go` — gerado (NÃO editar)
- `graph/model/models_gen.go` — gerado (NÃO editar)

O que se edita:

- `graph/schema.graphqls` — o schema (fonte)
- `graph/schema.resolvers.go` — implementação dos resolvers

Fluxo correto:

```bash
# 1. Editar graph/schema.graphqls
# 2. Regenerar
go tool gqlgen generate
# 3. Implementar os métodos em schema.resolvers.go (chamando services)
```

## Por quê

Qualquer edição manual em arquivos gerados é sobrescrita no próximo
`gqlgen generate`. A fonte de verdade do contrato é o `schema.graphqls`. Ver
[[estrutura-projeto-go]] e [[schema-graphql-markup]].
