---
name: auth-jwt-gin
description: Autenticação JWT com Gin (gin-jwt v3) e estrutura de claims do backend Markup. Use ao configurar login/refresh, middleware de auth ou o formato do token.
metadata:
  domain: backend-markup
  kind: skill
  origin: IniciandoBackEndMarkup.md §7
---

# Autenticação JWT com Gin

## Fluxo

- Login via `POST /login` (handler do gin-jwt) → retorna `{ token, expire }`.
- O front envia `Authorization: Bearer <token>` a cada request GraphQL.
- Refresh via `POST /refresh` — sem re-login.
- Expiração: 8h (access) / 24h (refresh).

## Claims obrigatórios no token

O JWT deve conter: `id` (usuario_id), `empresa_id`, `role` e `permissoes`
(slice de chaves). O `empresa_id` é usado para isolamento de dados em todos os
resolvers ([[R02-isolamento-multiempresa]]).

```json
{
  "id":         "uuid-do-usuario",
  "empresa_id": "uuid-da-empresa",
  "role":       "ADMIN",
  "permissoes": ["PRODUTO_READ", "PRODUTO_WRITE", "RELATORIO_READ"],
  "exp":        1751234567,
  "orig_iat":   1751198167
}
```

> As permissões são carregadas no login (via `PayloadFunc` do gin-jwt) e viajam
> no JWT — sem consulta ao banco a cada request.

## Rotas públicas vs protegidas

```go
r.POST("/login",   auth.LoginHandler)   // público
r.POST("/refresh", auth.RefreshHandler) // público

api := r.Group("/", auth.MiddlewareFunc()) // tudo aqui exige token
{
    api.POST("/query", GraphQLHandler(db)) // único endpoint GraphQL
}
```

Setup do middleware: `internal/auth/middleware.go`.
Uso dos claims na autorização: [[rbac-permissoes]] e [[R05-autorizacao-rbac]].
