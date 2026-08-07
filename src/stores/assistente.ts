/**
 * Store de sessão do assistente — não é store de domínio (F2): não filtra
 * por empresa ativa nem reseta ao trocar de empresa, só ao logout
 * (`registrarResetDeSessao`, mesmo mecanismo das stores de domínio). Só
 * **lê** `empresaStore.empresaAtivaId` para mandar no argumento `empresaId`
 * de cada pergunta — a conversa em si é do usuário, não da empresa.
 *
 * Duas memórias diferentes, de propósito:
 * - `mensagens` — janela deslizante de `maxMensagens` (padrão 10), só o que
 *   a **tela mostra**. Nunca persiste (`localStorage`/`sessionStorage`).
 * - `threadId` — id da conversa que o **backend** mantém (memória real do
 *   LLM, com seu próprio teto e TTL de ociosidade). A store só guarda o id
 *   para reenviar na próxima pergunta; o conteúdo da memória em si nunca
 *   trafega para o front (F8).
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MensagemAssistente } from '@/types'
import { apolloClient } from '@/graphql/client'
import { PERGUNTAR_ASSISTENTE } from '@/graphql/operations/assistente'
import { mensagemDeErro } from '@/graphql/erros'
import { useEmpresaStore } from './empresa'
import { registrarResetDeSessao } from './reset'

export const useAssistenteStore = defineStore('assistente', () => {
  const empresaStore = useEmpresaStore()

  const mensagens = ref<MensagemAssistente[]>([])
  const threadId = ref<string | null>(null)
  const carregando = ref(false)
  const erro = ref<string | null>(null)
  const maxMensagens = ref(10)

  function definirMaxMensagens(valor: number): void {
    maxMensagens.value = valor
  }

  function adicionar(mensagem: MensagemAssistente): void {
    mensagens.value.push(mensagem)
    if (mensagens.value.length > maxMensagens.value) {
      mensagens.value = mensagens.value.slice(-maxMensagens.value)
    }
  }

  function limpar(): void {
    mensagens.value = []
    threadId.value = null
    erro.value = null
  }

  registrarResetDeSessao(limpar)

  /**
   * `network-only`: a pergunta tem efeito no servidor (RAG + atualização da
   * conversa) — cachear por variável faria repetir a mesma pergunta na
   * mesma conversa devolver uma resposta velha, sem novo turno de RAG.
   */
  async function perguntar(pergunta: string): Promise<void> {
    adicionar({ autor: 'usuario', texto: pergunta, criadaEm: new Date().toISOString() })
    carregando.value = true
    erro.value = null
    try {
      const { data } = await apolloClient.query({
        query: PERGUNTAR_ASSISTENTE,
        variables: {
          pergunta,
          empresaId: empresaStore.empresaAtivaId || null,
          threadId: threadId.value,
        },
        fetchPolicy: 'network-only',
      })
      const resposta = data.perguntarAssistente
      threadId.value = resposta.threadId
      adicionar({
        autor: 'assistente',
        texto: resposta.texto,
        status: resposta.status,
        fontes: resposta.fontes,
        criadaEm: new Date().toISOString(),
      })
    } catch (e) {
      erro.value = mensagemDeErro(e, 'perguntarAssistente')
    } finally {
      carregando.value = false
    }
  }

  return {
    mensagens, threadId, carregando, erro, maxMensagens,
    definirMaxMensagens, adicionar, limpar, perguntar,
  }
})
