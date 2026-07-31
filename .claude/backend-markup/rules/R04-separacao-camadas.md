# Rule R04 — Separação de camadas (domain / service / resolver)

**Categoria:** Arquitetura
**Origem:** IniciandoBackEndMarkup.md §8

## Regra

Cada camada tem responsabilidade única e não invade a da outra:

| Camada | Faz | NÃO faz |
|--------|-----|---------|
| `domain/` | Definir structs GORM com tags (`primaryKey`, `foreignKey`, `json`) | Nenhuma lógica — só tipos |
| `service/` | Toda regra de negócio: cálculos, validações, consultas GORM | Nada de HTTP, GraphQL ou JWT |
| `graph/` (resolvers) | Extrair claims do JWT, verificar permissão, chamar o service | Sem cálculos — apenas orquestração |

- Resolvers são **thin**: validam permissão → chamam o service correto.
- O cálculo da fórmula Markup vive **só** no `precificacao_service.go`.

## Por quê

Mantém a regra de negócio testável e isolada de detalhes de transporte
(HTTP/GraphQL/JWT), e evita duplicação de cálculo. Ver
[[estrutura-projeto-go]].
