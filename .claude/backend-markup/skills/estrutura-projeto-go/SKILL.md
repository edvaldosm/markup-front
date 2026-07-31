---
name: estrutura-projeto-go
description: Layout de pastas do backend Markup em Go (Gin + gqlgen + GORM) e fluxo de geração de código. Use ao criar o projeto, adicionar services/resolvers ou regenerar o schema.
metadata:
  domain: backend-markup
  kind: skill
  origin: IniciandoBackEndMarkup.md §2, §8
---

# Estrutura de projeto (Go)

## Stack

- **Linguagem:** Go 1.26+
- **HTTP:** Gin (`github.com/gin-gonic/gin`)
- **GraphQL:** gqlgen (`github.com/99designs/gqlgen`) — schema-first
- **ORM:** GORM (`gorm.io/gorm`) + driver PostgreSQL
- **Auth/JWT:** `github.com/appleboy/gin-jwt/v3` + `golang.org/x/crypto/bcrypt` + `github.com/golang-jwt/jwt/v5`

```bash
go get github.com/gin-gonic/gin
go get github.com/99designs/gqlgen
go get github.com/appleboy/gin-jwt/v3
go get golang.org/x/crypto/bcrypt
go get gorm.io/gorm gorm.io/driver/postgres
go get github.com/golang-jwt/jwt/v5
```

## Layout

```text
markup-backend/
├── cmd/server/main.go                  ← entrypoint: Gin + gqlgen + JWT
├── graph/
│   ├── schema.graphqls                 ← schema (você edita)
│   ├── generated.go                    ← gerado (NÃO editar)
│   ├── model/models_gen.go             ← gerado (NÃO editar)
│   ├── resolver.go                     ← struct Resolver{...services}
│   └── schema.resolvers.go             ← thin resolvers
├── internal/
│   ├── auth/middleware.go              ← setup gin-jwt (PayloadFunc, claims)
│   ├── database/database.go            ← conexão GORM + AutoMigrate
│   ├── domain/                         ← structs GORM (1 arquivo por entidade)
│   │   ├── empresa.go  despesa_fixa.go  material.go  produto.go
│   │   ├── produto_material.go  imposto.go  produto_imposto.go
│   │   └── usuario.go  perfil.go  permissao.go  usuario_empresa.go
│   └── service/                        ← regra de negócio (1 arquivo por agregado)
│       ├── empresa_service.go          ← BuscarEmpresa, AtualizarEmpresa, %DF
│       ├── despesa_service.go  material_service.go  imposto_service.go
│       ├── produto_service.go          ← Listar, Salvar, Remover, Toggle, CP
│       ├── precificacao_service.go     ← fórmula Markup
│       └── usuario_service.go  perfil_service.go
├── gqlgen.yml
└── go.mod
```

## Responsabilidade por camada

Ver [[R04-separacao-camadas]]: `domain/` = tipos, `service/` = regra,
`graph/` = orquestração (extrai claims, valida permissão, chama service).

```go
// graph/resolver.go
type Resolver struct {
    EmpresaService      *service.EmpresaService
    DespesaService      *service.DespesaService
    MaterialService     *service.MaterialService
    ImpostoService      *service.ImpostoService
    ProdutoService      *service.ProdutoService
    PrecificacaoService *service.PrecificacaoService
    UsuarioService      *service.UsuarioService
    PerfilService       *service.PerfilService
}
```

## Fluxo de geração de código

```bash
# 1. Editar graph/schema.graphqls
# 2. Regenerar
go tool gqlgen generate
# 3. Implementar os métodos em schema.resolvers.go (chamando services)
```

Ver [[R06-arquivos-gerados-nao-editar]] e [[schema-graphql-markup]].
