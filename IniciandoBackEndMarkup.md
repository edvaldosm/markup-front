# Prompt — Iniciando Backend Markup

> **Objetivo:** Implementar o backend do sistema de precificação estratégica **Markup por Divisor**,
> expondo uma API **GraphQL** completa com todos os cálculos centralizados no servidor.
> O frontend (Vue 3 + Apollo Client) não executará nenhum cálculo de precificação — ele apenas
> exibe os resultados retornados pela API.

---

## 1. Contexto de negócio

### Domínio: Precificação por Markup Divisor

O sistema calcula o **Preço de Venda (PV)** de produtos usando a fórmula:

```
PV = CP / (1 - (Impostos + DF + ML + D) / 100)
```

| Símbolo | Significado                                  |
|---------|----------------------------------------------|
| PV      | Preço de Venda Final                         |
| CP      | Custo Base do Produto (R$) — soma dos insumos |
| Impostos| Soma das alíquotas de impostos do produto (%) |
| DF      | % Despesas Fixas = Total DF Mensal / Faturamento Médio Mensal × 100 |
| ML      | Margem de Lucro Líquido (%) — definida por produto |
| D       | Desconto Máximo Previsto (%) — definido por produto |

O denominador `1 - (soma / 100)` é o **Divisor Markup**.

### Cálculos que DEVEM sair do frontend e ir para o backend

| Cálculo | Lógica atual no front (`useMarkup.ts`) | Onde vai no backend |
|---------|---------------------------------------|---------------------|
| Custo Base (CP) | `SUM(quantidade_utilizada × custo_unitario)` por produto | Query `precificarProduto` ou campo resolvido em `Produto` |
| % Despesas Fixas (DF) | `SUM(despesas_ativas.valor_mensal) / faturamento_medio_mensal × 100` | Resolver em `Empresa` ou Query dedicada |
| % Impostos total | `SUM(aliquota_percentual)` dos impostos do produto | Campo resolvido em `Produto` |
| Divisor Markup | `1 - soma_percentuais / 100` | Calculado dentro do resolver de precificação |
| Preço de Venda | `CP / divisor_markup` | Query `precificarProduto` |
| Breakdown do PV | Decomposição por componente (impostos, DF, lucro, desconto) | Tipo `ResultadoPrecificacao` na resposta |

---

## 2. Stack esperada do backend

- **Linguagem:** Go 1.26+
- **Framework HTTP:** Gin (`github.com/gin-gonic/gin`)
- **GraphQL:** gqlgen (`github.com/99designs/gqlgen`) — schema-first + geração de código
- **ORM:** GORM (`gorm.io/gorm`) com driver PostgreSQL
- **Banco de dados:** PostgreSQL
- **Autenticação/JWT:** `github.com/appleboy/gin-jwt/v3` + `golang.org/x/crypto/bcrypt`
- **Autorização:** RBAC via claims no JWT + verificação manual de permissões nos resolvers

**Dependências principais:**

```bash
go get github.com/gin-gonic/gin
go get github.com/99designs/gqlgen
go get github.com/appleboy/gin-jwt/v3
go get golang.org/x/crypto/bcrypt
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/golang-jwt/jwt/v5
```

---

## 3. Modelagem de dados (DER v3 — RBAC Corporativo)

### Entidades e responsabilidades

