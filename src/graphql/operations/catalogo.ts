/**
 * Operações do catálogo — fatia 2 da integração.
 *
 * Duas coisas que o contrato faz diferente do protótipo e aparecem aqui:
 *
 * - **A ficha vem resolvida.** `ficha` traz o `Material` inteiro; o front não
 *   cruza mais `materialId` contra uma lista em memória.
 * - **`custoBase` e `percentualImpostos` vêm calculados** (C1/C3, B1). Pedimos
 *   os números; não os refazemos.
 */
import { gql } from '@apollo/client/core'

export const CAMPOS_MATERIAL = gql`
  fragment CamposMaterial on Material {
    id
    nome
    unidade
    custoUnitario
    fornecedor
    tipo
    estoque
  }
`

export const CAMPOS_IMPOSTO = gql`
  fragment CamposImposto on Imposto {
    id
    chave
    nome
    descricao
    aliquotaPercentual
    ativo
  }
`

export const CAMPOS_DESPESA = gql`
  fragment CamposDespesa on DespesaFixa {
    id
    descricao
    valorMensal
    categoria
    ativa
  }
`

const CAMPOS_PRODUTO = gql`
  fragment CamposProduto on Produto {
    id
    nome
    descricao
    categoria
    tipo
    margemLucro
    descontoMaximo
    ativo
    ficha {
      material {
        ...CamposMaterial
      }
      quantidadeUtilizada
      unidade
    }
    impostos {
      ...CamposImposto
    }
    custoBase
    percentualImpostos
  }
  ${CAMPOS_MATERIAL}
  ${CAMPOS_IMPOSTO}
`

// ─── Consultas ────────────────────────────────────────────────────────────────

export const PRODUTOS = gql`
  query produtos($empresaId: ID!) {
    produtos(empresaId: $empresaId) {
      ...CamposProduto
    }
  }
  ${CAMPOS_PRODUTO}
`

export const PRODUTO = gql`
  query produto($id: ID!) {
    produto(id: $id) {
      ...CamposProduto
    }
  }
  ${CAMPOS_PRODUTO}
`

export const MATERIAIS = gql`
  query materiais($empresaId: ID!) {
    materiais(empresaId: $empresaId) {
      ...CamposMaterial
    }
  }
  ${CAMPOS_MATERIAL}
`

export const IMPOSTOS = gql`
  query impostos($empresaId: ID!) {
    impostos(empresaId: $empresaId) {
      ...CamposImposto
    }
  }
  ${CAMPOS_IMPOSTO}
`

export const DESPESAS_FIXAS = gql`
  query despesasFixas($empresaId: ID!) {
    despesasFixas(empresaId: $empresaId) {
      ...CamposDespesa
    }
  }
  ${CAMPOS_DESPESA}
`

// ─── Escritas ─────────────────────────────────────────────────────────────────

export const SALVAR_PRODUTO = gql`
  mutation salvarProduto($input: ProdutoInput!) {
    salvarProduto(input: $input) {
      ...CamposProduto
    }
  }
  ${CAMPOS_PRODUTO}
`

/**
 * Mutation própria, em vez de `salvarProduto`: mudar um número não deve exigir
 * reenviar a ficha técnica inteira — e reenviá-la abriria espaço para um
 * formulário desatualizado sobrescrever a composição do produto.
 */
export const AJUSTAR_MARGEM = gql`
  mutation ajustarMargem($produtoId: ID!, $margemLucro: BigDecimal!) {
    ajustarMargem(produtoId: $produtoId, margemLucro: $margemLucro) {
      ...CamposProduto
    }
  }
  ${CAMPOS_PRODUTO}
`

/**
 * "Salvar" da Simulação Manual: grava margem e desconto juntos, numa versão
 * só — chamar `ajustarMargem` e um ajuste de desconto em separado abriria
 * duas versões pra uma decisão só.
 */
export const AJUSTAR_MARGEM_E_DESCONTO = gql`
  mutation ajustarMargemEDesconto($produtoId: ID!, $margemLucro: BigDecimal!, $descontoMaximo: BigDecimal!) {
    ajustarMargemEDesconto(produtoId: $produtoId, margemLucro: $margemLucro, descontoMaximo: $descontoMaximo) {
      ...CamposProduto
    }
  }
  ${CAMPOS_PRODUTO}
`

/** Mais recente primeiro; exatamente uma tem dataFim nula (a vigente). */
export const HISTORICO_DO_PRODUTO = gql`
  query historicoDoProduto($produtoId: ID!) {
    historicoDoProduto(produtoId: $produtoId) {
      id
      margemLucro
      descontoMaximo
      dataInicio
      dataFim
    }
  }
`

/**
 * Não volta no tempo de verdade: fecha a versão vigente e abre uma nova com
 * os valores da versão escolhida — o histórico só cresce.
 */
export const REATIVAR_VERSAO_PRODUTO = gql`
  mutation reativarVersaoProduto($versaoId: ID!) {
    reativarVersaoProduto(versaoId: $versaoId) {
      ...CamposProduto
    }
  }
  ${CAMPOS_PRODUTO}
`

/**
 * Exclusão de verdade — emenda de REQ-02 (06-08-2026). O servidor recusa
 * excluir a versão vigente (nunca fica sem versão aberta); o front só
 * precisa tratar o erro, não repetir a checagem.
 */
export const EXCLUIR_VERSAO_PRODUTO = gql`
  mutation excluirVersaoProduto($versaoId: ID!) {
    excluirVersaoProduto(versaoId: $versaoId)
  }
`

export const SALVAR_MATERIAL = gql`
  mutation salvarMaterial($input: MaterialInput!) {
    salvarMaterial(input: $input) {
      ...CamposMaterial
    }
  }
  ${CAMPOS_MATERIAL}
`

export const SALVAR_IMPOSTO = gql`
  mutation salvarImposto($input: ImpostoInput!) {
    salvarImposto(input: $input) {
      ...CamposImposto
    }
  }
  ${CAMPOS_IMPOSTO}
`

export const SALVAR_DESPESA_FIXA = gql`
  mutation salvarDespesaFixa($input: DespesaFixaInput!) {
    salvarDespesaFixa(input: $input) {
      ...CamposDespesa
    }
  }
  ${CAMPOS_DESPESA}
`

/**
 * Alternar é o que substitui excluir: despesa inativa sai do rateio (C2) sem
 * apagar o histórico que explica preços já praticados.
 */
export const TOGGLE_DESPESA_FIXA = gql`
  mutation toggleDespesaFixa($id: ID!, $ativa: Boolean!) {
    toggleDespesaFixa(id: $id, ativa: $ativa) {
      ...CamposDespesa
    }
  }
  ${CAMPOS_DESPESA}
`
