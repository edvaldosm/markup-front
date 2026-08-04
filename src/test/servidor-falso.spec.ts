/**
 * O servidor falso precisa mentir **como o backend real mente**, senão os testes
 * que dependem dele provam o comportamento errado.
 *
 * Estes testes fixam as três regras que ele copia do `markup-back`:
 * a composição da ficha (C1), a soma de alíquotas (C3) e a recusa por alcance
 * (R02/R09) — que é FORBIDDEN, não lista vazia.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { apolloClient } from '@/graphql/client'
import { MATERIAIS, PRODUTOS, DESPESAS_FIXAS } from '@/graphql/operations/catalogo'
import { prepararAmbiente, entrarComo } from './app-harness'
import { mockMateriais, mockProdutos } from '@/mock/data'
import { type ServidorFalso } from './servidor-falso'

let servidor: ServidorFalso

beforeEach(() => {
  servidor = prepararAmbiente()
})

afterEach(() => {
  servidor.restaurar()
})

describe('servidor falso — catálogo', () => {
  it('devolve só os materiais da empresa pedida', async () => {
    await entrarComo('ana@docesdaana.com.br')

    const { data } = await apolloClient.query({ query: MATERIAIS, variables: { empresaId: '1' } })

    const esperados = mockMateriais.filter(m => m.empresaId === '1').length
    expect(data.materiais).toHaveLength(esperados)
    expect(esperados).toBeLessThan(mockMateriais.length)
  })

  it('monta a ficha com o material embutido e calcula custoBase (C1)', async () => {
    await entrarComo('ana@docesdaana.com.br')

    const { data } = await apolloClient.query({ query: PRODUTOS, variables: { empresaId: '1' } })
    const produto = data.produtos.find((p: { ficha: unknown[] }) => p.ficha.length > 0)

    expect(produto.ficha[0].material.nome).toBeTruthy()
    expect(produto.ficha[0].material.unidade).toBeTruthy()

    // C1 — soma de quantidade x custo unitário, conferida contra a linha do mock
    const registro = mockProdutos.find(p => p.id === produto.id)!
    const esperado = registro.materiais.reduce((soma, item) => {
      const material = mockMateriais.find(m => m.id === item.materialId)!
      return soma + item.quantidadeUtilizada * material.custoUnitario
    }, 0)
    expect(produto.custoBase).toBeCloseTo(esperado, 6)
  })

  it('percentualImpostos é a soma das alíquotas do cadastro (C3)', async () => {
    await entrarComo('ana@docesdaana.com.br')

    const { data } = await apolloClient.query({ query: PRODUTOS, variables: { empresaId: '1' } })
    const produto = data.produtos.find((p: { impostos: unknown[] }) => p.impostos.length > 0)

    const soma = produto.impostos.reduce(
      (total: number, imposto: { aliquotaPercentual: number }) => total + imposto.aliquotaPercentual,
      0,
    )
    expect(produto.percentualImpostos).toBeCloseTo(soma, 6)
  })

  it('empresa fora do alcance é recusa, não lista vazia', async () => {
    // Roberto só alcança a empresa 2; pedir a 1 é acesso indevido.
    await entrarComo('roberto@metalforte.com.br')

    await expect(
      apolloClient.query({ query: DESPESAS_FIXAS, variables: { empresaId: '1' } }),
    ).rejects.toMatchObject({
      graphQLErrors: [expect.objectContaining({
        extensions: expect.objectContaining({ classification: 'FORBIDDEN' }),
      })],
    })
  })

  it('ADMIN global alcança qualquer empresa', async () => {
    await entrarComo('admin@markup.com.br')

    const { data } = await apolloClient.query({ query: MATERIAIS, variables: { empresaId: '4' } })

    expect(data.materiais.length).toBeGreaterThan(0)
  })
})