```
EMPRESA
  ├── id (UUID)
  ├── razao_social
  ├── cnpj
  ├── regime_tributario  (SIMPLES_NACIONAL | LUCRO_PRESUMIDO | LUCRO_REAL | MEI)
  ├── anexo_simples      (ANEXO_I | ANEXO_II | ANEXO_III | ANEXO_IV | ANEXO_V) [nullable]
  └── faturamento_medio_mensal  ← divisor do rateio de DF

DESPESA_FIXA
  ├── id (UUID)
  ├── empresa_id → EMPRESA
  ├── descricao
  ├── valor_mensal
  ├── categoria  (ALUGUEL | ENERGIA | GAS | INTERNET | PROLABORE | CONTADOR | OUTRO)
  └── ativa

MATERIAL
  ├── id (UUID)
  ├── empresa_id → EMPRESA
  ├── nome
  ├── unidade  (KG | G | L | ML | UN | CX | PCT)
  ├── custo_unitario
  ├── fornecedor [nullable]
  └── estoque   [nullable]

PRODUTO
  ├── id (UUID)
  ├── empresa_id → EMPRESA
  ├── nome
  ├── descricao  [nullable]
  ├── categoria  [nullable]
  ├── margem_lucro      (%)
  ├── desconto_maximo   (%)
  └── ativo

PRODUTO_MATERIAL  (ficha técnica N:M)
  ├── produto_id → PRODUTO
  ├── material_id → MATERIAL
  └── quantidade_utilizada

IMPOSTO  (dicionário global)
  ├── id (UUID)
  ├── nome
  ├── chave  (ex: SIMPLES_NACIONAL_ANEXO_II)
  ├── aliquota_percentual
  ├── descricao
  └── ativo

PRODUTO_IMPOSTO  (N:M produto ↔ imposto com alíquota override)
  ├── produto_id → PRODUTO
  ├── imposto_id → IMPOSTO
  └── aliquota_percentual  ← pode diferir do dicionário

USUARIO
  ├── id (UUID)
  ├── nome
  ├── email  (único)
  ├── senha_hash
  └── ativo

PERFIL  (Role)
  ├── id (UUID)
  ├── nome   (ADMIN | GERENTE | VENDEDOR | CONTADOR | LEITURA)
  └── descricao

PERMISSAO  (Privilege granular)
  ├── id (UUID)
  ├── chave   (ver seção 6)
  ├── descricao
  └── modulo

PERFIL_PERMISSAO  (N:M)
  ├── perfil_id → PERFIL
  └── permissao_id → PERMISSAO

USUARIO_EMPRESA  (N:M — usuário pode estar em várias empresas com perfis diferentes)
  ├── usuario_id → USUARIO
  ├── empresa_id → EMPRESA
  └── perfil_id → PERFIL
```

**Regra de isolamento:** toda query deve filtrar por `empresa_id` obtido do JWT do usuário autenticado via `USUARIO_EMPRESA`.

---

## 4. Schema GraphQL

### Tipos principais

```graphql
type Empresa {
  id: ID!
  razaoSocial: String!
  cnpj: String!
  regimeTributario: RegimeTributario!
  anexoSimples: AnexoSimples
  faturamentoMedioMensal: Float!
  percentualDespesasFixas: Float!   # calculado: SUM(despesas_ativas) / faturamento × 100
  despesasFixas: [DespesaFixa!]!
  produtos: [Produto!]!
  materiais: [Material!]!
}

type DespesaFixa {
  id: ID!
  descricao: String!
  valorMensal: Float!
  categoria: CategoriaDespesa!
  ativa: Boolean!
}

type Material {
  id: ID!
  nome: String!
  unidade: UnidadeMedida!
  custoUnitario: Float!
  fornecedor: String
  estoque: Float
}

type Imposto {
  id: ID!
  nome: String!
  chave: String!
  aliquotaPercentual: Float!
  descricao: String!
  ativo: Boolean!
}

type ProdutoMaterial {
  material: Material!
  quantidadeUtilizada: Float!
}

type ProdutoImposto {
  imposto: Imposto!
  aliquotaPercentual: Float!
}

type Produto {
  id: ID!
  nome: String!
  descricao: String
  categoria: String
  margemLucro: Float!
  descontoMaximo: Float!
  ativo: Boolean!
  materiais: [ProdutoMaterial!]!
  impostos: [ProdutoImposto!]!
  custoBase: Float!             # calculado: SUM(qtd × custo_unitario)
  percentualImpostos: Float!    # calculado: SUM(aliquota_percentual)
}

type ResultadoPrecificacao {
  produto: Produto!
  custoBase: Float!
  percentualImpostos: Float!
  percentualDespesasFixas: Float!
  percentualMargemLucro: Float!
  percentualDesconto: Float!
  somaTotalPercentuais: Float!
  divisorMarkup: Float!
  precoVenda: Float!
  breakdown: BreakdownPrecificacao!
}

type BreakdownPrecificacao {
  custoRecuperado: Float!
  valorImpostos: Float!
  valorDespesasFixas: Float!
  valorDesconto: Float!
  lucroLiquido: Float!
}

# ─── RBAC ─────────────────────────────────────────────────────────────────────

type Permissao {
  id: ID!
  chave: String!
  descricao: String!
  modulo: String!
}

type Perfil {
  id: ID!
  nome: String!
  descricao: String!
  permissoes: [Permissao!]!
}

type Usuario {
  id: ID!
  nome: String!
  email: String!
  ativo: Boolean!
  empresas: [UsuarioEmpresa!]!
}

type UsuarioEmpresa {
  empresa: Empresa!
  perfil: Perfil!
}

# ─── Auth ─────────────────────────────────────────────────────────────────────

type AuthPayload {
  token: String!
  usuario: Usuario!
  empresa: Empresa!
  perfil: Perfil!
}
```

