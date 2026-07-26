# 05 — Schema GraphQL

> Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

> Este é o conteúdo do arquivo `graph/schema.graphqls`.
> Após qualquer alteração rodar: `go tool gqlgen generate`

---

## Tipos principais

```graphql
type Empresa {
  id: ID!
  razaoSocial: String!
  cnpj: String!
  segmento: SegmentoNegocio!
  regimeTributario: RegimeTributario!
  anexoSimples: AnexoSimples
  faturamentoMedioMensal: Float!
  folhaPagamentoMensal: Float               # numerador do Fator R (serviços)
  percentualDespesasFixas: Float!           # calculado: SUM(despesas_ativas) / faturamento × 100
  fatorR: Float                             # calculado: folha / faturamento × 100 (só serviços)
  anexoAplicado: AnexoSimples               # calculado: Fator R decide III vs V (serviços)
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
  custoUnitario: Float!          # para serviços: custo/hora da mão de obra
  tipo: TipoMaterial!           # INSUMO | MAO_DE_OBRA
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
  tipo: TipoProduto!            # PRODUTO | SERVICO
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
  fatorR: Float                 # serviços: folha / faturamento × 100
  anexoAplicado: AnexoSimples   # serviços: anexo escolhido pelo Fator R
  breakdown: BreakdownPrecificacao!
}

type BreakdownPrecificacao {
  custoRecuperado: Float!
  valorImpostos: Float!
  valorDespesasFixas: Float!
  valorDesconto: Float!
  lucroLiquido: Float!
}
```

---

## Tipos RBAC e Auth

```graphql
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

type AuthPayload {
  token: String!
  usuario: Usuario!
  empresa: Empresa!
  perfil: Perfil!
}
```

---

## Enums

```graphql
enum SegmentoNegocio {
  CONFEITARIA
  INDUSTRIA
  SERVICOS
}

enum TipoMaterial {
  INSUMO
  MAO_DE_OBRA
}

enum TipoProduto {
  PRODUTO
  SERVICO
}

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
  H      # hora (mão de obra em serviços)
  PC     # peça
  TON    # tonelada
  M      # metro linear
  M2     # metro quadrado
}
```

---

## Queries

```graphql
type Query {
  # Auth / contexto
  me: Usuario!

  # Empresas do usuário logado (multi-empresa — alimenta o seletor)
  minhasEmpresas: [Empresa!]!
  # Empresa ativa (a do contexto/JWT atual)
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

---

## Mutations

```graphql
type Mutation {
  # Auth
  login(email: String!, senha: String!): AuthPayload!

  # Empresa
  criarEmpresa(input: EmpresaInput!): Empresa!      # cria nova empresa e vincula o usuário logado como ADMIN
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

---

## Inputs

```graphql
input EmpresaInput {
  razaoSocial: String!
  cnpj: String!
  segmento: SegmentoNegocio!
  regimeTributario: RegimeTributario!
  anexoSimples: AnexoSimples
  faturamentoMedioMensal: Float!
  folhaPagamentoMensal: Float
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
  tipo: TipoMaterial!
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
  tipo: TipoProduto!
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
