# 10 — Fronteiras de Responsabilidade

> Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

## O que fica no backend

| Responsabilidade | Onde | Motivo |
|-----------------|------|--------|
| Fórmula Markup (PV, CP, %DF, Divisor) | `precificacao_service.go` | Fonte única de verdade para todos os clientes |
| Validação de permissões RBAC | Início de cada resolver | Segurança não pode depender do frontend |
| Isolamento por empresa | Todos os services (filtro `empresa_id`) | Impede vazamento de dados entre empresas |
| Hash de senha | `bcrypt` no `usuario_service.go` | Senha nunca trafega em texto |
| Geração do JWT com claims | `auth/middleware.go` — `PayloadFunc` | Centraliza o que está no token |
| Validação do JWT | `gin-jwt` — `MiddlewareFunc` | Automático em todas as rotas protegidas |

---

## O que NÃO vai para o backend

| Responsabilidade | Onde fica | Motivo |
|-----------------|-----------|--------|
| Formatação de moeda (R$) | Frontend — `Intl.NumberFormat` | Varia por locale do usuário |
| Formatação de percentual | Frontend | Idem |
| Ordenação e filtragem de listas na UI | Frontend (local, após receber dados) | Evita roundtrips desnecessários |
| Lógica de estado da interface | Frontend (Pinia) | `loading`, `modal aberto`, `tab ativa` são estado de UI |
| Arredondamento do PV para exibição | Frontend | R$ 26,37 → R$ 26,50 é decisão visual |

---

## Regras de ouro

1. **Resolver não calcula** — só extrai claims, verifica permissão e chama service
2. **Service não conhece HTTP** — sem `*gin.Context`, sem `jwt.ExtractClaims` — recebe apenas dados
3. **Domain não tem lógica** — só `struct` + tags GORM/JSON
4. **Divisor Markup ≤ 0 = error** — nunca retornar preço negativo ou zero ao frontend
5. **% DF sempre dinâmico** — nunca fixar no produto; sempre calcular via rateio no momento da consulta
6. **Toda query filtra por `empresa_id`** — sem exceção; vem sempre do JWT, nunca do body da request