### Enums

```graphql
enum RegimeTributario {
  SIMPLES_NACIONAL
  LUCRO_PRESUMIDO
  LUCRO_REAL
  MEI
}

enum AnexoSimples {
  ANEXO_I
  ANEXO_II
  ANEXO_III
  ANEXO_IV
  ANEXO_V
}

enum CategoriaDespesa {
  ALUGUEL
  ENERGIA
  GAS
  INTERNET
  PROLABORE
  CONTADOR
  OUTRO
}

enum UnidadeMedida {
  KG
  G
  L
  ML
  UN
  CX
  PCT
}
```

### Queries

```graphql
type Query {
  # Auth / contexto
  me: Usuario!

  # Empresa (isolada pelo JWT)
  minhaEmpresa: Empresa!

  # Despesas
  despesasFixas: [DespesaFixa!]!

  # Materiais
  materiais: [Material!]!
  material(id: ID!): Material

  # Impostos (dicionário global)
  impostos: [Imposto!]!

  # Produtos
  produtos: [Produto!]!
  produto(id: ID!): Produto

  # Precificação — cálculo centralizado no backend
  precificarProduto(produtoId: ID!): ResultadoPrecificacao!
  precificarTodos: [ResultadoPrecificacao!]!

  # RBAC
  perfis: [Perfil!]!
  permissoes: [Permissao!]!
  usuarios: [Usuario!]!
}
```

### Mutations

```graphql
type Mutation {
  # Auth
  login(email: String!, senha: String!): AuthPayload!

  # Empresa
  atualizarEmpresa(input: EmpresaInput!): Empresa!

  # Despesas
  salvarDespesaFixa(input: DespesaFixaInput!): DespesaFixa!
  removerDespesaFixa(id: ID!): Boolean!
  toggleDespesaFixa(id: ID!, ativa: Boolean!): DespesaFixa!

  # Materiais
  salvarMaterial(input: MaterialInput!): Material!
  removerMaterial(id: ID!): Boolean!

  # Impostos
  salvarImposto(input: ImpostoInput!): Imposto!
  toggleImposto(id: ID!, ativo: Boolean!): Imposto!

  # Produtos
  salvarProduto(input: ProdutoInput!): Produto!
  removerProduto(id: ID!): Boolean!
  toggleProduto(id: ID!, ativo: Boolean!): Produto!

  # RBAC
  salvarPerfil(input: PerfilInput!): Perfil!
  atribuirPermissaoAoPerfil(perfilId: ID!, permissaoId: ID!): Perfil!
  revogarPermissaoDoPerfil(perfilId: ID!, permissaoId: ID!): Perfil!
  convidarUsuario(input: ConviteUsuarioInput!): Usuario!
  alterarPerfilUsuario(usuarioEmpresaId: ID!, perfilId: ID!): UsuarioEmpresa!
  toggleUsuario(id: ID!, ativo: Boolean!): Usuario!
}
```

### Inputs

```graphql
input EmpresaInput {
  razaoSocial: String!
  cnpj: String!
  regimeTributario: RegimeTributario!
  anexoSimples: AnexoSimples
  faturamentoMedioMensal: Float!
}

input DespesaFixaInput {
  id: ID          # null = criar, preenchido = editar
  descricao: String!
  valorMensal: Float!
  categoria: CategoriaDespesa!
  ativa: Boolean!
}

input MaterialInput {
  id: ID
  nome: String!
  unidade: UnidadeMedida!
  custoUnitario: Float!
  fornecedor: String
  estoque: Float
}

input ImpostoInput {
  id: ID
  nome: String!
  chave: String!
  aliquotaPercentual: Float!
  descricao: String!
}

input ProdutoMaterialInput {
  materialId: ID!
  quantidadeUtilizada: Float!
}

input ProdutoImpostoInput {
  impostoId: ID!
  aliquotaPercentual: Float!
}

input ProdutoInput {
  id: ID
  nome: String!
  descricao: String
  categoria: String
  margemLucro: Float!
  descontoMaximo: Float!
  materiais: [ProdutoMaterialInput!]!
  impostos: [ProdutoImpostoInput!]!
}

input PerfilInput {
  id: ID
  nome: String!
  descricao: String!
}

input ConviteUsuarioInput {
  nome: String!
  email: String!
  senha: String!
  perfilId: ID!
}
```

---

## 5. Lógica de cálculo — Resolvers do backend (Go)

