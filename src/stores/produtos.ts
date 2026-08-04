/**
 * Produtos da empresa ativa. Segue o modelo de `materiais.ts`, com duas
 * particularidades do contrato:
 *
 * - **`custoBase` e `percentualImpostos` chegam calculados** (C1/C3). O front
 *   não os refaz — refazer é como os dois lados passam a mostrar preços
 *   diferentes para o mesmo produto (B1).
 * - **`ajustarMargem` é mutation própria.** Mudar um número não deve exigir
 *   reenviar a ficha técnica inteira: um formulário desatualizado sobrescreveria
 *   a composição do produto sem ninguém pedir.
 *
 * Não há remoção — o contrato não tem, e a função que existia aqui não era
 * chamada por tela nenhuma.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Produto, ProdutoEntrada } from '@/types'
import { apolloClient } from '@/graphql/client'
import { PRODUTOS, SALVAR_PRODUTO, AJUSTAR_MARGEM } from '@/graphql/operations/catalogo'
import { mensagemDeErro } from '@/graphql/erros'
import { recursoDaEmpresaAtiva } from '@/composables/recursoDaEmpresaAtiva'
import { useEmpresaStore } from './empresa'
import { registrarResetDeSessao } from './reset'

export const useProdutosStore = defineStore('produtos', () => {
  const empresaStore = useEmpresaStore()
  const produtos = ref<Produto[]>([])
  const erro = ref<string | null>(null)

  const recurso = recursoDaEmpresaAtiva({
    buscar: async (empresaId) => {
      const { data } = await apolloClient.query({ query: PRODUTOS, variables: { empresaId } })
      return data.produtos as Produto[]
    },
    aplicar: (dados) => { produtos.value = [...dados]; erro.value = null },
    limpar: () => { produtos.value = [] },
    aoFalhar: (e) => { erro.value = mensagemDeErro(e, 'produtos') },
  })

  function absorver(salvo: Produto): void {
    const idx = produtos.value.findIndex(p => p.id === salvo.id)
    if (idx >= 0) produtos.value[idx] = salvo
    else produtos.value.push(salvo)
  }

  async function salvar(dados: Omit<ProdutoEntrada, 'empresaId'>): Promise<Produto | null> {
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: SALVAR_PRODUTO,
        variables: { input: { ...dados, empresaId: empresaStore.empresaAtivaId } },
      })
      absorver(data.salvarProduto)
      return data.salvarProduto
    } catch (e) {
      // Inclui a guarda V6 (material da ficha que não existe): o servidor recusa
      // em vez de calcular um custo menor do que o real.
      erro.value = mensagemDeErro(e, 'salvarProduto')
      return null
    }
  }

  async function ajustarMargem(produtoId: string, margemLucro: number): Promise<Produto | null> {
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: AJUSTAR_MARGEM,
        variables: { produtoId, margemLucro },
      })
      absorver(data.ajustarMargem)
      return data.ajustarMargem
    } catch (e) {
      erro.value = mensagemDeErro(e, 'ajustarMargem')
      return null
    }
  }

  function getProduto(id: string): Produto | undefined {
    return produtos.value.find(p => p.id === id)
  }

  function reset(): void {
    produtos.value = []
    erro.value = null
  }

  registrarResetDeSessao(reset)

  return {
    produtos,
    erro,
    loading: recurso.carregando,
    carregado: recurso.carregado,
    fetchProdutos: recurso.carregar,
    salvar,
    ajustarMargem,
    getProduto,
    reset,
  }
})
