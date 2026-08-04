/**
 * Impostos da empresa ativa. Segue o modelo de `materiais.ts`.
 *
 * A alíquota daqui é a **fonte** do `percentualImpostos` de todo produto que
 * referencia o imposto (C3): mudar uma alíquota muda o preço de vários produtos
 * — por isso o valor que a tela mostra é sempre o que o servidor devolveu, nunca
 * o que o formulário achava que ia gravar.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Imposto, ImpostoEntrada } from '@/types'
import { apolloClient } from '@/graphql/client'
import { IMPOSTOS, SALVAR_IMPOSTO } from '@/graphql/operations/catalogo'
import { mensagemDeErro } from '@/graphql/erros'
import { recursoDaEmpresaAtiva } from '@/composables/recursoDaEmpresaAtiva'
import { useEmpresaStore } from './empresa'
import { registrarResetDeSessao } from './reset'

export const useImpostosStore = defineStore('impostos', () => {
  const empresaStore = useEmpresaStore()
  const impostos = ref<Imposto[]>([])
  const erro = ref<string | null>(null)

  const recurso = recursoDaEmpresaAtiva({
    buscar: async (empresaId) => {
      const { data } = await apolloClient.query({ query: IMPOSTOS, variables: { empresaId } })
      return data.impostos as Imposto[]
    },
    aplicar: (dados) => { impostos.value = [...dados]; erro.value = null },
    limpar: () => { impostos.value = [] },
    aoFalhar: (e) => { erro.value = mensagemDeErro(e, 'impostos') },
  })

  function absorver(salvo: Imposto): void {
    const idx = impostos.value.findIndex(i => i.id === salvo.id)
    if (idx >= 0) impostos.value[idx] = salvo
    else impostos.value.push(salvo)
  }

  async function salvar(dados: Omit<ImpostoEntrada, 'empresaId'>): Promise<Imposto | null> {
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: SALVAR_IMPOSTO,
        variables: { input: { ...dados, empresaId: empresaStore.empresaAtivaId } },
      })
      absorver(data.salvarImposto)
      return data.salvarImposto
    } catch (e) {
      erro.value = mensagemDeErro(e, 'salvarImposto')
      return null
    }
  }

  function reset(): void {
    impostos.value = []
    erro.value = null
  }

  registrarResetDeSessao(reset)

  return {
    impostos,
    erro,
    loading: recurso.carregando,
    carregado: recurso.carregado,
    fetchImpostos: recurso.carregar,
    salvar,
    reset,
  }
})
