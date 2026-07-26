# 02 — Stack e Dependências

> Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

## Stack do backend

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | Go 1.22+ |
| Framework HTTP | Gin (`github.com/gin-gonic/gin`) |
| GraphQL | gqlgen (`github.com/99designs/gqlgen`) — schema-first + geração de código |
| ORM | GORM (`gorm.io/gorm`) com driver PostgreSQL |
| Banco de dados | PostgreSQL |
| Autenticação/JWT | `github.com/appleboy/gin-jwt/v3` + `golang.org/x/crypto/bcrypt` |
| Autorização | RBAC via claims no JWT + verificação manual nos resolvers |

---

## Instalação das dependências

```bash
go mod init github.com/seu-usuario/markup-backend

go get github.com/gin-gonic/gin
go get github.com/99designs/gqlgen
go get github.com/appleboy/gin-jwt/v3
go get golang.org/x/crypto/bcrypt
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/golang-jwt/jwt/v5
```

---

## Variáveis de ambiente necessárias

```env
# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=markup

# JWT
JWT_SECRET=sua_chave_secreta_minimo_32_caracteres

# Servidor
GIN_MODE=debug        # ou release em produção
PORT=8080
```

---

## Endpoint GraphQL

O frontend já aponta para:

```typescript
// src/graphql/client.ts
export const GQL_ENDPOINT = import.meta.env.VITE_GQL_ENDPOINT ?? 'http://localhost:8080/graphql'
```

Configurar no `.env` do frontend:

```env
VITE_GQL_ENDPOINT=http://localhost:8080/graphql
```

> **Tipagem (obrigatória):** o frontend precisa de `src/vite-env.d.ts` declarando a variável, senão o TypeScript acusa `Property 'env' does not exist on type 'ImportMeta'`:
>
> ```typescript
> /// <reference types="vite/client" />
> interface ImportMetaEnv { readonly VITE_GQL_ENDPOINT: string }
> interface ImportMeta { readonly env: ImportMetaEnv }
> ```

**Todas as requests GraphQL:**

```
POST http://localhost:8080/graphql
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "...",
  "variables": { ... }
}
```