Os resolvers abaixo devem ser implementados no backend. **Nenhum desses cálculos deve existir no frontend.**

### 5.1 Custo Base do Produto (CP)

```
CP = SUM(pm.quantidade_utilizada × m.custo_unitario)
     para cada PRODUTO_MATERIAL do produto
```

- Resolver em: campo `custoBase` no tipo `Produto` (gqlgen field resolver)
- GORM: `db.Model(&produto).Association("Materiais").Find(&materiais)`

### 5.2 Percentual de Despesas Fixas (% DF)

```
% DF = SUM(df.valor_mensal) / empresa.faturamento_medio_mensal × 100
       apenas despesas com df.ativa = true
```

- Resolver em: campo `percentualDespesasFixas` no tipo `Empresa`
- Deve refletir o estado atual das despesas — calculado dinamicamente

### 5.3 Percentual Total de Impostos do Produto

```
% Impostos = SUM(pi.aliquota_percentual)
             para cada PRODUTO_IMPOSTO do produto
```

- Resolver em: campo `percentualImpostos` no tipo `Produto`

### 5.4 Precificação Completa — Query `precificarProduto` (Go)

```go
func (r *queryResolver) PrecificarProduto(ctx context.Context, produtoID string) (*model.ResultadoPrecificacao, error) {
    var produto Produto
    r.DB.Preload("Materiais.Material").Preload("Impostos").First(&produto, "id = ?", produtoID)

    var empresa Empresa
    r.DB.First(&empresa, "id = ?", produto.EmpresaID)

    // CP: soma dos insumos
    var cp float64
    for _, pm := range produto.Materiais {
        cp += pm.QuantidadeUtilizada * pm.Material.CustoUnitario
    }

    // % Impostos
    var pctImpostos float64
    for _, pi := range produto.Impostos {
        pctImpostos += pi.AliquotaPercentual
    }

    // % DF: rateio dinâmico
    var totalDF float64
    r.DB.Model(&DespesaFixa{}).Where("empresa_id = ? AND ativa = true", empresa.ID).
        Select("COALESCE(SUM(valor_mensal), 0)").Scan(&totalDF)

    var pctDF float64
    if empresa.FaturamentoMedioMensal > 0 {
        pctDF = (totalDF / empresa.FaturamentoMedioMensal) * 100
    }

    pctML := produto.MargemLucro
    pctD  := produto.DescontoMaximo

    soma          := pctImpostos + pctDF + pctML + pctD
    divisorMarkup := 1.0 - (soma / 100.0)

    if divisorMarkup <= 0 {
        return nil, fmt.Errorf("soma de percentuais (%.1f%%) inviabiliza o preço — reduza margens ou impostos", soma)
    }

    pv := cp / divisorMarkup

    return &model.ResultadoPrecificacao{
        CustoBase:                cp,
        PercentualImpostos:       pctImpostos,
        PercentualDespesasFixas:  pctDF,
        PercentualMargemLucro:    pctML,
        PercentualDesconto:       pctD,
        SomaTotalPercentuais:     soma,
        DivisorMarkup:            divisorMarkup,
        PrecoVenda:               pv,
        Breakdown: &model.BreakdownPrecificacao{
            CustoRecuperado:    cp,
            ValorImpostos:      pv * (pctImpostos / 100),
            ValorDespesasFixas: pv * (pctDF / 100),
            ValorDesconto:      pv * (pctD / 100),
            LucroLiquido:       pv * (pctML / 100),
        },
    }, nil
}
```

**Regra crítica:** se `divisorMarkup <= 0`, retornar `error` — nunca retornar preço negativo ou zero.

---

## 6. RBAC — Permissões granulares

### Chaves de permissão

| Chave              | Ação                                      |
|--------------------|-------------------------------------------|
| `PRODUTO_READ`     | Visualizar produtos e fichas técnicas     |
| `PRODUTO_WRITE`    | Criar e editar produtos                   |
| `MATERIAL_READ`    | Visualizar materiais/insumos              |
| `MATERIAL_WRITE`   | Criar e editar materiais                  |
| `DESPESA_READ`     | Visualizar despesas fixas                 |
| `DESPESA_WRITE`    | Cadastrar e editar despesas fixas         |
| `IMPOSTO_READ`     | Visualizar impostos                       |
| `IMPOSTO_WRITE`    | Alterar alíquotas de impostos             |
| `RELATORIO_READ`   | Gerar e visualizar relatórios             |
| `USUARIO_READ`     | Visualizar usuários                       |
| `USUARIO_WRITE`    | Convidar e editar usuários                |
| `EMPRESA_READ`     | Visualizar dados da empresa               |
| `EMPRESA_WRITE`    | Editar dados da empresa                   |
| `PERFIL_READ`      | Visualizar perfis                         |
| `PERFIL_WRITE`     | Criar e editar perfis e permissões        |

