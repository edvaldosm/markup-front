/**
 * Faixa de negociação (C10–C12) — do preço de tabela ao piso do desconto máximo.
 *
 * O ponto que estes testes protegem: **negociar dentro da faixa não toca na
 * margem de lucro**. O desconto máximo já foi reservado no divisor, então o que
 * o vendedor concede sai da reserva — e o que ele não concede vira lucro extra.
 */
import { describe, it, expect } from 'vitest'
import { useMarkupCalculator } from './useMarkup'
import { mockProdutos, mockMateriais, mockDespesasFixas, mockEmpresas } from '@/mock/data'
import type { ResultadoPrecificacao } from '@/types'

const { calcularPrecificacao, calcularFaixaNegociacao } = useMarkupCalculator()

/** Resultado sintético: só o que a faixa consome */
function resultado(pv: number, ml: number, d: number): ResultadoPrecificacao {
  return {
    custoBase: 0,
    percentualImpostos: 0,
    percentualDespesasFixas: 0,
    percentualMargemLucro: ml,
    percentualDesconto: d,
    somaTotalPercentuais: ml + d,
    divisorMarkup: 1 - (ml + d) / 100,
    precoVenda: pv,
    breakdown: {
      custoRecuperado: 0, valorImpostos: 0, valorDespesasFixas: 0,
      valorDesconto: pv * (d / 100), lucroLiquido: pv * (ml / 100),
    },
  }
}

describe('faixa de negociação — extremos', () => {
  it('vai do preço de tabela ao preço com desconto máximo', () => {
    const faixa = calcularFaixaNegociacao(resultado(1000, 30, 10))

    expect(faixa.descontoMinimo).toBe(0)
    expect(faixa.descontoMaximo).toBe(10)
    expect(faixa.precoTabela).toBe(1000)
    expect(faixa.precoMinimo).toBeCloseTo(900, 6)
    expect(faixa.economiaMaxima).toBeCloseTo(100, 6)
  })

  it('no piso o lucro é exatamente a margem planejada', () => {
    const faixa = calcularFaixaNegociacao(resultado(1000, 30, 10))
    expect(faixa.lucroNoPiso).toBeCloseTo(300, 6)   // ML × PV
  })

  it('sem desconto o lucro é a margem MAIS a reserva', () => {
    const faixa = calcularFaixaNegociacao(resultado(1000, 30, 10))
    expect(faixa.lucroNoTeto).toBeCloseTo(400, 6)   // (ML + D) × PV
  })

  it('a margem efetiva cai conforme o desconto sobe', () => {
    const { degraus } = calcularFaixaNegociacao(resultado(1000, 30, 10))
    const margens = degraus.map(d => d.margemEfetiva)

    for (let i = 1; i < margens.length; i++) {
      expect(margens[i]).toBeLessThan(margens[i - 1])
    }
    // no piso: 300 / 900
    expect(margens[margens.length - 1]).toBeCloseTo(33.333, 2)
  })
})

describe('faixa de negociação — degraus', () => {
  it('gera 5 degraus do teto ao piso, em passos iguais', () => {
    const { degraus } = calcularFaixaNegociacao(resultado(1000, 30, 8))

    expect(degraus).toHaveLength(5)
    expect(degraus.map(d => d.desconto)).toEqual([0, 2, 4, 6, 8])
    expect(degraus[0].preco).toBeCloseTo(1000, 6)
    expect(degraus[degraus.length - 1].preco).toBeCloseTo(920, 6)
  })

  it('cada degrau perde preço e lucro na mesma proporção do desconto', () => {
    const { degraus } = calcularFaixaNegociacao(resultado(1000, 30, 8))

    for (const d of degraus) {
      expect(d.preco).toBeCloseTo(1000 * (1 - d.desconto / 100), 6)
      expect(d.lucro).toBeCloseTo(1000 * ((30 + 8 - d.desconto) / 100), 6)
      // o que se concede em preço é exatamente o que se perde em lucro
      // (teto = ML + D = 38% de 1000)
      expect(1000 - d.preco).toBeCloseTo(380 - d.lucro, 6)
    }
  })

  it('produto sem reserva de desconto tem faixa de um ponto só', () => {
    const faixa = calcularFaixaNegociacao(resultado(1000, 30, 0))

    expect(faixa.degraus).toHaveLength(1)
    expect(faixa.precoMinimo).toBe(faixa.precoTabela)
    expect(faixa.economiaMaxima).toBe(0)
    expect(faixa.lucroNoTeto).toBeCloseTo(faixa.lucroNoPiso, 6)
  })

  it('desconto negativo não inverte a faixa (guarda V9)', () => {
    const faixa = calcularFaixaNegociacao(resultado(1000, 30, -5))

    expect(faixa.descontoMaximo).toBe(0)
    expect(faixa.precoMinimo).toBe(1000)
    expect(faixa.economiaMaxima).toBe(0)
  })

  it('divisor inviável (PV = 0) não produz preço nem lucro negativos', () => {
    const faixa = calcularFaixaNegociacao(resultado(0, 30, 10))

    expect(faixa.precoTabela).toBe(0)
    expect(faixa.precoMinimo).toBe(0)
    expect(faixa.degraus.every(d => d.preco === 0 && d.lucro === 0)).toBe(true)
    expect(faixa.degraus.every(d => d.margemEfetiva === 0)).toBe(true)
  })
})

describe('faixa sobre um produto real do mock', () => {
  it('MVP de Startup (CodeLab): piso ≈ R$ 51.441,60 com ML preservada', () => {
    const produto = mockProdutos.find(p => p.id === 'prod-c01')!
    const empresa = mockEmpresas.find(e => e.id === '4')!
    const despesas = mockDespesasFixas.filter(d => d.empresaId === '4')
    const materiais = mockMateriais.filter(m => m.empresaId === '4')

    const res = calcularPrecificacao(produto, empresa, despesas, materiais)
    const faixa = calcularFaixaNegociacao(res)

    expect(res.custoBase).toBeCloseTo(10060, 2)
    expect(faixa.precoTabela).toBeCloseTo(res.precoVenda, 6)
    expect(faixa.precoMinimo).toBeCloseTo(res.precoVenda * 0.92, 6)

    // no piso sobra exatamente o lucro líquido do breakdown já exibido na tela
    expect(faixa.lucroNoPiso).toBeCloseTo(res.breakdown.lucroLiquido, 6)
    // e sem desconto sobra o lucro + a reserva
    expect(faixa.lucroNoTeto).toBeCloseTo(
      res.breakdown.lucroLiquido + res.breakdown.valorDesconto, 6
    )
    // o piso nunca fica abaixo do custo do serviço
    expect(faixa.precoMinimo).toBeGreaterThan(res.custoBase)
  })
})
