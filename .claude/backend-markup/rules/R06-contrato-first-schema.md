# Rule R06 — Contrato-first: o schema GraphQL é a fonte de verdade

**Categoria:** Contrato / Spring for GraphQL
**Origem:** IniciandoBackEndMarkup.md §8 (adaptado para Spring for GraphQL)

## Regra

O contrato da API é definido **primeiro** no schema GraphQL; o código Java segue
o schema, nunca o contrário.

- Schema em `src/main/resources/graphql/*.graphqls` (schema-first).
- Cada `type`/`query`/`mutation` do schema tem um `@Controller`/`@SchemaMapping`
  ou `@QueryMapping`/`@MutationMapping` correspondente.
- Mudança de contrato = editar o `.graphqls` **primeiro**, depois ajustar
  controllers/DTOs. O front (tipos em `src/types`) deve espelhar o mesmo schema
  (Artigo III da Constituição).

## Por quê

Um contrato único e versionado mantém front e back sincronizados e evita drift
entre o que a API promete e o que entrega. Ver [[schema-graphql-markup]] e
[[estrutura-projeto-spring]].
