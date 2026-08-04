/**
 * Recurso que pertence à empresa ativa.
 *
 * Todo store de catálogo tem o mesmo ciclo: consultar pela empresa ativa,
 * recarregar quando ela muda, esvaziar quando não há empresa. Repetir isso em
 * cinco stores garante que eles divirjam na primeira manutenção — e um deles
 * ficaria sem a parte que importa:
 *
 * **O descarte de resposta atrasada.** Trocar de empresa duas vezes em sequência
 * dispara duas consultas; nada garante que voltem na ordem em que saíram. Se a
 * resposta da empresa anterior chegar por último, ela sobrescreve a lista e o
 * usuário fica olhando dados de outra empresa — exatamente o que B2/B9 proíbem,
 * acontecendo no cliente, sem erro nenhum na tela.
 *
 * Por isso este composable **aplica o resultado**, em vez de devolvê-lo ao
 * store: o `aplicar` só roda se a empresa pedida ainda for a ativa. Não é
 * convenção que se possa esquecer — é o caminho único.
 */
import { ref, watch, type Ref } from 'vue'
import { useEmpresaStore } from '@/stores/empresa'

export interface RecursoDaEmpresa<T> {
  /** Consulta que recebe a empresa e devolve os dados crus */
  buscar: (empresaId: string) => Promise<T>
  /** Guarda o resultado no store — só é chamado se a empresa ainda for a ativa */
  aplicar: (dados: T) => void
  /** Esvazia o store: sem empresa ativa, não há o que mostrar */
  limpar: () => void
  /** Traduz a falha para a mensagem da tela */
  aoFalhar: (erro: unknown) => void
}

export interface ControleDoRecurso {
  carregar: () => Promise<void>
  carregando: Ref<boolean>
  /** Já houve ao menos um carregamento nesta sessão de store */
  carregado: Ref<boolean>
}

export function recursoDaEmpresaAtiva<T>(recurso: RecursoDaEmpresa<T>): ControleDoRecurso {
  const empresa = useEmpresaStore()
  const carregando = ref(false)
  const carregado = ref(false)

  async function carregar(): Promise<void> {
    const empresaId = empresa.empresaAtivaId
    if (!empresaId) {
      recurso.limpar()
      return
    }

    carregando.value = true
    try {
      const dados = await recurso.buscar(empresaId)

      // A empresa mudou enquanto a resposta vinha: este resultado já não é o
      // desta tela. Descartar em silêncio é o comportamento certo — quem trocou
      // de empresa já disparou a consulta que vale.
      if (empresaId !== empresa.empresaAtivaId) return

      recurso.aplicar(dados)
      carregado.value = true
    } catch (erro) {
      if (empresaId !== empresa.empresaAtivaId) return
      recurso.limpar()
      recurso.aoFalhar(erro)
    } finally {
      // Só o pedido da empresa atual apaga o "carregando": senão a resposta
      // velha esconderia o spinner da consulta que ainda está em curso.
      if (empresaId === empresa.empresaAtivaId) carregando.value = false
    }
  }

  /**
   * Trocar de empresa esvazia **antes** de buscar: durante o carregamento a tela
   * mostra vazio, nunca o catálogo da empresa anterior.
   */
  watch(
    () => empresa.empresaAtivaId,
    (nova, anterior) => {
      if (nova === anterior) return
      recurso.limpar()
      carregado.value = false
      if (nova) void carregar()
    },
  )

  return { carregar, carregando, carregado }
}
