import type { Produto, ResultadoPrecificacao, AnexoSimples } from '@/types'
import type { Empresa, DespesaFixa, Material } from '@/types'

/** Limite do Fator R: folha ≥ 28% da receita → Anexo III (mais barato), senão Anexo V */
export const FATOR_R_LIMITE = 28

export function useMarkupCalculator() {
  function calcularPercentualDF(despesas: DespesaFixa[], faturamentoMedio: number): number {
    if (faturamentoMedio <= 0) return 0
    const totalDF = despesas.filter(d => d.ativa).reduce((acc, d) => acc + d.valorMensal, 0)
    return (totalDF / faturamentoMedio) * 100
  }

  /** Fator R (%) = folha de pagamento / faturamento. Base mensal = base anual (razão idêntica). */
  function calcularFatorR(empresa: Empresa): number {
    const folha = empresa.folhaPagamentoMensal ?? 0
    if (empresa.faturamentoMedioMensal <= 0) return 0
    return (folha / empresa.faturamentoMedioMensal) * 100
  }

  /**
   * Anexo efetivamente aplicado. Só há decisão de Fator R para SERVIÇOS no Simples:
   * Fator R ≥ 28% → Anexo III; caso contrário → Anexo V.
   */
  function resolverAnexo(empresa: Empresa): AnexoSimples | undefined {
    if (empresa.segmento === 'SERVICOS' && empresa.regimeTributario === 'SIMPLES_NACIONAL') {
      return calcularFatorR(empresa) >= FATOR_R_LIMITE ? 'ANEXO_III' : 'ANEXO_V'
    }
    return empresa.anexoSimples
  }

  function calcularCustoBase(produto: Produto, materiais: Material[]): number {
    return produto.materiais.reduce((acc, pm) => {
      const mat = materiais.find(m => m.id === pm.materialId)
      if (!mat) return acc
      return acc + pm.quantidadeUtilizada * mat.custoUnitario
    }, 0)
  }

  function calcularPrecificacao(
    produto: Produto,
    empresa: Empresa,
    despesas: DespesaFixa[],
    materiais: Material[]
  ): ResultadoPrecificacao {
    const custoBase = calcularCustoBase(produto, materiais)
    const percentualImpostos = produto.impostos.reduce((acc, pi) => acc + pi.aliquotaPercentual, 0)
    const percentualDF = calcularPercentualDF(despesas, empresa.faturamentoMedioMensal)
    const percentualML = produto.margemLucro
    const percentualD = produto.descontoMaximo

    const somaTotalPercentuais = percentualImpostos + percentualDF + percentualML + percentualD
    const divisorMarkup = 1 - somaTotalPercentuais / 100
    const precoVenda = divisorMarkup > 0 ? custoBase / divisorMarkup : 0

    const ehServico = empresa.segmento === 'SERVICOS'

    return {
      custoBase,
      percentualImpostos,
      percentualDespesasFixas: percentualDF,
      percentualMargemLucro: percentualML,
      percentualDesconto: percentualD,
      somaTotalPercentuais,
      divisorMarkup,
      precoVenda,
      fatorR: ehServico ? calcularFatorR(empresa) : undefined,
      anexoAplicado: ehServico ? resolverAnexo(empresa) : undefined,
      breakdown: {
        custoRecuperado: custoBase,
        valorImpostos: precoVenda * (percentualImpostos / 100),
        valorDespesasFixas: precoVenda * (percentualDF / 100),
        valorDesconto: precoVenda * (percentualD / 100),
        lucroLiquido: precoVenda * (percentualML / 100),
      }
    }
  }

  return { calcularPrecificacao, calcularCustoBase, calcularPercentualDF, calcularFatorR, resolverAnexo }
}

export function useCurrency() {
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtPct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })

  const formatCurrency = (v: number) => fmt.format(v)
  const formatPercent = (v: number) => `${fmtPct.format(v)}%`
  const formatNumber = (v: number, decimals = 2) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v)

  return { formatCurrency, formatPercent, formatNumber }
}
