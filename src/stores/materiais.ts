/**
 * Materiais da empresa ativa.
 *
 * **Modelo dos stores de catálogo da fatia 2.** O formato aqui é o que os
 * outros quatro repetem:
 *
 * - a lista é o que o **servidor** devolveu — não há `computed` filtrando por
 *   empresa, porque filtro no cliente sobre lista já filtrada só serviria para
 *   esconder erro do servidor (B2/B9);
 * - carga e recarga vivem em `recursoDaEmpresaAtiva`, que também descarta
 *   resposta atrasada da empresa anterior;
 * - `erro` guarda mensagem pronta para a tela, para que falha de rede nunca
 *   apareça como "nenhum registro encontrado" (REQ-16);
 * - `reset()` registrado: o logout esvazia tudo (REQ-04 da fatia 1).
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Material, MaterialEntrada } from '@/types'
import { apolloClient } from '@/graphql/client'
import { MATERIAIS, SALVAR_MATERIAL } from '@/graphql/operations/catalogo'
import { mensagemDeErro } from '@/graphql/erros'
import { recursoDaEmpresaAtiva } from '@/composables/recursoDaEmpresaAtiva'
import { useEmpresaStore } from './empresa'
import { registrarResetDeSessao } from './reset'

export const useMateriaisStore = defineStore('materiais', () => {
  const empresaStore = useEmpresaStore()
  const materiais = ref<Material[]>([])
  const erro = ref<string | null>(null)

  const recurso = recursoDaEmpresaAtiva({
    buscar: async (empresaId) => {
      const { data } = await apolloClient.query({ query: MATERIAIS, variables: { empresaId } })
      return data.materiais as Material[]
    },
    // Cópia: o Apollo devolve o resultado congelado, e uma escrita posterior
    // faria `push` num array não extensível.
    aplicar: (dados) => { materiais.value = [...dados]; erro.value = null },
    limpar: () => { materiais.value = [] },
    aoFalhar: (e) => { erro.value = mensagemDeErro(e, 'materiais') },
  })

  /** Guarda a resposta do servidor no lugar do item correspondente. */
  function absorver(salvo: Material): void {
    const idx = materiais.value.findIndex(m => m.id === salvo.id)
    if (idx >= 0) materiais.value[idx] = salvo
    else materiais.value.push(salvo)
  }

  async function salvar(dados: Omit<MaterialEntrada, 'empresaId'>): Promise<Material | null> {
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: SALVAR_MATERIAL,
        variables: { input: { ...dados, empresaId: empresaStore.empresaAtivaId } },
      })
      absorver(data.salvarMaterial)
      return data.salvarMaterial
    } catch (e) {
      erro.value = mensagemDeErro(e, 'salvarMaterial')
      return null
    }
  }

  function reset(): void {
    materiais.value = []
    erro.value = null
  }

  registrarResetDeSessao(reset)

  return {
    materiais,
    erro,
    loading: recurso.carregando,
    carregado: recurso.carregado,
    fetchMateriais: recurso.carregar,
    salvar,
    reset,
  }
})