### Perfis padrão sugeridos

| Perfil     | Permissões principais                                         |
|------------|---------------------------------------------------------------|
| ADMIN      | Todas                                                         |
| GERENTE    | Tudo exceto PERFIL_WRITE e USUARIO_WRITE                      |
| CONTADOR   | EMPRESA_READ/WRITE, DESPESA_READ/WRITE, IMPOSTO_READ/WRITE, RELATORIO_READ |
| VENDEDOR   | PRODUTO_READ, RELATORIO_READ                                  |
| LEITURA    | READ de todos os módulos                                      |

### Proteção dos resolvers — RBAC via claims JWT

Em Go com gqlgen, a autorização é feita manualmente no início de cada resolver, usando os claims extraídos do JWT via `gin.Context` injetado no contexto da requisição:

```go
func (r *mutationResolver) SalvarProduto(ctx context.Context, input model.ProdutoInput) (*model.Produto, error) {
    ginCtx := ctx.Value("GinContextKey").(*gin.Context)
    claims := jwt.ExtractClaims(ginCtx)

    permissoes := claims["permissoes"].([]interface{})
    if !contemPermissao(permissoes, "PRODUTO_WRITE") {
        return nil, fmt.Errorf("acesso negado: PRODUTO_WRITE necessário")
    }
    // lógica de negócio...
}

func contemPermissao(lista []interface{}, chave string) bool {
    for _, p := range lista {
        if p.(string) == chave { return true }
    }
    return false
}
```

> As permissões do usuário são carregadas no login (via `PayloadFunc` do gin-jwt) e viajam no JWT — sem consulta ao banco a cada request.

---

## 7. Autenticação JWT com Gin

- Login via `POST /login` (handler do gin-jwt) → retorna `{ token, expire }`
- O frontend envia o token no header `Authorization: Bearer <token>` a cada request GraphQL
- O token JWT deve conter os claims: `id` (usuario_id), `empresa_id`, `role`, `permissoes` (slice de chaves)
- O `empresa_id` no token é usado para isolamento de dados em todos os resolvers gqlgen
- Expiração: 8h (access token) / 24h (refresh token)
- Refresh via `POST /refresh` — sem re-login

**Estrutura dos claims no token:**

```json
{
  "id":          "uuid-do-usuario",
  "empresa_id":  "uuid-da-empresa",
  "role":        "ADMIN",
  "permissoes":  ["PRODUTO_READ", "PRODUTO_WRITE", "RELATORIO_READ"],
  "exp":         1751234567,
  "orig_iat":    1751198167
}
```

**Rotas públicas vs protegidas no Gin:**

```go
r.POST("/login",   auth.LoginHandler)   // público
r.POST("/refresh", auth.RefreshHandler) // público

api := r.Group("/", auth.MiddlewareFunc()) // tudo aqui exige token
{
    api.POST("/query", GraphQLHandler(db)) // único endpoint GraphQL
}
```

---

## 8. Estrutura de projeto recomendada (Go)

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
│   │   ├── empresa.go                     ← type Empresa struct + tags GORM
│   │   ├── despesa_fixa.go                ← type DespesaFixa struct
│   │   ├── material.go                    ← type Material struct
│   │   ├── produto.go                     ← type Produto struct
│   │   ├── produto_material.go            ← type ProdutoMaterial struct (ficha técnica)
│   │   ├── imposto.go                     ← type Imposto struct
│   │   ├── produto_imposto.go             ← type ProdutoImposto struct
│   │   ├── usuario.go                     ← type Usuario struct
│   │   ├── perfil.go                      ← type Perfil struct
│   │   ├── permissao.go                   ← type Permissao struct
│   │   └── usuario_empresa.go             ← type UsuarioEmpresa struct (N:M com perfil)
│   │
│   └── service/                           ← regras de negócio — 1 arquivo por agregado
│       ├── empresa_service.go             ← BuscarEmpresa, AtualizarEmpresa, %DF
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

### Responsabilidade de cada camada

