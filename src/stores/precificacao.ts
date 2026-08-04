/**
 * Precificação — a fórmula inteira (C1–C12) roda no servidor
 * (`CalculadoraDeMarkup.java`). Este store só busca e guarda; nenhuma linha
 * aqui calcula preço, divisor, breakdown ou faixa de negociação (Artigo III
 * v2.5.0).
 *
 * Separado de `produtos.ts` de propósito: produto é cadastro, precificação é
 * saída derivada que muda quando *qualquer* insumo do custo muda — material,
 * imposto, despesa, margem. Misturar os dois criaria reatividade implícita
 * difícil de rastrear.
 */
import { defineStore } from 'pinia'
import { reactive, ref, watch } from 'vue'
import type { ResultadoPrecificacao } from '@/types'
import { apolloClient } from '@/graphql/client'
import { PRECIFICAR_PRODUTO, PRECIFICAR_TODOS } from '@/graphql/operations/precificacao'
import { mensagemDeErro } from '@/graphql/erros'
import { recursoDaEmpresaAtiva } from '@/composables/recursoDaEmpresaAtiva'
import { useEmpresaStore } from './empresa'
import { registrarResetDeSessao } from './reset'

export const usePrecificacaoStore = defineStore('precificacao', () => {
  const empresaStore = useEmpresaStore()

  /** Cache por produto — várias telas podem pedir o mesmo produto sem repetir a consulta. */
  const porProdutoId = reactive(new Map<string, ResultadoPrecificacao>())
  const erroProduto = ref<string | null>(null)

  /** Lista da empresa ativa — Dashboard e Relatórios, **uma** consulta para todos. */
  const todos = ref<ResultadoPrecificacao[]>([])

  const recurso = recursoDaEmpresaAtiva({
    buscar: async (empresaId) => {
      const { data } = await apolloClient.query({
        query: PRECIFICAR_TODOS,
        variables: { empresaId },
        fetchPolicy: 'network-only', // preço muda a cada escrita no catálogo; nunca servir do cache
      })
      return data.precificarTodos as ResultadoPrecificacao[]
    },
    aplicar: (dados) => { todos.value = [...dados]; erro.value = null },
    limpar: () => { todos.value = [] },
    aoFalhar: (e) => { erro.value = mensagemDeErro(e, 'precificarTodos') },
  })

  const erro = ref<string | null>(null)

  async function buscarProduto(produtoId: string): Promise<ResultadoPrecificacao | null> {
    erroProduto.value = null
    try {
      const { data } = await apolloClient.query({
        query: PRECIFICAR_PRODUTO,
        variables: { produtoId },
        fetchPolicy: 'network-only',
      })
      const resultado = data.precificarProduto as ResultadoPrecificacao
      porProdutoId.set(produtoId, resultado)
      return resultado
    } catch (e) {
      // Inclui V1 (divisor inviável): o erro chega como mensagem, nunca como
      // preço zerado silencioso.
      erroProduto.value = mensagemDeErro(e, 'precificarProduto')
      porProdutoId.delete(produtoId)
      return null
    }
  }

  function resultadoDe(produtoId: string): ResultadoPrecificacao | undefined {
    return porProdutoId.get(produtoId)
  }

  // Cache por produto não sobrevive à troca de empresa: nenhum resultado de
  // uma empresa deve ficar acessível depois que o usuário sai dela.
  watch(() => empresaStore.empresaAtivaId, () => porProdutoId.clear())

  function reset(): void {
    porProdutoId.clear()
    erroProduto.value = null
    todos.value = []
    erro.value = null
  }

  registrarResetDeSessao(reset)

  return {
    porProdutoId,
    erroProduto,
    todos,
    erro,
    loading: recurso.carregando,
    carregado: recurso.carregado,
    buscarProduto,
    buscarTodos: recurso.carregar,
    resultadoDe,
    reset,
  }
})
