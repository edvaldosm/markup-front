/**
 * Despesas fixas da empresa ativa. Segue o modelo de `materiais.ts`, com uma
 * diferença própria:
 *
 * **Toda escrita recarrega a empresa.** O rateio (`percentualDespesasFixas`, C2)
 * é calculado pelo servidor a partir das despesas ativas — então alternar ou
 * salvar uma despesa muda um número que mora em `Empresa`, não aqui. Recalcular
 * esse percentual localmente seria criar a segunda fonte de verdade que a fatia
 * 1 acabou de eliminar (B1).
 *
 * **Não há exclusão**, no contrato nem aqui: despesa fixa entrou no rateio que
 * formou preços já praticados, e apagá-la destruiria a explicação daqueles
 * preços. Inativar produz o mesmo efeito no cálculo, preservando o histórico.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DespesaFixa, DespesaFixaEntrada } from '@/types'
import { apolloClient } from '@/graphql/client'
import {
  DESPESAS_FIXAS, SALVAR_DESPESA_FIXA, TOGGLE_DESPESA_FIXA,
} from '@/graphql/operations/catalogo'
import { mensagemDeErro } from '@/graphql/erros'
import { recursoDaEmpresaAtiva } from '@/composables/recursoDaEmpresaAtiva'
import { useEmpresaStore } from './empresa'
import { registrarResetDeSessao } from './reset'

export const useDespesasStore = defineStore('despesas', () => {
  const empresaStore = useEmpresaStore()
  const despesas = ref<DespesaFixa[]>([])
  const erro = ref<string | null>(null)

  /**
   * Soma em reais das despesas ativas — **agregação de exibição**, não cálculo
   * de domínio: é a mesma lista que está na tela, somada. O que decide preço é o
   * percentual, e esse vem do servidor.
   */
  const totalMensal = computed(() =>
    despesas.value.filter(d => d.ativa).reduce((soma, d) => soma + d.valorMensal, 0),
  )

  const recurso = recursoDaEmpresaAtiva({
    buscar: async (empresaId) => {
      const { data } = await apolloClient.query({ query: DESPESAS_FIXAS, variables: { empresaId } })
      return data.despesasFixas as DespesaFixa[]
    },
    aplicar: (dados) => { despesas.value = [...dados]; erro.value = null },
    limpar: () => { despesas.value = [] },
    aoFalhar: (e) => { erro.value = mensagemDeErro(e, 'despesasFixas') },
  })

  function absorver(salva: DespesaFixa): void {
    const idx = despesas.value.findIndex(d => d.id === salva.id)
    if (idx >= 0) despesas.value[idx] = salva
    else despesas.value.push(salva)
  }

  /** O rateio é da empresa: mudou despesa, o número dela precisa vir de novo. */
  async function recarregarRateio(): Promise<void> {
    await empresaStore.fetchEmpresas()
  }

  async function salvar(dados: Omit<DespesaFixaEntrada, 'empresaId'>): Promise<DespesaFixa | null> {
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: SALVAR_DESPESA_FIXA,
        variables: { input: { ...dados, empresaId: empresaStore.empresaAtivaId } },
      })
      absorver(data.salvarDespesaFixa)
      await recarregarRateio()
      return data.salvarDespesaFixa
    } catch (e) {
      erro.value = mensagemDeErro(e, 'salvarDespesaFixa')
      return null
    }
  }

  /** Substitui a exclusão: inativa sai do rateio, o histórico fica. */
  async function alternarAtiva(id: string, ativa: boolean): Promise<DespesaFixa | null> {
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: TOGGLE_DESPESA_FIXA,
        variables: { id, ativa },
      })
      absorver(data.toggleDespesaFixa)
      await recarregarRateio()
      return data.toggleDespesaFixa
    } catch (e) {
      erro.value = mensagemDeErro(e, 'toggleDespesaFixa')
      return null
    }
  }

  function reset(): void {
    despesas.value = []
    erro.value = null
  }

  registrarResetDeSessao(reset)

  return {
    despesas,
    erro,
    totalMensal,
    loading: recurso.carregando,
    carregado: recurso.carregado,
    fetchDespesas: recurso.carregar,
    salvar,
    alternarAtiva,
    reset,
  }
})
