---
name: schema-graphql-markup
description: Schema GraphQL completo do backend Markup — tipos, enums, queries, mutations e inputs. Use ao editar graph/schema.graphqls ou alinhar contratos entre front e back.
metadata:
  domain: backend-markup
  kind: skill
  origin: IniciandoBackEndMarkup.md §4
---

# Schema GraphQL — Backend Markup

Fonte do contrato: `src/main/resources/graphql/schema.graphqls`, servido por
**Spring for GraphQL** em `POST /graphql`. Contrato-first: editar o schema
primeiro, depois os `@Controller` ([[R06-contrato-first-schema]]).

## Tipos principais

```graphql
type Empresa {
  id: ID!
  razaoSocial: String!
  cnpj: String!
  dono: Usuario!                     # proprietário (R09) — só dono/compartilhados/ADMIN veem
  regimeTributario: RegimeTributario!
  anexoSimples: AnexoSimples
  faturamentoMedioMensal: Float!
  percentualDespesasFixas: Float!   # calculado: SUM(despesas_ativas) / faturamento × 100
  despesasFixas: [DespesaFixa!]!
  produtos: [Produto!]!
  materiais: [Material!]!
}

type DespesaFixa { id: ID! descricao: String! valorMensal: Float! categoria: CategoriaDespesa! ativa: Boolean! }
type Material { id: ID! nome: String! unidade: UnidadeMedida! custoUnitario: Float! fornecedor: String estoque: Float }
type Imposto { id: ID! nome: String! chave: String! aliquotaPercentual: Float! descricao: String! ativo: Boolean! }
type ProdutoMaterial { material: Material! quantidadeUtilizada: Float! }
type ProdutoImposto { imposto: Imposto! aliquotaPercentual: Float! }

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
  # Fator R e anexo: só para SERVICOS no Simples; nulos nos demais casos — R10
  fatorR: Float
  anexoAplicado: AnexoSimples
  breakdown: BreakdownPrecificacao!
}

type BreakdownPrecificacao {
  custoRecuperado: Float!
  valorImpostos: Float!
  valorDespesasFixas: Float!
  valorDesconto: Float!
  lucroLiquido: Float!
}

# RBAC
type Permissao { id: ID! chave: String! descricao: String! modulo: String! }
type Perfil { id: ID! nome: String! descricao: String! permissoes: [Permissao!]! }
type Usuario { id: ID! nome: String! email: String! ativo: Boolean! empresas: [UsuarioEmpresa!]! }
type UsuarioEmpresa { empresa: Empresa! perfil: Perfil! }

# Auth
type AuthPayload { token: String! usuario: Usuario! empresa: Empresa! perfil: Perfil! }
```

## Enums

```graphql
enum RegimeTributario { SIMPLES_NACIONAL LUCRO_PRESUMIDO LUCRO_REAL MEI }
enum AnexoSimples { ANEXO_I ANEXO_II ANEXO_III ANEXO_IV ANEXO_V }
enum CategoriaDespesa { ALUGUEL ENERGIA GAS INTERNET PROLABORE CONTADOR OUTRO }
enum UnidadeMedida { KG G L ML UN CX PCT }
```

## Queries

```graphql
type Query {
  me: Usuario!
  minhaEmpresa: Empresa!
  despesasFixas: [DespesaFixa!]!
  materiais: [Material!]!
  material(id: ID!): Material
  impostos: [Imposto!]!
  produtos: [Produto!]!
  produto(id: ID!): Produto
  precificarProduto(produtoId: ID!): ResultadoPrecificacao!   # cálculo centralizado
  precificarTodos: [ResultadoPrecificacao!]!
  perfis: [Perfil!]!
  permissoes: [Permissao!]!
  usuarios: [Usuario!]!

  # Multi-empresa — só as empresas autorizadas ao usuário (todas se ADMIN) — R09
  minhasEmpresas: [Empresa!]!

  # Assistente RAG — só formação de preço, com guardrails no backend — R08
  perguntarAssistente(pergunta: String!): RespostaAssistente!
}

type RespostaAssistente {
  status: AssistenteStatus!
  texto: String!
  fontes: [String!]!
}

enum AssistenteStatus { OK  FORA_DE_ESCOPO  RECUSADO  SEM_FONTE }
```

## Mutations

```graphql
type Mutation {
  login(email: String!, senha: String!): AuthPayload!
  atualizarEmpresa(input: EmpresaInput!): Empresa!
  salvarDespesaFixa(input: DespesaFixaInput!): DespesaFixa!
  removerDespesaFixa(id: ID!): Boolean!
  toggleDespesaFixa(id: ID!, ativa: Boolean!): DespesaFixa!
  salvarMaterial(input: MaterialInput!): Material!
  removerMaterial(id: ID!): Boolean!
  salvarImposto(input: ImpostoInput!): Imposto!
  toggleImposto(id: ID!, ativo: Boolean!): Imposto!
  salvarProduto(input: ProdutoInput!): Produto!
  removerProduto(id: ID!): Boolean!
  toggleProduto(id: ID!, ativo: Boolean!): Produto!
  salvarPerfil(input: PerfilInput!): Perfil!
  atribuirPermissaoAoPerfil(perfilId: ID!, permissaoId: ID!): Perfil!
  revogarPermissaoDoPerfil(perfilId: ID!, permissaoId: ID!): Perfil!
  convidarUsuario(input: ConviteUsuarioInput!): Usuario!
  alterarPerfilUsuario(usuarioEmpresaId: ID!, perfilId: ID!): UsuarioEmpresa!
  toggleUsuario(id: ID!, ativo: Boolean!): Usuario!
}
```

## Inputs

```graphql
input EmpresaInput { razaoSocial: String! cnpj: String! regimeTributario: RegimeTributario! anexoSimples: AnexoSimples faturamentoMedioMensal: Float! }
input DespesaFixaInput { id: ID descricao: String! valorMensal: Float! categoria: CategoriaDespesa! ativa: Boolean! }
input MaterialInput { id: ID nome: String! unidade: UnidadeMedida! custoUnitario: Float! fornecedor: String estoque: Float }
input ImpostoInput { id: ID nome: String! chave: String! aliquotaPercentual: Float! descricao: String! }
input ProdutoMaterialInput { materialId: ID! quantidadeUtilizada: Float! }
input ProdutoImpostoInput { impostoId: ID! aliquotaPercentual: Float! }
input ProdutoInput { id: ID nome: String! descricao: String categoria: String margemLucro: Float! descontoMaximo: Float! materiais: [ProdutoMaterialInput!]! impostos: [ProdutoImpostoInput!]! }
input PerfilInput { id: ID nome: String! descricao: String! }
input ConviteUsuarioInput { nome: String! email: String! senha: String! perfilId: ID! }
```

> `id: ID` em inputs: `null` = criar, preenchido = editar.

Endpoint: `POST http://localhost:8080/graphql` com `Authorization: Bearer <token>`.
Front: `VITE_GQL_ENDPOINT` em `src/graphql/client.ts`.
