/**
 * Precificação — fatia "integracao-backend-precificacao".
 *
 * A fórmula inteira (`CalculadoraDeMarkup.java`, C1–C12) roda no servidor. Estas
 * duas operações são a única fonte de preço de venda, breakdown e faixa de
 * negociação no sistema — não existe cálculo equivalente no front (Artigo III
 * v2.5.0).
 */
import { gql } from '@apollo/client/core'
import { CAMPOS_MATERIAL, CAMPOS_IMPOSTO } from './catalogo'

const CAMPOS_RESULTADO = gql`
  fragment CamposResultadoPrecificacao on ResultadoPrecificacao {
    produto {
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
    custoBase
    percentualImpostos
    percentualDespesasFixas
    percentualMargemLucro
    percentualDesconto
    somaTotalPercentuais
    divisorMarkup
    precoVenda
    fatorR
    anexoAplicado
    breakdown {
      custoRecuperado
      valorImpostos
      valorDespesasFixas
      valorDesconto
      lucroLiquido
    }
    faixaNegociacao {
      descontoMinimo
      descontoMaximo
      precoTabela
      precoMinimo
      economiaMaxima
      lucroNoTeto
      lucroNoPiso
      degraus {
        desconto
        preco
        lucro
        margemEfetiva
      }
    }
  }
  ${CAMPOS_MATERIAL}
  ${CAMPOS_IMPOSTO}
`

export const PRECIFICAR_PRODUTO = gql`
  query precificarProduto($produtoId: ID!) {
    precificarProduto(produtoId: $produtoId) {
      ...CamposResultadoPrecificacao
    }
  }
  ${CAMPOS_RESULTADO}
`

/**
 * Uma consulta para a empresa inteira — não N chamadas de `precificarProduto`.
 * É o que o Dashboard e Relatórios usam para a lista completa.
 */
export const PRECIFICAR_TODOS = gql`
  query precificarTodos($empresaId: ID!) {
    precificarTodos(empresaId: $empresaId) {
      ...CamposResultadoPrecificacao
    }
  }
  ${CAMPOS_RESULTADO}
`
