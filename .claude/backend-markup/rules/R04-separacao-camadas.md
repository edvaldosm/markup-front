# Rule R04 — Separação de camadas (domain / repository / service / controller)

**Categoria:** Arquitetura
**Origem:** IniciandoBackEndMarkup.md §8 (adaptado para Spring Boot)

## Regra

Cada camada tem responsabilidade única e não invade a da outra:

| Camada | Faz | NÃO faz |
|--------|-----|---------|
| `domain/` (entidades JPA) | Definir `@Entity` com relações e colunas | Nenhuma regra de negócio |
| `repository/` (Spring Data) | Consultas (`JpaRepository`, `@Query`) | Regra de negócio ou HTTP |
| `service/` | Toda regra: cálculos, validações, orquestração de repos | Nada de GraphQL/HTTP/segurança de transporte |
| `controller/` (`@Controller` GraphQL) | Mapear queries/mutations, aplicar RBAC, chamar o service | Sem cálculos — apenas orquestração |

- Controllers GraphQL são **finos**: validam permissão → chamam o service.
- O cálculo da fórmula Markup vive **só** no `PrecificacaoService`.
- A regra do assistente/RAG vive em `AssistenteService` (ver [[R08-assistente-escopo-guardrails]]).

## Por quê

Mantém a regra de negócio testável e isolada do transporte (GraphQL/HTTP/JWT),
evita duplicação de cálculo. Ver [[estrutura-projeto-spring]].