| Camada | Responsabilidade | O que NÃO faz |
|--------|-----------------|---------------|
| `domain/` | Definir structs GORM com tags (`primaryKey`, `foreignKey`, `json`) | Nenhuma lógica — só tipos |
| `service/` | Toda regra de negócio: cálculos, validações, consultas ao GORM | Nada de HTTP, GraphQL ou JWT |
| `graph/` (resolvers) | Extrair claims do JWT, verificar permissão, chamar o service correto | Sem cálculos — apenas orquestração |

### Como o `Resolver` injeta os services

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

### Exemplo: service isola o cálculo, resolver apenas orquestra

```go
// internal/service/precificacao_service.go
type PrecificacaoService struct {
    DB *gorm.DB
}

func (s *PrecificacaoService) PrecificarProduto(produtoID, empresaID string) (*ResultadoPrecificacao, error) {
    // toda a lógica da fórmula Markup fica aqui
    // ...
}

// graph/schema.resolvers.go — thin resolver
func (r *queryResolver) PrecificarProduto(ctx context.Context, produtoID string) (*model.ResultadoPrecificacao, error) {
    ginCtx := ctx.Value("GinContextKey").(*gin.Context)
    claims := jwt.ExtractClaims(ginCtx)
    if !contemPermissao(claims, "RELATORIO_READ") {
        return nil, fmt.Errorf("acesso negado")
    }
    empresaID := claims["empresa_id"].(string)
    return r.PrecificacaoService.PrecificarProduto(produtoID, empresaID)
}
```

### Estrutura de um arquivo de domínio (exemplo: `produto.go`)

```go
// internal/domain/produto.go
package domain

type Produto struct {
    ID           string           `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    EmpresaID    string           `gorm:"type:uuid;not null;index"                       json:"empresa_id"`
    Nome         string           `gorm:"not null"                                       json:"nome"`
    Descricao    *string          `                                                      json:"descricao,omitempty"`
    Categoria    *string          `                                                      json:"categoria,omitempty"`
    MargemLucro  float64          `gorm:"not null"                                       json:"margem_lucro"`
    DescontoMax  float64          `gorm:"not null"                                       json:"desconto_maximo"`
    Ativo        bool             `gorm:"default:true"                                   json:"ativo"`
    Materiais    []ProdutoMaterial `gorm:"foreignKey:ProdutoID"                          json:"materiais"`
    Impostos     []ProdutoImposto  `gorm:"foreignKey:ProdutoID"                          json:"impostos"`
}
```

**Fluxo de geração de código:**

```bash
# 1. Editar graph/schema.graphqls
# 2. Regenerar código Go
go tool gqlgen generate
# 3. Implementar os métodos gerados em schema.resolvers.go (chamando services)
```

## 9. Endpoint e configuração esperada

```
POST http://localhost:8080/graphql
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "...",
  "variables": { ... }
}
```

O frontend já tem o endpoint configurado em `src/graphql/client.ts`:
```typescript
export const GQL_ENDPOINT = import.meta.env.VITE_GQL_ENDPOINT ?? 'http://localhost:8080/graphql'
```

A variável de ambiente do frontend é `VITE_GQL_ENDPOINT`.

---

## 10. Dados iniciais (seed)

O banco deve ser populado com:

1. **Impostos padrão:**
   - `SIMPLES_NACIONAL_ANEXO_II` — 4,5%
   - `SIMPLES_NACIONAL_ANEXO_I` — 4,0%
   - `SIMPLES_NACIONAL_ANEXO_III` — 6,0%

2. **Permissões** — todas as 16 chaves listadas na seção 6

3. **Perfis** — os 5 perfis padrão com suas permissões

4. **Usuário admin inicial** — para primeiro acesso

---

## 11. O que NÃO deve ir para o backend

- Formatação de moeda (R$) e percentual — responsabilidade do frontend (já usa `Intl.NumberFormat`)
- Ordenação e filtragem de listas na UI — o front pode fazer localmente após receber os dados
- Lógica de estado da interface (loading, modal aberto, tab ativa)

---

## 12. Referência rápida — Fórmula central

```
PV = CP / (1 - (Impostos + DF + ML + D) / 100)

Onde:
  CP  = SUM(quantidade_utilizada × custo_unitario)       [via PRODUTO_MATERIAL]
  DF  = SUM(valor_mensal_ativo) / faturamento_medio × 100 [via DESPESA_FIXA da EMPRESA]
  Impostos = SUM(aliquota_percentual)                     [via PRODUTO_IMPOSTO]
  ML  = produto.margem_lucro
  D   = produto.desconto_maximo
```

---

*Gerado em: 2026-06-27 — Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`*
