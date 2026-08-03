import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Empresa, EmpresaEntrada } from '@/types'
import { apolloClient } from '@/graphql/client'
import { MINHAS_EMPRESAS, SALVAR_EMPRESA } from '@/graphql/operations/acesso'
import { mensagemDeErro } from '@/graphql/erros'
import { registrarResetDeSessao } from './reset'

/** Empresa ativa sobrevive ao F5 — a escolha do usuário, não da aplicação. */
const CHAVE_EMPRESA_ATIVA = 'markup.empresaAtiva'

function lerEmpresaAtivaGuardada(): string {
  try {
    return localStorage.getItem(CHAVE_EMPRESA_ATIVA) ?? ''
  } catch {
    return ''
  }
}

function guardarEmpresaAtiva(id: string): void {
  try {
    if (id) localStorage.setItem(CHAVE_EMPRESA_ATIVA, id)
    else localStorage.removeItem(CHAVE_EMPRESA_ATIVA)
  } catch {
    /* sem persistência: a empresa ativa volta ao padrão no próximo F5 */
  }
}

export const useEmpresaStore = defineStore('empresa', () => {
  /**
   * O conjunto que o **servidor** autorizou (`minhasEmpresas`, B9). O front não
   * filtra: filtro de isolamento que roda no navegador é filtro que o usuário
   * pode desligar.
   */
  const empresas = ref<Empresa[]>([])
  /** Id da empresa ativa; `''` = nenhuma (usuário sem empresa autorizada) */
  const empresaAtivaId = ref<string>(lerEmpresaAtivaGuardada())
  const loading = ref(false)
  const erro = ref<string | null>(null)

  /** Empresa atualmente selecionada — todos os demais stores filtram por ela */
  const empresa = computed<Empresa | null>(
    () => empresas.value.find(e => e.id === empresaAtivaId.value) ?? null,
  )

  /** Usuário autenticado sem nenhuma empresa: estado válido, não erro (REQ-08). */
  const semEmpresas = computed(() => !loading.value && empresas.value.length === 0)

  function definirEmpresaAtiva(id: string): void {
    empresaAtivaId.value = id
    guardarEmpresaAtiva(id)
  }

  async function fetchEmpresas(): Promise<void> {
    loading.value = true
    erro.value = null
    try {
      const { data } = await apolloClient.query({ query: MINHAS_EMPRESAS })
      // Cópia: o Apollo devolve o resultado **congelado**, e uma criação
      // posterior faria `push` num array não extensível — TypeError longe da
      // causa. O estado do store é nosso; o do cache é dele.
      empresas.value = [...data.minhasEmpresas]
      // A empresa guardada pode ter deixado de ser autorizada (vínculo removido)
      // ou ser de outro usuário que usou esta aba: cai na primeira disponível.
      if (!empresas.value.some(e => e.id === empresaAtivaId.value)) {
        definirEmpresaAtiva(empresas.value[0]?.id ?? '')
      }
    } catch (e) {
      // Lista vazia por falha de rede não pode parecer "você não tem empresas".
      erro.value = mensagemDeErro(e, 'minhasEmpresas')
      empresas.value = []
    } finally {
      loading.value = false
    }
  }

  /** Alias de compatibilidade — antigo carregamento mono-empresa */
  const fetchEmpresa = fetchEmpresas

  /**
   * Seleciona a empresa ativa. Ids fora do conjunto devolvido pelo servidor são
   * ignorados — não como controle de segurança (esse é do backend), mas para a
   * UI não entrar num estado que toda consulta seguinte vai recusar.
   */
  function selecionarEmpresa(id: string): boolean {
    if (!empresas.value.some(e => e.id === id)) return false
    definirEmpresaAtiva(id)
    return true
  }

  /** Guarda a resposta do servidor no lugar da empresa correspondente. */
  function absorver(salva: Empresa): void {
    const idx = empresas.value.findIndex(e => e.id === salva.id)
    if (idx >= 0) empresas.value[idx] = salva
    else empresas.value.push(salva)
  }

  async function salvarEmpresa(dados: EmpresaEntrada): Promise<Empresa | null> {
    loading.value = true
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: SALVAR_EMPRESA,
        variables: { input: { ...dados, id: dados.id ?? empresaAtivaId.value } },
      })
      absorver(data.salvarEmpresa)
      return data.salvarEmpresa
    } catch (e) {
      erro.value = mensagemDeErro(e, 'salvarEmpresa')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Cria uma nova empresa e a seleciona. O **dono é definido pelo servidor** a
   * partir do token (R09) — por isso `input` não tem `donoUsuarioId`, e o
   * `percentualDespesasFixas` vem calculado (C2), não enviado.
   */
  async function criarEmpresa(dados: EmpresaEntrada): Promise<Empresa | null> {
    loading.value = true
    erro.value = null
    try {
      const { data } = await apolloClient.mutate({
        mutation: SALVAR_EMPRESA,
        variables: { input: { ...dados, id: null } },
      })
      const nova: Empresa = data.salvarEmpresa
      absorver(nova)
      definirEmpresaAtiva(nova.id)
      return nova
    } catch (e) {
      erro.value = mensagemDeErro(e, 'salvarEmpresa')
      return null
    } finally {
      loading.value = false
    }
  }

  /** Limpa o estado ao trocar de usuário (logout/login) */
  function reset(): void {
    empresas.value = []
    erro.value = null
    definirEmpresaAtiva('')
  }

  registrarResetDeSessao(reset)

  return {
    empresas, empresaAtivaId, empresa, loading, erro, semEmpresas,
    fetchEmpresas, fetchEmpresa, selecionarEmpresa, salvarEmpresa, criarEmpresa, reset,
  }
})
