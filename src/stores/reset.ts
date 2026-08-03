/**
 * Registro de limpeza de sessão.
 *
 * O logout precisa esvaziar **todo** store de domínio: dado de uma empresa não
 * pode sobrar na tela do próximo usuário que logar na mesma aba (REQ-04). Uma
 * lista escrita à mão no `auth.ts` obrigaria a importar todos os stores lá — e
 * como cada um importa o `auth`, isso fecharia um ciclo. Aqui cada store se
 * anuncia ao ser criado.
 *
 * **Por que chavear pelo Pinia ativo:** um `Set` de módulo guardaria closures de
 * stores de instâncias antigas (cada teste cria um Pinia novo), crescendo sem
 * limite e mandando `reset()` para objetos mortos. O `WeakMap` mantém cada
 * registro preso à instância a que pertence, e ele some junto com ela.
 */
import { getActivePinia, type Pinia } from 'pinia'

const resetsPorPinia = new WeakMap<Pinia, Set<() => void>>()

/** Chamado por cada store de domínio, dentro do próprio setup. */
export function registrarResetDeSessao(reset: () => void): void {
  const pinia = getActivePinia()
  if (!pinia) return
  const registrados = resetsPorPinia.get(pinia) ?? new Set<() => void>()
  registrados.add(reset)
  resetsPorPinia.set(pinia, registrados)
}

/**
 * Esvazia todos os stores registrados. Só os que já foram instanciados têm o que
 * limpar — store nunca usado não tem estado.
 */
export function resetarStoresDeSessao(): void {
  const pinia = getActivePinia()
  if (!pinia) return
  resetsPorPinia.get(pinia)?.forEach(reset => reset())
}
