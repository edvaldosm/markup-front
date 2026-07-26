# 03 — Estrutura de Projeto (Go)

> Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

## Árvore de pastas

```text
markup-backend/
├── cmd/
│   └── server/
│       └── main.go                        ← entrypoint: Gin + gqlgen + JWT
│
├── graph/                                 ← camada GraphQL (gerado + resolvers)
│   ├── schema.graphqls                    ← schema GraphQL (você edita)
│   ├── generated.go                       ← gerado pelo gqlgen (NÃO editar)
│   ├── model/
│   │   └── models_gen.go                  ← gerado pelo gqlgen (NÃO editar)
│   ├── resolver.go                        ← struct Resolver{...services}
│   └── schema.resolvers.go               ← thin resolvers: valida permissão → chama service
│
├── internal/
│   ├── auth/
│   │   └── middleware.go                  ← setup do gin-jwt (PayloadFunc, claims)
│   │
│   ├── database/
│   │   └── database.go                    ← conexão GORM + AutoMigrate
│   │
│   ├── domain/                            ← entidades GORM — 1 arquivo por entidade
│   │   ├── empresa.go
│   │   ├── despesa_fixa.go
│   │   ├── material.go
│   │   ├── produto.go
│   │   ├── produto_material.go            ← ficha técnica (N:M produto ↔ material)
│   │   ├── imposto.go
│   │   ├── produto_imposto.go             ← N:M produto ↔ imposto com alíquota override
│   │   ├── usuario.go
│   │   ├── perfil.go
│   │   ├── permissao.go
│   │   └── usuario_empresa.go             ← N:M usuário ↔ empresa ↔ perfil
│   │
│   └── service/                           ← regras de negócio — 1 arquivo por agregado
│       ├── empresa_service.go             ← ListarEmpresas, BuscarEmpresa, CriarEmpresa, AtualizarEmpresa, %DF, FatorR
│       ├── despesa_service.go             ← Listar, Salvar, Remover, Toggle
│       ├── material_service.go            ← Listar, Salvar, Remover
│       ├── imposto_service.go             ← Listar, Salvar, Toggle
│       ├── produto_service.go             ← Listar, Salvar, Remover, Toggle, CP
│       ├── precificacao_service.go        ← PrecificarProduto, PrecificarTodos (fórmula Markup)
│       ├── usuario_service.go             ← Convidar, AlterarPerfil, Toggle
│       └── perfil_service.go             ← Listar, Salvar, AtribuirPermissao
│
├── gqlgen.yml
└── go.mod
```

---

## Responsabilidade de cada camada

| Camada | Responsabilidade | O que NÃO faz |
|--------|-----------------|---------------|
| `domain/` | Definir structs GORM com tags (`primaryKey`, `foreignKey`, `json`) | Nenhuma lógica — só tipos |
| `service/` | Toda regra de negócio: cálculos, validações, consultas GORM | Nada de HTTP, GraphQL ou JWT |
| `graph/` (resolvers) | Extrair claims do JWT, verificar permissão, chamar o service correto | Sem cálculos — apenas orquestração |

---

## Injeção de dependências — struct Resolver

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

---

## Fluxo de geração de código (gqlgen)

```bash
# 1. Editar graph/schema.graphqls
# 2. Regenerar código Go
go tool gqlgen generate
# 3. Implementar os métodos em schema.resolvers.go (chamando services)
```

> Nunca editar `generated.go` nem `models_gen.go` — são sobrescritos a cada `generate`.

---

## Padrão de um arquivo de domínio

```go
// internal/domain/produto.go
package domain

type Produto struct {
    ID          string           `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    EmpresaID   string           `gorm:"type:uuid;not null;index"                       json:"empresa_id"`
    Nome        string           `gorm:"not null"                                       json:"nome"`
    Descricao   *string          `                                                      json:"descricao,omitempty"`
    Categoria   *string          `                                                      json:"categoria,omitempty"`
    Tipo        string           `gorm:"default:'PRODUTO'"                              json:"tipo"` // PRODUTO | SERVICO
    MargemLucro float64          `gorm:"not null"                                       json:"margem_lucro"`
    DescontoMax float64          `gorm:"not null"                                       json:"desconto_maximo"`
    Ativo       bool             `gorm:"default:true"                                   json:"ativo"`
    Materiais   []ProdutoMaterial `gorm:"foreignKey:ProdutoID"                          json:"materiais"`
    Impostos    []ProdutoImposto  `gorm:"foreignKey:ProdutoID"                          json:"impostos"`
}
```

---

## Padrão de um service

```go
// internal/service/precificacao_service.go
type PrecificacaoService struct {
    DB *gorm.DB
}

func (s *PrecificacaoService) PrecificarProduto(produtoID, empresaID string) (*ResultadoPrecificacao, error) {
    // toda a lógica da fórmula Markup fica aqui
}

// graph/schema.resolvers.go — thin resolver
func (r *queryResolver) PrecificarProduto(ctx context.Context, produtoID string) (*model.ResultadoPrecificacao, error) {
    ginCtx  := ctx.Value("GinContextKey").(*gin.Context)
    claims  := jwt.ExtractClaims(ginCtx)
    if !contemPermissao(claims, "RELATORIO_READ") {
        return nil, fmt.Errorf("acesso negado")
    }
    empresaID := claims["empresa_id"].(string)
    return r.PrecificacaoService.PrecificarProduto(produtoID, empresaID)
}
```
